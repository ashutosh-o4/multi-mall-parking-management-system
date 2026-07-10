"""
Camera capture module using OpenCV.

Supports:
    - Local USB webcam (source = 0, 1, 2, ...)
    - IP cameras via RTSP/HTTP URL
    - Single frame capture and continuous streaming
"""
import cv2
import logging
from app.config import CAMERA_SOURCE

logger = logging.getLogger(__name__)


def _get_camera_source():
    """
    Parse camera source from config.

    Returns:
        int for local webcam index, or str for RTSP/HTTP URL
    """
    try:
        return int(CAMERA_SOURCE)
    except ValueError:
        return CAMERA_SOURCE  # RTSP or HTTP URL


def capture_frame():
    """
    Capture a single frame from the configured camera.

    Returns:
        numpy array (BGR format) or None if capture failed
    """
    source = _get_camera_source()
    logger.info(f"Capturing frame from: {source}")

    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        logger.error(f"Cannot open camera source: {source}")
        return None

    ret, frame = cap.read()
    cap.release()

    if not ret:
        logger.error("Failed to capture frame")
        return None

    logger.info(f"Frame captured: {frame.shape}")
    return frame


def stream_frames():
    """
    Generator that yields frames continuously from the camera.

    Usage:
        for frame in stream_frames():
            detections = detect_plates(frame)
            ...

    Yields:
        numpy array: each frame in BGR format
    """
    source = _get_camera_source()
    logger.info(f"Starting camera stream from: {source}")

    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        logger.error(f"Cannot open camera source: {source}")
        return

    frame_count = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                logger.warning("Camera stream ended or frame dropped")
                break
            frame_count += 1
            yield frame
    finally:
        cap.release()
        logger.info(f"Camera stream closed after {frame_count} frames")
