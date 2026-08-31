import fitz  # PyMuPDF
import logging
from abc import ABC, abstractmethod
from difflib import SequenceMatcher
from .vision import describe_image

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Duplicate Text Detection
# ──────────────────────────────────────────────

def is_duplicate_text(ocr_text: str, page_text: str, threshold=0.85) -> bool:
    """If OCR text is 85%+ similar to already-extracted page text, skip it."""
    if not ocr_text or not page_text:
        return False
    ratio = SequenceMatcher(None, ocr_text.strip().lower(), page_text.strip().lower()).ratio()
    return ratio >= threshold


# ──────────────────────────────────────────────
# Base Extractor
# ──────────────────────────────────────────────

class BaseExtractor(ABC):
    """Abstract base class for all file extractors."""
    
    @classmethod
    @abstractmethod
    def supports(cls, file_ext: str) -> bool:
        """Return True if this extractor handles this file extension."""
        pass
        
    @abstractmethod
    def extract(self, file_path: str) -> list:
        """
        Extract text from file.
        Returns: [{'page_num': int, 'text': str, 'metadata': dict}]
        """
        pass


# ──────────────────────────────────────────────
# Extractor Implementations
# ──────────────────────────────────────────────

class PDFExtractor(BaseExtractor):
    @classmethod
    def supports(cls, file_ext: str) -> bool:
        return file_ext.lower() == '.pdf'
        
    def extract(self, file_path: str) -> list:
        from .vision import describe_pdf_pages_batch
        pages = []
        try:
            doc = fitz.open(file_path)
            
            empty_pages_indices = []
            empty_pages_images = []
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text("text").strip()
                
                # If page has digital text, use it
                if len(text) > 50:
                    pages.append({
                        'page_num': page_num + 1,
                        'text': text,
                        'metadata': {'page_num': page_num + 1, 'source_format': 'pdf', 'ocr': False}
                    })
                else:
                    # Page is likely a scan. Render to image for OCR.
                    # 2x zoom (~150 DPI) is a good balance of OCR quality vs payload size
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img_bytes = pix.tobytes("jpeg", 85)
                    empty_pages_indices.append(page_num)
                    empty_pages_images.append(img_bytes)
            
            doc.close()
            
            # Batch process the scanned pages (10 pages per API call)
            if empty_pages_images:
                logger.info(f"PDF has {len(empty_pages_images)} scanned pages. Sending to Vision OCR in batches...")
                BATCH_SIZE = 10
                for i in range(0, len(empty_pages_images), BATCH_SIZE):
                    batch_images = empty_pages_images[i:i+BATCH_SIZE]
                    batch_indices = empty_pages_indices[i:i+BATCH_SIZE]
                    
                    ocr_texts = describe_pdf_pages_batch(batch_images)
                    
                    for idx, page_num in enumerate(batch_indices):
                        ocr_text = ocr_texts[idx].strip() if idx < len(ocr_texts) else ""
                        if ocr_text:
                            pages.append({
                                'page_num': page_num + 1,
                                'text': ocr_text,
                                'metadata': {'page_num': page_num + 1, 'source_format': 'pdf', 'ocr': True}
                            })
                            
                # Sort pages back into correct order since we appended OCR pages at the end
                pages.sort(key=lambda x: x['page_num'])
                
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {str(e)}")
            raise e
        return pages


class ImageExtractor(BaseExtractor):
    @classmethod
    def supports(cls, file_ext: str) -> bool:
        return file_ext.lower() in ['.png', '.jpg', '.jpeg', '.webp']
        
    def extract(self, file_path: str) -> list:
        try:
            vision_data = describe_image(file_path)
            
            # Format into the unified representation
            text_parts = [
                f"=== Image Type ===\n{vision_data.get('image_type', 'image').title()}",
                f"=== Summary ===\n{vision_data.get('summary', '')}",
                f"=== Semantic Description ===\n{vision_data.get('description', '')}"
            ]
            
            ocr = vision_data.get('ocr_text', '').strip()
            if ocr:
                text_parts.append(f"=== Visible Text ===\n{ocr}")
                
            combined_text = "\n\n".join(text_parts)
            
            return [{
                'page_num': 1,
                'text': combined_text,
                'metadata': {
                    'page_num': 1,
                    'source_format': 'image',
                    'image_type': vision_data.get('image_type', 'unknown'),
                    'contains_text': bool(ocr)
                }
            }]
            
        except Exception as e:
            logger.error(f"Failed to extract text from Image {file_path}: {str(e)}")
            raise e


# ──────────────────────────────────────────────
# Factory & Helpers
# ──────────────────────────────────────────────

def get_extractor_for_file(file_path: str) -> BaseExtractor:
    """Factory to get the right extractor based on extension."""
    import os
    ext = os.path.splitext(file_path)[1].lower()
    
    extractors = [PDFExtractor, ImageExtractor]
    for extractor_class in extractors:
        if extractor_class.supports(ext):
            return extractor_class()
            
    raise ValueError(f"No extractor found for file extension {ext}")


def extract_text_from_file(file_path: str) -> list:
    """Main entrypoint for Document processing."""
    extractor = get_extractor_for_file(file_path)
    return extractor.extract(file_path)


def extract_text_from_note(note) -> list:
    """Note extraction remains simple markdown processing."""
    text = note.content.strip()
    if not text:
        return []
    return [{
        'page_num': 1,
        'text': text,
        'metadata': {'page_num': 1, 'source_format': 'note'}
    }]
