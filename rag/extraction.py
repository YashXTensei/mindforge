import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path):
    """
    Extracts text from a PDF file page by page.
    Returns:
        list of dict: [{'page_num': int, 'text': str}, ...]
    """
    pages = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()
            
            # Optionally clean up the text here (e.g. removing multiple newlines)
            if text:
                pages.append({
                    'page_num': page_num + 1,  # 1-indexed for humans
                    'text': text
                })
                
        doc.close()
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {file_path}: {str(e)}")
        raise e
        
    return pages

def extract_text_from_note(note):
    """
    Extracts text from a Note object.
    Since Notes are already Markdown (which LLMs understand perfectly),
    we just return the content.
    Returns:
        list of dict: [{'page_num': 1, 'text': str}] for consistency
    """
    text = note.content.strip()
    if not text:
        return []
        
    return [{
        'page_num': 1,
        'text': text
    }]
