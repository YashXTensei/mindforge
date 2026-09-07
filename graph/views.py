"""
Knowledge Graph API Views.

Three endpoints:
  1. GET /api/graph/network/       — Full graph data for react-force-graph-2d
  2. GET /api/graph/topics/<id>/claims/ — Claims for a clicked node
  3. GET /api/graph/analyze-gap/?target=<id> — Gap analysis for a target topic
"""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Claim
from .serializers import ClaimSerializer
from .services import get_graph_data, analyze_gaps

logger = logging.getLogger(__name__)


class GraphNetworkView(APIView):
    """
    GET /api/graph/network/

    Returns all nodes (topics) and links (relationships) for the
    interactive knowledge graph visualization.

    Response: {
        "nodes": [{"id": 5, "name": "React Hooks", "confidence": 80.0, ...}],
        "links": [{"source": 12, "target": 5, "type": "PREREQ", ...}]
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_graph_data(request.user)
        return Response(data)


class TopicClaimsView(APIView):
    """
    GET /api/graph/topics/<topic_id>/claims/

    Returns all claims associated with a specific topic.
    Used for the side panel when a user clicks a node in the graph.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        claims = (
            Claim.objects
            .filter(user=request.user, topic_id=topic_id)
            .select_related('content_type')
            .order_by('-created_at')
        )
        serializer = ClaimSerializer(claims, many=True)
        return Response(serializer.data)


class GapAnalysisView(APIView):
    """
    GET /api/graph/analyze-gap/?target=<topic_id>

    Runs backward BFS through PREREQ edges to find weak/missing
    prerequisites for a target topic.

    Response: {
        "target": {"id": 5, "name": "React Hooks", "confidence": 0},
        "missing": [...],
        "weak": [...],
        "ready": [...],
        "path": ["Variables", "Scope", "Closures", "React Hooks"],
        "total_prerequisites": 3
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        target_id = request.query_params.get('target')

        if not target_id:
            return Response(
                {"error": "Missing 'target' query parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_id = int(target_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid 'target' — must be a topic ID (integer)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = analyze_gaps(request.user, target_id)

        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)

        return Response(result)
