from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.postgres.search import SearchQuery, SearchRank
from .providers import SEARCH_PROVIDERS

class GlobalSearchView(APIView):
    """
    Unified global search endpoint across all registered models.
    Returns a unified JSON schema sorted by relevance rank.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query_string = request.query_params.get('q', '').strip()
        if not query_string:
            return Response([])

        # Create PostgreSQL SearchQuery
        search_query = SearchQuery(query_string)
        
        results = []

        # Iterate dynamically over all registered search providers
        for provider in SEARCH_PROVIDERS:
            vector = provider.get_search_vector()
            
            # Annotate with search vector and rank, then filter and sort
            queryset = provider.get_queryset().filter(user=request.user).annotate(
                search=vector,
                rank=SearchRank(vector, search_query)
            ).filter(search=search_query).order_by('-rank')[:50]  # limit to top 50 per model
            
            # Format results into unified schema
            for instance in queryset:
                results.append(provider.format_result(instance))

        # Global sort across all provider results by rank descending
        results.sort(key=lambda x: x['rank'], reverse=True)

        # Return top 100 overall
        return Response(results[:100])
