"""
FastAPI application for the Parking ANPR Camera Service.

Implements Algorithm 1 from Parvaiz et al. (2025):
    Input:  Image I, Trained YOLOv11, Trained EasyOCR
    Output: Annotated Image and Structured CSV Output

Endpoints:
    GET  /health                    → Service health check
    POST /detect                    → Core ANPR endpoint (multipart image)
    POST /api/v1/scan-plate         → Upload image → detect → read → register
    POST /api/v1/scan-camera        → Capture from camera → detect → read → register
    POST /api/v1/process-exit       → Scan plate for vehicle exit
    GET  /api/v1/detections/csv     → Download detection log as CSV

Main focus: /detect endpoint with standard response format for Spring Boot integration
"""
import cv2
import io
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from app.detector import detect_plates
from app.recognizer import read_plate_text
from app.validator import validate_and_status
from app.schemas import PlateDetectionResponse, HealthResponse, ErrorResponse
from app.backend_client import register_vehicle_entry, process_vehicle_exit
from app.camera import capture_frame
from app.config import MALL_ID

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Parking ANPR Camera Service",
    description="Automatic Number Plate Recognition using YOLOv11 + EasyOCR",
    version="1.0.0"
)

# CORS — allow React frontend and Spring Boot backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8888",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory detection log (also downloadable as CSV)
detection_log: list[dict] = []


# ── Core ANPR Pipeline ─────────────────────────────────────────────────────────

def process_single_plate_detection(
    yolo_detection: dict,
    image: np.ndarray
) -> dict:
    """
    Process a single detected plate through the complete pipeline.
    
    Implements Equations (3), (4), (6) from the paper:
        T_j = CLAHE(SkewCorr(Gray(I[b_j])))       [Eq 3 - preprocessing]
        ŝ_j = f_OCR(T_j)                          [Eq 4 - OCR]
        s_valid_j = ŝ_j if R(ŝ_j) = True, else ∅ [Eq 6 - validation]
    
    Args:
        yolo_detection: dict with crop, confidence, crop_base64
        image: original image (for reference)
    
    Returns:
        dict: complete result with all fields
    """
    # Step 2 & 3: OCR + Validation
    raw_ocr_text, ocr_confidence = read_plate_text(yolo_detection["crop"])
    
    # Step 4: Validate and get status
    cleaned_plate, status, is_valid = validate_and_status(
        raw_ocr_text,
        yolo_detection["confidence"],
        ocr_confidence
    )
    
    # Step 5: Compute overall confidence
    # Weighted average: YOLO contributes 40%, OCR contributes 60% (tunable)
    overall_confidence = (
        0.4 * yolo_detection["confidence"] +
        0.6 * ocr_confidence
    )
    
    result = {
        "plate_number": cleaned_plate,
        "confidence": round(overall_confidence, 4),
        "status": status,
        "cropped_plate_base64": yolo_detection["crop_base64"],
        "yolo_confidence": round(yolo_detection["confidence"], 4),
        "ocr_confidence": round(ocr_confidence, 4),
        "raw_ocr_output": raw_ocr_text,
    }
    
    logger.debug(f"Plate result: {result}")
    return result


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check() -> dict:
    """Service health check."""
    logger.info("Health check requested")
    return {
        "status": "running",
        "model": "YOLOv11 + EasyOCR",
        "version": "1.0.0",
        "detections_logged": len(detection_log)
    }


@app.post("/detect", response_model=PlateDetectionResponse)
async def detect_plate_endpoint(file: UploadFile = File(...)):
    """
    Core ANPR detection endpoint.
    
    **Algorithm 1 Implementation:**
    
    1. Decode image from multipart upload
    2. YOLO detection (640x640 input)
    3. For highest-confidence detection:
       - Crop with 5px padding
       - Preprocess: grayscale → CLAHE → denoise → threshold → upscale 2x
       - EasyOCR with allowlist (A-Z, 0-9)
       - Regex validation against Indian plate format
    4. Determine status (AUTO_DETECTED / MANUAL_REVIEW / MANUAL_ENTRY)
    5. Return JSON response
    
    Args:
        file: multipart image file
    
    Returns:
        PlateDetectionResponse: detected plate info with confidence scores
    
    Error Handling:
        - 400: invalid/corrupt image
        - 404: no plate detected in image
        - 500: processing error
    """
    try:
        logger.info(f"Processing upload: {file.filename} ({file.content_type})")
        
        # Decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            logger.error(f"Invalid image: {file.filename}")
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid or corrupt image file"}
            )
        
        logger.debug(f"Image decoded: {image.shape}")
        
        # Step 1: YOLO Detection (Equation 1)
        logger.info("Starting YOLO detection...")
        detections = detect_plates(image)
        
        if not detections:
            logger.warning("No license plates detected")
            return JSONResponse(
                status_code=404,
                content={"error": "No license plate detected in image"}
            )
        
        # Step 2: Process highest-confidence detection
        logger.info(f"Found {len(detections)} detection(s), processing best...")
        best_detection = max(detections, key=lambda d: d["confidence"])
        
        result = process_single_plate_detection(best_detection, image)
        
        # Log detection
        detection_log.append({
            "filename": file.filename,
            "plate_text": result["plate_number"],
            "status": result["status"],
            "yolo_confidence": result["yolo_confidence"],
            "ocr_confidence": result["ocr_confidence"],
            "timestamp": datetime.now().isoformat()
        })
        
        logger.info(f"✓ Detection complete: {result['plate_number']} ({result['status']})")
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Processing error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": f"Processing failed: {str(e)}"}
        )


@app.post("/api/v1/scan-plate")
async def scan_plate_from_upload(
    file: UploadFile = File(...),
    mall_id: int = Query(default=None, description="Target mall ID"),
    mode: str = Query(default="entry", description="'entry' or 'exit'")
):
    """
    Upload an image → detect license plate → read text → register entry/exit.

    This endpoint follows **Algorithm 1** from the paper step by step,
    and integrates with Spring Boot backend for vehicle registration.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return JSONResponse(status_code=400, content={"error": "Invalid image file"})

        # Detect plates
        detections = detect_plates(image)
        if not detections:
            logger.info(f"No plates detected in: {file.filename}")
            return JSONResponse(content={"message": "No license plate detected", "plates": []})

        results = []
        for det in detections:
            result = process_single_plate_detection(det, image)
            
            # Register with backend if valid
            if result["status"] == "AUTO_DETECTED":
                backend_resp = register_vehicle_entry(result["plate_number"], mall_id or MALL_ID)
                result["backend_response"] = backend_resp
                logger.info(f"Vehicle entry registered: {result['plate_number']}")
            
            results.append(result)
            
            # Log to CSV
            detection_log.append({
                "filename": file.filename,
                "plate_text": result["plate_number"],
                "status": result["status"],
                "mode": mode,
                "timestamp": datetime.now().isoformat()
            })

        return JSONResponse(content={"plates": results})

    except Exception as e:
        logger.error(f"Error in scan-plate: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/v1/scan-camera")
async def scan_from_camera(
    mall_id: int = Query(default=None, description="Target mall ID"),
    mode: str = Query(default="entry", description="'entry' or 'exit'")
):
    """Capture a frame from the connected camera and scan it for plates."""
    try:
        frame = capture_frame()
        if frame is None:
            return JSONResponse(status_code=500, content={"error": "Camera not available"})

        detections = detect_plates(frame)
        if not detections:
            return JSONResponse(content={"message": "No license plate detected", "plates": []})

        results = []
        for det in detections:
            result = process_single_plate_detection(det, frame)
            
            if result["status"] == "AUTO_DETECTED":
                backend_resp = register_vehicle_entry(result["plate_number"], mall_id or MALL_ID)
                result["backend_response"] = backend_resp
            
            results.append(result)

        return JSONResponse(content={"plates": results})

    except Exception as e:
        logger.error(f"Error in scan-camera: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/v1/process-exit")
async def process_exit_from_upload(
    file: UploadFile = File(...),
    mall_id: int = Query(default=None, description="Target mall ID")
):
    """Upload an image → detect plate → process vehicle exit."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return JSONResponse(status_code=400, content={"error": "Invalid image file"})

        detections = detect_plates(image)
        if not detections:
            return JSONResponse(content={"message": "No license plate detected", "plates": []})

        results = []
        for det in detections:
            result = process_single_plate_detection(det, image)
            
            if result["status"] in ["AUTO_DETECTED", "MANUAL_REVIEW"]:
                backend_resp = process_vehicle_exit(result["plate_number"], mall_id or MALL_ID)
                result["backend_response"] = backend_resp
                logger.info(f"Vehicle exit processed: {result['plate_number']}")
            
            results.append(result)

        return JSONResponse(content={"plates": results})

    except Exception as e:
        logger.error(f"Error in process-exit: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/v1/detections/csv")
def download_detections_csv():
    """
    Download all detections as a CSV file.

    Paper Section 7.3: "A properly formatted output CSV file was also created
    using Pandas with the image file name, the detected license plate number,
    the detection confidence, and a timestamp for each detection."
    """
    if not detection_log:
        return JSONResponse(content={"message": "No detections recorded yet"})

    df = pd.DataFrame(detection_log)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=detections.csv"}
    )
