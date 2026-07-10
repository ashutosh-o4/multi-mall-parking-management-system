"""Configuration for the parking camera ANPR service."""
import os
from dotenv import load_dotenv

load_dotenv()

# Path to trained YOLO model weights (downloaded from Google Colab)
MODEL_PATH = os.getenv("MODEL_PATH", "models/best.pt")

# Camera source: 0 = local webcam, or an RTSP/HTTP URL for IP camera
# Examples:
#   "0"                                     → local webcam
#   "rtsp://admin:pass@192.168.1.100:554"   → IP camera
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "0")

# Spring Boot backend URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

# Mall ID for this camera's location
MALL_ID = int(os.getenv("MALL_ID", "1"))

# YOLO detection confidence threshold (paper uses 0.5)
DETECTION_CONFIDENCE = float(os.getenv("DETECTION_CONFIDENCE", "0.5"))

# YOLO input image size (paper uses 640)
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "640"))

# Backend auth token (JWT for secured endpoints)
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")
