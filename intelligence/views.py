from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contradiction
from .serializers import ContradictionSerializer, ContradictionResolveSerializer


class ContradictionListView(ListAPIView):
    """
    GET /api/intelligence/contradictions/
    
    Returns the user's contradictions — unresolved first, then resolved.
    Supports ?status=unresolved or ?status=resolved filter.
    """
    serializer_class = ContradictionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Contradiction.objects.filter(user=self.request.user)

        # Optional status filter
        status_filter = self.request.query_params.get('status')
        if status_filter == 'unresolved':
            qs = qs.filter(is_resolved=False)
        elif status_filter == 'resolved':
            qs = qs.filter(is_resolved=True)

        # Unresolved first, then by severity (high → low), then newest first
        return qs.select_related(
            'claim_a', 'claim_a__topic',
            'claim_b', 'claim_b__topic',
        ).order_by('is_resolved', '-created_at')


class ContradictionResolveView(APIView):
    """
    PATCH /api/intelligence/contradictions/<id>/resolve/
    
    Mark a contradiction as resolved with an optional note.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            contradiction = Contradiction.objects.get(id=pk, user=request.user)
        except Contradiction.DoesNotExist:
            return Response(
                {"error": "Contradiction not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ContradictionResolveSerializer(
            contradiction, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)

        contradiction.is_resolved = True
        contradiction.resolved_note = serializer.validated_data.get(
            'resolved_note', ''
        )
        contradiction.resolved_at = timezone.now()
        contradiction.save()

        return Response(ContradictionSerializer(contradiction).data)


class ContradictionStatsView(APIView):
    """
    GET /api/intelligence/stats/
    
    Quick stats for dashboard badge/notification.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Contradiction.objects.filter(user=request.user)
        return Response({
            'total': qs.count(),
            'unresolved': qs.filter(is_resolved=False).count(),
            'high_severity': qs.filter(
                is_resolved=False, severity='high'
            ).count(),
        })
