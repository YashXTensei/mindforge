import cohere
import logging
import time
from django.conf import settings

logger = logging.getLogger(__name__)

# Cohere client initialize karo
client = cohere.Client(settings.COHERE_API_KEY)

# Cohere allows max 96 texts per API call
BATCH_SIZE = 96


def generate_embeddings(texts, input_type="search_document"):
    """
    Takes a list of text strings and returns their vector embeddings.

    Args:
        texts: list of str — ["chunk 1 text", "chunk 2 text", ...]
        input_type: str — "search_document" for storing, "search_query" for searching
                    (Cohere uses different modes for documents vs queries)

    Returns:
        list of list[float] — [[0.123, -0.456, ...], [0.789, ...], ...]
        Each inner list has 1024 dimensions.
    """
    if not texts:
        return []

    model = settings.RAG_CONFIG['EMBEDDING_MODEL']
    all_embeddings = []

    # Process in batches of 96 (Cohere API limit)
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(texts) + BATCH_SIZE - 1) // BATCH_SIZE

        logger.info(f"Embedding batch {batch_num}/{total_batches} ({len(batch)} texts)")

        try:
            response = client.embed(
                texts=batch,
                model=model,
                input_type=input_type,
            )
            all_embeddings.extend(response.embeddings)

        except cohere.errors.TooManyRequestsError:
            # Rate limit hit — wait and retry
            logger.warning("Cohere rate limit hit, waiting 60 seconds...")
            time.sleep(60)
            response = client.embed(
                texts=batch,
                model=model,
                input_type=input_type,
            )
            all_embeddings.extend(response.embeddings)

        except Exception as e:
            logger.error(f"Cohere embedding failed for batch {batch_num}: {str(e)}")
            raise e

        # Small delay between batches to be respectful to API
        if i + BATCH_SIZE < len(texts):
            time.sleep(1)

    logger.info(f"Generated {len(all_embeddings)} embeddings successfully")
    return all_embeddings


def generate_query_embedding(query_text):
    """
    Shortcut function for embedding a single search query.
    Uses input_type="search_query" which Cohere optimizes differently
    than document embeddings for better search results.

    Args:
        query_text: str — "What is React?"

    Returns:
        list[float] — single vector of 1024 dimensions
    """
    embeddings = generate_embeddings([query_text], input_type="search_query")
    return embeddings[0]
