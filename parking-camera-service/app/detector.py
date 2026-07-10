"""
YOLOv11 license plate detector.

Paper reference:
    Section 3.3 — "the YOLOv11 detector learns to identify number plates
    by minimizing the Complete Intersection over Union (CIoU) loss function"

    Equation (1): B = f_YOLO(I)
    where B = {b_j} and each b_j = (x_j, y_j, w_j, h_j, c_j)
"""
import logging
import numpy as np
import base64
import cv2
from ultralytics import YOLO
from app.config import MODEL_PATH, DETECTION_CONFIDENCE, IMAGE_SIZE

logger = logging.getLogger(__name__)

# Load the trained model once at module level for performance
logger.info(f"Loading YOLO model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
logger.info("✓ YOLO model loaded successfully")

# Padding around detected bounding box (pixels)
BBOX_PADDING = 5


def detect_plates(image: np.ndarray) -> list[dict]:
    """
    Detect license plates in an image using YOLOv11.
    
    Implements Equation (1) from the paper:
        B = f_YOLO(I)
    where I is input image, B is set of bounding boxes

    Args:
        image: numpy array (BGR format from OpenCV)

    Returns:
        list of dicts, each containing:
            - x1, y1, x2, y2: bounding box coordinates (with 5px padding)
            - x1_orig, y1_orig, x2_orig, y2_orig: original coordinates
            - confidence: detection confidence score (0.0-1.0)
            - crop: cropped image of the detected plate region
            - crop_base64: base64-encoded cropped image
    """
    logger.info(f"Running YOLO detection on image {image.shape}")
    
    results = model(image, conf=DETECTION_CONFIDENCE, imgsz=IMAGE_SIZE)
    detections = []

    for result in results:
        for box in result.boxes:
            # Original bounding box coordinates
            x1_orig, y1_orig, x2_orig, y2_orig = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            
            logger.debug(f"  Detected box: ({x1_orig}, {y1_orig}, {x2_orig}, {y2_orig}) conf={conf:.3f}")
            
            # Add padding (requirement: 5px around bbox)
            h, w = image.shape[:2]
            x1 = max(0, x1_orig - BBOX_PADDING)
            y1 = max(0, y1_orig - BBOX_PADDING)
            x2 = min(w, x2_orig + BBOX_PADDING)
            y2 = min(h, y2_orig + BBOX_PADDING)
            
            # Crop the license plate region from the original image
            crop = image[y1:y2, x1:x2]
            
            # Skip tiny crops that are likely false positives
            if crop.shape[0] < 10 or crop.shape[1] < 20:
                logger.warning(f"  Skipping tiny detection: {crop.shape}")
                continue
            
            # Encode crop as base64
            _, encoded = cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
            crop_base64 = base64.b64encode(encoded).decode('utf-8')
            
            detections.append({
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "x1_orig": x1_orig,
                "y1_orig": y1_orig,
                "x2_orig": x2_orig,
                "y2_orig": y2_orig,
                "confidence": conf,
                "crop": crop,
                "crop_base64": crop_base64
            })
            
            logger.debug(f"  → with padding: ({x1}, {y1}, {x2}, {y2}) crop {crop.shape}")

    logger.info(f"✓ Detected {len(detections)} license plate(s)")
    return detections
