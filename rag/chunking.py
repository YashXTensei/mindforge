import tiktoken
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# GPT-compatible tokenizer — works well for general token counting
encoder = tiktoken.get_encoding("cl100k_base")

def chunk_text(pages, chunk_size=None, chunk_overlap=None):
    """
    Takes extracted pages and splits them into overlapping chunks.

    Args:
        pages: list of dict — [{'page_num': 1, 'text': '...'}, ...]
        chunk_size: tokens per chunk (default from settings)
        chunk_overlap: overlap tokens between chunks (default from settings)

    Returns:
        list of dict — [
            {
                'content': 'chunk ka actual text',
                'chunk_index': 0,
                'metadata': {'page_num': 1, 'char_start': 0, 'char_end': 1500}
            },
            ...
        ]
    """
    if chunk_size is None:
        chunk_size = settings.RAG_CONFIG['CHUNK_SIZE']
    if chunk_overlap is None:
        chunk_overlap = settings.RAG_CONFIG['CHUNK_OVERLAP']

    if not pages:
        return []

    # Step 1: Combine all pages into one text, tracking page boundaries
    # page_map stores: for each character position, which page it belongs to
    combined_text = ""
    page_boundaries = []  # [(start_char, end_char, page_num), ...]

    for page in pages:
        start = len(combined_text)
        combined_text += page['text'] + "\n\n"  # Add spacing between pages
        end = len(combined_text)
        page_boundaries.append((start, end, page['page_num']))

    combined_text = combined_text.strip()

    if not combined_text:
        return []

    # Step 2: Tokenize the entire text
    tokens = encoder.encode(combined_text)
    total_tokens = len(tokens)

    logger.info(f"Total tokens: {total_tokens}, chunk_size: {chunk_size}, overlap: {chunk_overlap}")

    # Step 3: Split tokens into overlapping chunks
    chunks = []
    chunk_index = 0
    start = 0  # token position

    while start < total_tokens:
        end = min(start + chunk_size, total_tokens)

        # Decode this chunk's tokens back to text
        chunk_tokens = tokens[start:end]
        chunk_text_content = encoder.decode(chunk_tokens)

        # Figure out character positions in original text
        # Decode everything before this chunk to find char_start
        char_start = len(encoder.decode(tokens[:start]))
        char_end = char_start + len(chunk_text_content)

        # Find which page this chunk belongs to (use start position)
        page_num = _find_page_num(char_start, page_boundaries)

        chunks.append({
            'content': chunk_text_content.strip(),
            'chunk_index': chunk_index,
            'metadata': {
                'page_num': page_num,
                'char_start': char_start,
                'char_end': char_end,
            }
        })

        chunk_index += 1

        # Move forward by (chunk_size - overlap) tokens
        # This creates the overlap effect
        step = chunk_size - chunk_overlap
        if step <= 0:
            step = chunk_size  # Safety: avoid infinite loop

        start += step

        # If remaining tokens are very small, merge with last chunk
        if start < total_tokens and (total_tokens - start) < chunk_overlap:
            break

    return chunks


def _find_page_num(char_pos, page_boundaries):
    """
    Given a character position, find which page it belongs to.
    """
    for start, end, page_num in page_boundaries:
        if start <= char_pos < end:
            return page_num

    # If not found, return last page
    if page_boundaries:
        return page_boundaries[-1][2]
    return 1
