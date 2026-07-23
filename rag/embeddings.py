"""
Embedding service with Provider Pattern.
Supports swapping Cohere with OpenAI, Voyage, or local models
without changing the rest of the RAG pipeline.
"""

import logging
import time
from abc import ABC, abstractmethod
from django.conf import settings

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Base Provider (Abstract Class)
# ──────────────────────────────────────────────

class BaseEmbeddingProvider(ABC):
    """
    Abstract base class for all embedding providers.
    Any new provider (OpenAI, Voyage, local) just needs to implement _embed_batch().
    """

    def __init__(self):
        self.model = settings.RAG_CONFIG['EMBEDDING_MODEL']
        self.batch_size = settings.RAG_CONFIG['EMBEDDING_BATCH_SIZE']
        self.max_retries = settings.RAG_CONFIG['EMBEDDING_MAX_RETRIES']

    @abstractmethod
    def _embed_batch(self, texts, input_type):
        """
        Embed a single batch of texts. Each provider implements this differently.
        Must return: list of list[float]
        """
        pass

    def generate_embeddings(self, texts, input_type="search_document"):
        """
        Main method — handles batching, retries, and validation.
        """
        if not texts:
            return []

        all_embeddings = []

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            total_batches = (len(texts) + self.batch_size - 1) // self.batch_size

            logger.info(f"Embedding batch {batch_num}/{total_batches} ({len(batch)} texts)")

            # Retry with exponential backoff
            embeddings = self._retry_with_backoff(batch, input_type, batch_num)

            # Validate: embedding count must match input count
            if len(embeddings) != len(batch):
                raise ValueError(
                    f"Embedding count mismatch in batch {batch_num}: "
                    f"sent {len(batch)} texts, got {len(embeddings)} embeddings"
                )

            # Validate: each embedding must have correct dimensions
            expected_dims = settings.RAG_CONFIG['EMBEDDING_DIMENSIONS']
            for idx, emb in enumerate(embeddings):
                if len(emb) != expected_dims:
                    raise ValueError(
                        f"Dimension mismatch in batch {batch_num}, embedding {idx}: "
                        f"expected {expected_dims}, got {len(emb)}"
                    )

            all_embeddings.extend(embeddings)

            # Small delay between batches to respect API limits
            if i + self.batch_size < len(texts):
                time.sleep(1)

        logger.info(f"Generated {len(all_embeddings)} embeddings successfully")
        return all_embeddings

    def generate_query_embedding(self, query_text):
        """
        Shortcut for embedding a single search query.
        Uses input_type="search_query" for better search accuracy.
        """
        embeddings = self.generate_embeddings([query_text], input_type="search_query")
        return embeddings[0]

    def _retry_with_backoff(self, batch, input_type, batch_num):
        """
        Retry failed API calls with exponential backoff.
        Wait times: 2s → 4s → 8s (doubles each time)
        """
        last_exception = None

        for attempt in range(self.max_retries):
            try:
                return self._embed_batch(batch, input_type)

            except Exception as e:
                last_exception = e
                wait_time = 2 ** (attempt + 1)  # 2, 4, 8 seconds

                # Check if it's a retryable error
                if self._is_retryable(e):
                    logger.warning(
                        f"Batch {batch_num} attempt {attempt + 1}/{self.max_retries} failed: {str(e)}. "
                        f"Retrying in {wait_time}s..."
                    )
                    time.sleep(wait_time)
                else:
                    # Non-retryable error — fail immediately
                    logger.error(f"Non-retryable error in batch {batch_num}: {str(e)}")
                    raise e

        # All retries exhausted
        logger.error(f"All {self.max_retries} retries failed for batch {batch_num}")
        raise last_exception

    def _is_retryable(self, error):
        """Check if an error is worth retrying (rate limits, timeouts, network issues)."""
        retryable_types = (
            ConnectionError,
            TimeoutError,
            OSError,
        )
        if isinstance(error, retryable_types):
            return True

        # Check error message for common retryable patterns
        error_msg = str(error).lower()
        retryable_keywords = ['rate limit', 'timeout', 'too many requests', '429', '503', '502']
        return any(keyword in error_msg for keyword in retryable_keywords)


# ──────────────────────────────────────────────
# Cohere Provider
# ──────────────────────────────────────────────

class CohereEmbeddingProvider(BaseEmbeddingProvider):
    """Cohere embed-english-v3.0 provider."""

    def __init__(self):
        super().__init__()
        import cohere
        self.client = cohere.Client(settings.COHERE_API_KEY)
        self.cohere_errors = cohere.errors

    def _embed_batch(self, texts, input_type):
        response = self.client.embed(
            texts=texts,
            model=self.model,
            input_type=input_type,
        )
        return response.embeddings

    def _is_retryable(self, error):
        """Cohere-specific retryable errors."""
        if isinstance(error, self.cohere_errors.TooManyRequestsError):
            return True
        return super()._is_retryable(error)


# ──────────────────────────────────────────────
# Factory — Get the right provider based on settings
# ──────────────────────────────────────────────

_provider_instance = None

def get_embedding_provider():
    """
    Returns the configured embedding provider.
    Cached so we don't create a new client on every call.
    """
    global _provider_instance

    if _provider_instance is None:
        provider_name = settings.RAG_CONFIG['EMBEDDING_PROVIDER']

        if provider_name == 'cohere':
            _provider_instance = CohereEmbeddingProvider()
        else:
            raise ValueError(f"Unknown embedding provider: {provider_name}")

    return _provider_instance


def reset_embedding_provider():
    """
    Reset the cached provider instance.
    Useful for testing — swap provider between tests without leftover state.
    """
    global _provider_instance
    _provider_instance = None


# ──────────────────────────────────────────────
# Convenience functions (used by the rest of the pipeline)
# ──────────────────────────────────────────────

def generate_embeddings(texts, input_type="search_document"):
    """Generate embeddings for a list of texts."""
    provider = get_embedding_provider()
    return provider.generate_embeddings(texts, input_type)


def generate_query_embedding(query_text):
    """Generate embedding for a single search query."""
    provider = get_embedding_provider()
    return provider.generate_query_embedding(query_text)
