"""
OCR recognition module using EasyOCR.

Paper reference:
    Section 3.3 — "EasyOCR was used as the OCR engine to extract character
    sequences from preprocessed plate images"
    
    Equation (4): ŝ_j = f_OCR(T_j)
    where T_j is the preprocessed plate image
"""
import easyocr
import logging
import numpy as np
from app.preprocessor import preprocess_plate

logger = logging.getLogger(__name__)

# Initialize EasyOCR reader once at module level for performance
logger.info("Initializing EasyOCR reader (English)...")
try:
    reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if CUDA available
    logger.info("✓ EasyOCR reader initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize EasyOCR: {e}")
    reader = None

# Allowlist configuration (paper requirement)
# "Only alphanumeric characters valid in Indian license plates"
ALLOWLIST_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'


def read_plate_text(plate_crop: np.ndarray) -> tuple[str, float]:
    """
    Read text from a cropped license plate image using EasyOCR.
    
    Implements Equation (4) from the paper:
        ŝ_j = f_OCR(T_j)
    
    Pipeline:
        1. Preprocess image (grayscale → CLAHE → denoise → threshold → upscale)
        2. Run EasyOCR with allowlist
        3. Combine all text blocks
        4. Compute confidence score
    
    Args:
        plate_crop: numpy array (BGR format), the cropped plate region
    
    Returns:
        tuple: (text: str, confidence: float)
            - text: uppercase text string (may contain spaces)
            - confidence: average confidence (0.0-1.0)
    """
    if reader is None:
        logger.error("EasyOCR reader not initialized")
        return "", 0.0
    
    try:
        # Step 1: Preprocess the plate image
        preprocessed, quality = preprocess_plate(plate_crop)
        logger.debug(f"Preprocessing complete. Quality: {quality:.3f}")
        
        # Step 2: Run EasyOCR with allowlist
        # detail=1 returns per-character confidence and bounding boxes
        logger.debug("Running EasyOCR...")
        ocr_results = reader.readtext(
            preprocessed,
            detail=1,  # Return detailed info (text, confidence, bbox)
            allowlist=ALLOWLIST_CHARS,
            paragraph=False  # Treat each detection separately
        )
        logger.debug(f"EasyOCR returned {len(ocr_results)} detection(s)")
        
        if not ocr_results:
            logger.warning("EasyOCR returned no results")
            return "", 0.0
        
        # Step 3: Combine text blocks and compute confidence
        texts = []
        confidences = []
        
        for detection in ocr_results:
            # Each detection: ((x1,y1), (x2,y2), (x3,y3), (x4,y4)), text, confidence
            text = detection[1].strip().upper()
            conf = float(detection[2])
            
            if text:  # Only add non-empty text
                texts.append(text)
                confidences.append(conf)
                logger.debug(f"  '{text}' (conf: {conf:.3f})")
        
        # Step 4: Combine all text with spaces between blocks
        combined_text = ' '.join(texts)
        
        # Compute average confidence
        avg_confidence = np.mean(confidences) if confidences else 0.0
        
        logger.info(f"OCR result: '{combined_text}' (confidence: {avg_confidence:.3f})")
        
        return combined_text, avg_confidence
        
    except Exception as e:
        logger.error(f"OCR processing failed: {e}", exc_info=True)
        return "", 0.0


def compute_ocr_confidence(text: str, confidences: list[float]) -> float:
    """
    Compute overall OCR confidence from per-character confidences.
    
    Args:
        text: recognized text
        confidences: list of per-character confidence scores
    
    Returns:
        float: overall confidence (0.0-1.0)
    """
    if not confidences:
        return 0.0
    
    # Average confidence weighted by character importance
    # (we prefer high confidence on all characters)
    weights = np.array(confidences)
    return float(np.mean(weights))
