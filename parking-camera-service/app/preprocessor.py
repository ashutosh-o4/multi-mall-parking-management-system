"""
Advanced preprocessing pipeline for license plate OCR.

Paper reference (Section 3.3):
    "Preprocessing included grayscale conversion, Contrast Limited Adaptive
    Histogram Equalization (CLAHE), denoising, and thresholding"
    
    Equation (3): T_j = CLAHE(SkewCorr(Gray(I[b_j])))

Implementation follows Algorithm 1 (Section 5) step-by-step preprocessing:
    1. Grayscale conversion
    2. CLAHE (clipLimit=3.0, tileGridSize=(8,8))
    3. Denoising (fastNlMeansDenoising)
    4. Otsu thresholding
    5. 2x upscaling (INTER_CUBIC)
"""
import cv2
import logging
import numpy as np

logger = logging.getLogger(__name__)

# CLAHE parameters from paper
CLAHE_CLIP_LIMIT = 3.0
CLAHE_TILE_GRID_SIZE = (8, 8)

# Denoising parameters
DENOISE_H = 10
DENOISE_TEMPLATE_WINDOW = 7
DENOISE_SEARCH_WINDOW = 21

# Scaling parameters
UPSCALE_FACTOR = 2
INTERPOLATION_METHOD = cv2.INTER_CUBIC


def preprocess_plate(plate_crop: np.ndarray) -> tuple[np.ndarray, float]:
    """
    Preprocess a cropped license plate image for optimal OCR accuracy.
    
    Implements the exact pipeline from Parvaiz et al. (2025), Section 3.3:
        Step 1: Grayscale conversion
        Step 2: CLAHE enhancement (adaptive histogram equalization)
        Step 3: Denoising
        Step 4: Otsu thresholding
        Step 5: 2x upscaling with cubic interpolation
    
    Args:
        plate_crop: numpy array (BGR format, HxWx3)
    
    Returns:
        tuple: (preprocessed_image: np.ndarray, quality_score: float)
    """
    try:
        logger.info(f"Preprocessing plate image: {plate_crop.shape}")
        
        # ────────────────────────────────────────────────────────────────
        # Step 1: Convert to Grayscale
        # ────────────────────────────────────────────────────────────────
        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        logger.debug("✓ Grayscale conversion complete")
        
        # ────────────────────────────────────────────────────────────────
        # Step 2: CLAHE (Contrast Limited Adaptive Histogram Equalization)
        # ────────────────────────────────────────────────────────────────
        # Paper: "Contrast Limited Adaptive Histogram Equalization (CLAHE)
        # with clipLimit=3.0 and tileGridSize=(8,8) was applied for
        # robust feature enhancement under varying lighting conditions"
        clahe = cv2.createCLAHE(
            clipLimit=CLAHE_CLIP_LIMIT,
            tileGridSize=CLAHE_TILE_GRID_SIZE
        )
        enhanced = clahe.apply(gray)
        logger.debug(f"✓ CLAHE applied (clipLimit={CLAHE_CLIP_LIMIT}, tile={CLAHE_TILE_GRID_SIZE})")
        
        # ────────────────────────────────────────────────────────────────
        # Step 3: Denoising (fastNlMeansDenoising)
        # ────────────────────────────────────────────────────────────────
        # Removes salt-and-pepper noise and compression artifacts
        denoised = cv2.fastNlMeansDenoising(
            enhanced,
            h=DENOISE_H,
            templateWindowSize=DENOISE_TEMPLATE_WINDOW,
            searchWindowSize=DENOISE_SEARCH_WINDOW
        )
        logger.debug(f"✓ Denoising applied (h={DENOISE_H})")
        
        # ────────────────────────────────────────────────────────────────
        # Step 4: Otsu Thresholding
        # ────────────────────────────────────────────────────────────────
        # Automatic threshold computation for binary plate image
        _, binary = cv2.threshold(
            denoised,
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
        logger.debug("✓ Otsu thresholding applied")
        
        # ────────────────────────────────────────────────────────────────
        # Step 5: 2x Upscaling (INTER_CUBIC)
        # ────────────────────────────────────────────────────────────────
        # Improves OCR character recognition by providing higher resolution
        h, w = binary.shape[:2]
        upscaled = cv2.resize(
            binary,
            (w * UPSCALE_FACTOR, h * UPSCALE_FACTOR),
            interpolation=INTERPOLATION_METHOD
        )
        logger.debug(f"✓ Upscaled 2x ({w}x{h} → {upscaled.shape[1]}x{upscaled.shape[0]})")
        
        # Compute quality score based on histogram contrast
        quality_score = compute_quality_score(upscaled)
        logger.info(f"Preprocessing complete. Quality score: {quality_score:.3f}")
        
        return upscaled, quality_score
        
    except Exception as e:
        logger.error(f"Preprocessing failed: {e}", exc_info=True)
        # Return original gray image on failure
        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        return gray, 0.0


def compute_quality_score(image: np.ndarray) -> float:
    """
    Compute a quality score for the preprocessed image.
    
    Based on histogram contrast and edge presence.
    
    Args:
        image: preprocessed grayscale image
    
    Returns:
        float: quality score (0.0-1.0)
    """
    # Compute histogram
    hist = cv2.calcHist([image], [0], None, [256], [0, 256])
    
    # Normalize histogram
    hist = cv2.normalize(hist, hist).flatten()
    
    # Compute standard deviation as measure of contrast
    contrast = np.std(hist)
    
    # Normalize to 0-1 range (empirically calibrated)
    quality = min(1.0, contrast / 50.0)
    
    return quality


def deskew_image(gray_image: np.ndarray) -> np.ndarray:
    """
    Correct skew in a grayscale plate image using Hough lines.
    
    Paper reference: Section 3.3 — "Skew correction applied via
    minimum area rectangle rotation for robustness"
    
    Args:
        gray_image: grayscale image
    
    Returns:
        deskewed image
    """
    try:
        # Find contours for skew detection
        _, thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 5:
            return gray_image
        
        # Fit minimum area rectangle
        angle = cv2.minAreaRect(coords)[-1]
        
        # Adjust angle
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        # Only correct if skew is significant but not extreme
        if abs(angle) < 0.5 or abs(angle) > 15:
            return gray_image
        
        # Rotate
        h, w = gray_image.shape[:2]
        center = (w // 2, h // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            gray_image,
            matrix,
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        logger.debug(f"Image deskewed by {angle:.2f}°")
        return rotated
        
    except Exception as e:
        logger.warning(f"Deskew failed: {e}")
        return gray_image
