# parking-camera-service

ANPR (Automatic Number Plate Recognition) microservice for the 
Multi-Mall Parking Management System.

Detects and reads Indian vehicle license plates from camera images using a 
YOLOv11 + EasyOCR pipeline, and returns structured results to the Spring Boot 
backend.

**Reference:** Parvaiz et al. (2025) — *Real-Time Indian Number Plate 
Recognition with YOLOv11 and EasyOCR: A Vision-based Pipeline*, IJCA Vol. 187, 
No. 48.

---

## How It Works

```
Camera Image
    ↓
YOLOv11 — detects plate bounding box (640×640 input)
    ↓
Crop plate region (5px padding)
    ↓
Preprocess — Grayscale → CLAHE → Denoise → Otsu Threshold → 2× Upscale
    ↓
EasyOCR — extract text (A-Z, 0-9 allowlist only)
    ↓
Regex validation — match Indian plate format (XX 00 XX 0000)
    ↓
JSON response → Spring Boot backend
```

**Detection status logic:**
- `AUTO_DETECTED` — YOLO conf > 0.5 AND OCR conf > 0.75 AND regex matches
- `MANUAL_REVIEW` — YOLO found plate but OCR confidence low or regex fails
- `MANUAL_ENTRY` — No plate detected or YOLO conf < 0.5

---

## Project Structure

```
parking-camera-service/
├── app/
│   ├── main.py            — FastAPI app, all endpoints
│   ├── detector.py        — YOLOv11 inference, bounding box extraction
│   ├── preprocessor.py    — CLAHE + grayscale + skew correction pipeline
│   ├── recognizer.py      — EasyOCR with allowlist configuration
│   ├── validator.py       — Indian plate regex + state code validation
│   ├── schemas.py         — Pydantic request/response models
│   ├── backend_client.py  — HTTP client for Spring Boot integration
│   ├── camera.py          — Camera capture handler
│   └── config.py          — Environment config loader
├── models/
│   └── best.pt            — Trained YOLOv11 weights (not in git)
├── outputs/
│   ├── annotated_images/  — Runtime output (not in git)
│   └── test_images/       — Test images for demo
├── training/
│   ├── license_plate_training.ipynb  — Google Colab training notebook
│   └── dataset.yaml       — Roboflow dataset config
├── tests/
│   └── test_anpr_service.py
├── .env                   — Environment variables (not in git)
├── requirements.txt
└── start.py               — Service entry point
```

---

## Model Performance

Trained on merged Indian license plate dataset from Roboflow (~3,000 images).

| Metric | Result | Paper Target |
|---|---|---|
| mAP@0.5 | 0.906 | 0.924 |
| mAP@0.5:0.95 | 0.745 | — |
| Precision | 0.745 | — |
| Recall | 0.941 | — |
| Inference Time | ~43ms | 43ms |

---

## Setup

### Prerequisites
- Python 3.10+
- `models/best.pt` — download from Google Colab after training

### Install

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

### Configure

Edit `.env`:

```env
MODEL_PATH=models/best.pt
CAMERA_SOURCE=0
BACKEND_URL=http://localhost:8080
MALL_ID=1
DETECTION_CONFIDENCE=0.5
IMAGE_SIZE=640
AUTH_TOKEN=
```

### Run

```bash
python start.py
```

Service starts at `http://localhost:8000`
Swagger UI at `http://localhost:8000/docs`

---

## API

### POST /detect
Detect and read a license plate from an uploaded image.

**Request:** multipart/form-data with image file

**Response:**
```json
{
  "plate_number": "MH12AB1234",
  "confidence": 0.87,
  "status": "AUTO_DETECTED",
  "yolo_confidence": 0.91,
  "ocr_confidence": 0.83,
  "raw_ocr_output": "MH 12 AB 1234",
  "cropped_plate_base64": "<base64 string>"
}
```

### GET /health
Returns service health status.

### POST /api/v1/scan-plate
Full pipeline — detects plate and registers entry with Spring Boot backend.

### POST /api/v1/process-exit
Detects plate and registers vehicle exit with Spring Boot backend.

---

## Indian Plate Format

Standard format: `XX 00 XX 0000` (e.g., MH 12 AB 1234)

Valid state codes (37 total):
AN, AP, AR, AS, BR, CH, CG, DN, DD, DL, GA, GJ, HR, HP, JK, JH, KA, KL,
LD, MP, MH, MN, ML, MZ, NL, OD, PY, PB, RJ, SK, TN, TS, TR, UP, UK, WB, BH

---

## Spring Boot Integration

The Spring Boot backend calls this service at `POST /detect` with a 
multipart image. Configure the URL in Spring Boot's `application.properties`:

```properties
anpr.service.url=http://localhost:8000
anpr.confidence.threshold=0.75
```

---

## Training

The model was trained in Google Colab using the Ultralytics YOLOv11 framework.
The training notebook is at `training/license_plate_training.ipynb`.

To retrain:
1. Open the notebook in Google Colab
2. Set runtime to T4 GPU
3. Run all cells
4. Download `best.pt` and place it in `models/`

---

## Known Limitations

- OCR accuracy drops on dirty, damaged, or heavily angled plates
- Hindi/regional script on plates not supported (English OCR only)
- Requires good lighting — very dark or overexposed images reduce accuracy
- CPU inference is slow (~1-2 sec/image) — GPU recommended for production

---

*Reference: Parvaiz, Shamim, Saleem, Rasool — IJCA Vol. 187, No. 48, Oct 2025*
