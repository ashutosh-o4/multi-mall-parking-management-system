#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  NEW OCR Pipeline — Accuracy Benchmark
  Based on camera.md (Positional Correction + State Code Fix)
═══════════════════════════════════════════════════════════════════════════════

This script implements the COMPLETE new post-processing pipeline from camera.md
and benchmarks it against the 21 test images in outputs/test_images/.

NOTE: Uses EasyOCR as the recognition engine because PaddlePaddle 3.x has a
known oneDNN bug on Windows/CPU (Python 3.13). The new pipeline's value is in
Stages 4-6 (cleanup, positional fix, state correction) — the OCR engine can
be swapped to PaddleOCR when deploying on Colab/Linux.

Pipeline stages:
  1. YOLO Detection + Crop           (services/yolo_service.py)
  2. OpenCV Preprocessing            (utils/image_utils.py)
  3. EasyOCR Text Extraction         (swap for PaddleOCR on Linux/Colab)
  4. Raw Text Cleanup                (services/plate_validator.py)
  5. Positional Character Correction (core/ocr_mappings.py)
  6. State Code Correction           (core/state_codes.py)

Usage:
  python test_new_ocr_pipeline.py                      # batch mode (all images)
  python test_new_ocr_pipeline.py car1.jpg HR26DQ5551  # single image mode

Dependencies:
  pip install ultralytics easyocr opencv-python
"""

import re
import sys
import time
import csv
import cv2
import numpy as np
from pathlib import Path
from dataclasses import dataclass, field


# ═══════════════════════════════════════════════════════════════════════════════
# GROUND TRUTH — Same as test_ocr.py
# ═══════════════════════════════════════════════════════════════════════════════

GROUND_TRUTH = {
    "car1.jpg":    "HR26DQ5551",
    "car2.jpeg":   "WB06F5977",
    "car3.jpeg":   "22BH6517A",
    "car4.jpeg":   "RJ14CV0002",
    "car5.jpeg":   "22BH6517A",
    "car6.jpeg":   "LA020749",
    "car7.jpeg":   "MH47BP8265",
    "car8.jpeg":   "MH20DV2366",
    "car9.jpeg":   "UP53DV9006",
    "car10.jpeg":  "HP01H5011",
    "car11.jpeg":  "MH12DE1433",
    "car12.jpeg":  "HR26DK8337",
    "car13.jpeg":  "TN87C5106",
    "car14.webp":  "RJ19UC7034",
    "car15.jpeg":  "WB06F5977",
    "car16.jpg":   "HR88B8888",
    "car17.jpeg":  "MH12DE1433",
    "car18.jpeg":  "MH20EJ0364",
    "car19.jpeg":  "MP20CF0072",
    "car19.webp":  "MP33C3370",
    "car20.webp":  "HR26FC2782",
}


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 1 — YOLO Detection (from camera.md §5, Stage 1)
# ═══════════════════════════════════════════════════════════════════════════════

class YOLOService:
    def __init__(self, model_path: str, confidence: float = 0.5):
        from ultralytics import YOLO
        self.model = YOLO(model_path)
        self.confidence = confidence

    def detect_plates(self, frame: np.ndarray) -> list[dict]:
        """Returns list sorted by confidence (highest first)."""
        results = self.model.predict(frame, conf=self.confidence, verbose=False)

        plates = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            plates.append({
                "bbox": [x1, y1, x2, y2],
                "confidence": float(box.conf[0]),
                "crop": frame[y1:y2, x1:x2].copy(),
            })

        return sorted(plates, key=lambda p: p["confidence"], reverse=True)


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 2 — Image Preprocessing (from camera.md §5, Stage 2)
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class PreprocessConfig:
    target_height: int = 128
    blur_kernel: tuple = field(default_factory=lambda: (3, 3))
    threshold_block_size: int = 11
    threshold_c: int = 2
    interpolation: int = cv2.INTER_CUBIC


def preprocess_plate(
    source: np.ndarray, config: PreprocessConfig = None
) -> np.ndarray:
    """Standard preprocessing: resize → grayscale → denoise → adaptive threshold."""
    if config is None:
        config = PreprocessConfig()

    h, w = source.shape[:2]
    scale = config.target_height / h
    resized = cv2.resize(
        source, (int(w * scale), config.target_height),
        interpolation=config.interpolation,
    )
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    denoised = cv2.GaussianBlur(gray, config.blur_kernel, 0)
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        config.threshold_block_size,
        config.threshold_c,
    )
    return thresh


def preprocess_plate_inverted(
    source: np.ndarray, config: PreprocessConfig = None
) -> np.ndarray:
    """Inverted preprocessing for retry on white-on-dark plates."""
    return cv2.bitwise_not(preprocess_plate(source, config))


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 3 — OCR Text Extraction
#   Uses EasyOCR locally (PaddlePaddle 3.x has oneDNN bug on Win/CPU).
#   Same interface as camera.md OCRService — swap to PaddleOCR on Linux/Colab.
# ═══════════════════════════════════════════════════════════════════════════════

class OCRService:
    def __init__(self, min_confidence: float = 0.1, lang: str = "en"):
        import easyocr
        self.reader = easyocr.Reader([lang], gpu=False, verbose=False)
        self.min_confidence = min_confidence
        # Only allow alphanumeric chars valid in Indian license plates
        self.allowlist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    def extract_text(self, plate_img: np.ndarray) -> tuple:
        """
        Run OCR on a plate image.
        Handles multi-line plates by sorting text boxes top-to-bottom.
        Returns (raw_text, avg_confidence) or (None, 0.0) on failure.
        """
        try:
            results = self.reader.readtext(
                plate_img,
                detail=1,
                allowlist=self.allowlist,
                paragraph=False,
            )

            if not results:
                return None, 0.0

            # Sort by Y position (top-to-bottom) for multi-line plates
            sorted_results = sorted(results, key=lambda r: r[0][0][1])

            texts, confidences = [], []
            for bbox, text, conf in sorted_results:
                text = text.strip().upper()
                if text and conf >= self.min_confidence:
                    texts.append(text)
                    confidences.append(conf)

            if not texts:
                return None, 0.0

            return " ".join(texts), sum(confidences) / len(confidences)

        except Exception as e:
            print(f"    ⚠ EasyOCR error: {e}")
            return None, 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 4 — Raw Text Cleanup (from camera.md §5, Stage 4)
# ═══════════════════════════════════════════════════════════════════════════════

def clean_raw_text(raw: str) -> str:
    """Remove IND strips, non-alphanumeric chars, normalize to uppercase."""
    text = raw.upper()
    text = re.sub(r'^(I?N?D|1ND?|lND?)\s*', '', text)
    text = re.sub(r'\s*(I?N?D|1ND?|lND?)\s*$', '', text)
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 5 — Positional Character Correction (from camera.md §5, Stage 5)
# ═══════════════════════════════════════════════════════════════════════════════

# 5a — Character Mappings (core/ocr_mappings.py)
LETTER_TO_DIGIT = {
    'O': '0',   'I': '1',
    'S': '5',   'B': '8',   'Z': '2',   'G': '6',
}

DIGIT_TO_LETTER = {
    '0': 'O',   '1': 'I',   '5': 'S',
    '8': 'B',   '2': 'Z',   '6': 'G',
}


# 5b — Segment Fixer
def fix_segment(segment: str, expected: str) -> str:
    """
    Fix OCR character confusion based on what a segment should contain.
    expected = "letter" → digits are wrong, swap to letter lookalikes
    expected = "digit"  → letters are wrong, swap to digit lookalikes
    """
    result = []
    for ch in segment:
        if expected == "letter" and ch.isdigit():
            result.append(DIGIT_TO_LETTER.get(ch, ch))
        elif expected == "digit" and ch.isalpha():
            result.append(LETTER_TO_DIGIT.get(ch, ch))
        else:
            result.append(ch)
    return ''.join(result)


# 5c — Plate Parser (Standard + BH Series)
STANDARD_RE = re.compile(r'^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$')
BH_RE       = re.compile(r'^(\d{2})(BH)(\d{4})([A-Z]{2})$')


def parse_plate(text: str) -> dict | None:
    """
    Parse a cleaned plate string into structured segments.
    Returns dict or None if text cannot be parsed as a valid Indian plate.
    """

    # Try BH-series first (Bharat series — national format)
    m = BH_RE.match(text)
    if m:
        year_fixed   = fix_segment(m[1], "digit")
        number_fixed = fix_segment(m[3], "digit")
        series_fixed = fix_segment(m[4], "letter")
        return {
            "type": "BH",
            "year": year_fixed,
            "state": "BH",
            "number": number_fixed,
            "series": series_fixed,
            "formatted": f"{year_fixed}BH{number_fixed}{series_fixed}",
        }

    # Try standard format
    if len(text) >= 6:
        state = fix_segment(text[:2], "letter")
        rest  = text[2:]

        # Extract district digits — apply correction first, then check isdigit()
        district_chars = []
        rest_idx = 0
        for ch in rest:
            fixed_ch = LETTER_TO_DIGIT.get(ch, ch) if ch.isalpha() else ch
            if fixed_ch.isdigit():
                district_chars.append(fixed_ch)
                rest_idx += 1
            else:
                break

        if not district_chars:
            return None

        district = ''.join(district_chars)
        remaining = rest[rest_idx:]

        # Split remaining into series (letters) and number (trailing digits)
        num_start = len(remaining)
        for i in range(len(remaining) - 1, -1, -1):
            fixed_ch = LETTER_TO_DIGIT.get(remaining[i], remaining[i]) \
                       if remaining[i].isalpha() else remaining[i]
            if fixed_ch.isdigit():
                num_start = i
            else:
                break

        series = fix_segment(remaining[:num_start], "letter")
        number = fix_segment(remaining[num_start:], "digit")

        fixed = f"{state}{district}{series}{number}"

        m2 = STANDARD_RE.match(fixed)
        if m2:
            return {
                "type": "standard",
                "state": m2[1],
                "district": int(m2[2]),
                "series": m2[3],
                "number": m2[4],
                "formatted": fixed,
            }

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 6 — State Code Correction (from camera.md §5, Stage 6)
# ═══════════════════════════════════════════════════════════════════════════════

VALID_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP",
    "JH", "KA", "KL", "MP", "MH", "MN", "ML", "MZ", "NL",
    "OD", "PB", "RJ", "SK", "TN", "TG", "TR", "UP", "UK",
    "WB", "AN", "CH", "DN", "DD", "DL", "JK", "LA", "LD", "PY",
}

STATE_DISTRICT_MAP = {
    "AP": 39,  "AR": 26,  "AS": 30,  "BR": 38,  "CG": 33,
    "GA":  2,  "GJ": 34,  "HR": 99,  "HP": 12,  "JH": 24,
    "KA": 99,  "KL": 75,  "MP": 99,  "MH": 99,  "MN": 16,
    "ML": 12,  "MZ": 11,  "NL": 12,  "OD": 39,  "PB": 99,
    "RJ": 54,  "SK":  4,  "TN": 99,  "TG": 36,  "TR":  9,
    "UP": 99,  "UK": 20,  "WB": 99,  "AN":  3,  "CH":  4,
    "DN":  3,  "DD":  2,  "DL": 13,  "JK": 21,  "LA":  2,
    "LD":  1,  "PY":  5,
}


def _levenshtein_distance(s1: str, s2: str) -> int:
    """Compute Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def correct_state_code(
    ocr_state: str, district_num: int
) -> tuple:
    """Tier 1 + Tier 2 state code correction using Levenshtein distance."""
    if ocr_state in VALID_STATE_CODES:
        return ocr_state, "exact"

    candidates = [
        code for code in VALID_STATE_CODES
        if _levenshtein_distance(ocr_state, code) == 1
    ]

    if len(candidates) == 0:
        return None, "failed"

    if len(candidates) == 1:
        return candidates[0], "tier1"

    valid_by_district = [
        code for code in candidates
        if 1 <= district_num <= STATE_DISTRICT_MAP.get(code, 0)
    ]

    if len(valid_by_district) == 1:
        return valid_by_district[0], "tier2"

    return None, "failed"


# ═══════════════════════════════════════════════════════════════════════════════
# FULL PIPELINE ORCHESTRATOR (from camera.md §5, Orchestrator)
# ═══════════════════════════════════════════════════════════════════════════════

def extract_plate_text(raw_ocr: str) -> dict:
    """Full post-OCR pipeline: clean → parse → fix chars → correct state."""
    cleaned = clean_raw_text(raw_ocr)
    parsed = parse_plate(cleaned)

    if parsed is None:
        return {
            "plate": None, "valid": False,
            "corrected": False, "correction_method": "failed",
            "parsed": None, "cleaned": cleaned,
        }

    corrected = False
    method = "exact"

    if parsed["type"] == "standard":
        corrected_state, method = correct_state_code(
            parsed["state"], parsed["district"]
        )
        if corrected_state is None:
            return {
                "plate": None, "valid": False,
                "corrected": False, "correction_method": "failed",
                "parsed": parsed, "cleaned": cleaned,
            }
        if corrected_state != parsed["state"]:
            corrected = True
            parsed["state"] = corrected_state
            parsed["formatted"] = (
                f"{corrected_state}{parsed['district']}"
                f"{parsed['series']}{parsed['number']}"
            )

    return {
        "plate": parsed["formatted"],
        "valid": True,
        "corrected": corrected,
        "correction_method": method,
        "parsed": parsed,
        "cleaned": cleaned,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# BENCHMARK RUNNER
# ═══════════════════════════════════════════════════════════════════════════════

OCR_MIN_CONFIDENCE = 0.75  # retry threshold from camera.md


def run_single_image(
    yolo_service: YOLOService,
    ocr_service: OCRService,
    image_path: str,
    expected_plate: str,
    index: int,
    total: int,
) -> dict:
    """Run the full new pipeline on a single image and compare to ground truth."""

    filename = Path(image_path).name
    label = f"[{index}/{total}] {filename}"

    print(f"\n{'─'*80}")
    print(f"  {label}")
    print(f"  Expected: {expected_plate}")
    print(f"{'─'*80}")

    start = time.time()

    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"  ❌ Could not load image")
        return _error_result(filename, expected_plate, "Image load failed")

    print(f"  Image: {image.shape[1]}×{image.shape[0]} px")

    # --- Stage 1: YOLO Detection ---
    try:
        plates = yolo_service.detect_plates(image)
    except Exception as e:
        print(f"  ❌ YOLO error: {e}")
        return _error_result(filename, expected_plate, f"YOLO: {e}")

    if not plates:
        print(f"  ❌ No plate detected")
        return _error_result(filename, expected_plate, "No plate detected", status="NO_DETECTION")

    crop = plates[0]["crop"]
    detection_conf = plates[0]["confidence"]
    bbox = plates[0]["bbox"]
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    print(f"  YOLO: {len(plates)} plate(s) | Best conf: {detection_conf:.4f} | Crop: {w}×{h}")

    # --- Stage 2 + 3: OCR with multi-attempt strategy ---
    # Attempt 1: Raw crop (EasyOCR works best with original image)
    raw_text, ocr_conf = ocr_service.extract_text(crop)
    attempt_used = "raw"

    # Attempt 2: Preprocessed (adaptive threshold — helps noisy/low-contrast)
    if raw_text is None or ocr_conf < OCR_MIN_CONFIDENCE:
        preprocessed = preprocess_plate(crop)
        raw_text_2, ocr_conf_2 = ocr_service.extract_text(preprocessed)
        if raw_text_2 is not None and ocr_conf_2 > (ocr_conf or 0):
            raw_text, ocr_conf = raw_text_2, ocr_conf_2
            attempt_used = "preprocessed"

    # Attempt 3: Inverted preprocessing (white-on-dark plates)
    if raw_text is None or ocr_conf < OCR_MIN_CONFIDENCE:
        preprocessed_inv = preprocess_plate_inverted(crop)
        raw_text_3, ocr_conf_3 = ocr_service.extract_text(preprocessed_inv)
        if raw_text_3 is not None and ocr_conf_3 > (ocr_conf or 0):
            raw_text, ocr_conf = raw_text_3, ocr_conf_3
            attempt_used = "inverted"

    if attempt_used != "raw":
        print(f"  ↩ Best result from: {attempt_used}")

    if raw_text is None:
        print(f"  ❌ OCR returned no text")
        return _error_result(
            filename, expected_plate, "OCR returned no text",
            yolo_conf=detection_conf, status="OCR_FAIL"
        )

    # --- Stage 4 + 5 + 6: Clean → Parse → Fix → Correct State ---
    result = extract_plate_text(raw_text)

    elapsed_ms = int((time.time() - start) * 1000)

    # Use the final plate output, or cleaned text if parsing failed
    final_plate = result["plate"] if result["valid"] else result.get("cleaned", "")
    expected_upper = expected_plate.upper().replace(" ", "")
    actual_upper = (final_plate or "").upper().replace(" ", "")

    # Compute accuracy metrics
    max_len = max(len(expected_upper), len(actual_upper), 1)
    char_matches = sum(1 for e, a in zip(expected_upper, actual_upper) if e == a)
    char_accuracy = (char_matches / max_len * 100)
    exact_match = expected_upper == actual_upper
    edit_dist = _levenshtein_distance(expected_upper, actual_upper)

    symbol = "✅" if exact_match else ("⚠️" if char_accuracy >= 80 else "❌")
    print(f"  OCR raw:       {raw_text}")
    print(f"  Cleaned:       {result.get('cleaned', '')}")
    print(f"  Final plate:   {final_plate or '(parse failed)'}")
    print(f"  Corrected:     {result.get('corrected', False)} ({result.get('correction_method', '-')})")
    print(f"  {symbol} Accuracy: {char_accuracy:.1f}% | Edit dist: {edit_dist} | "
          f"YOLO: {detection_conf:.3f} | OCR: {ocr_conf:.3f} | Time: {elapsed_ms}ms")

    return {
        "file": filename,
        "expected": expected_upper,
        "raw_ocr": raw_text,
        "cleaned": result.get("cleaned", ""),
        "final_plate": actual_upper,
        "exact_match": exact_match,
        "char_accuracy": char_accuracy,
        "edit_distance": edit_dist,
        "yolo_conf": detection_conf,
        "ocr_conf": ocr_conf,
        "corrected": result.get("corrected", False),
        "correction_method": result.get("correction_method", "-"),
        "valid_parse": result.get("valid", False),
        "time_ms": elapsed_ms,
        "status": "OK",
        "error": None,
    }


def _error_result(
    filename, expected, error, yolo_conf=0.0, status="FAILED"
) -> dict:
    return {
        "file": filename,
        "expected": expected.upper().replace(" ", ""),
        "raw_ocr": "",
        "cleaned": "",
        "final_plate": "",
        "exact_match": False,
        "char_accuracy": 0.0,
        "edit_distance": len(expected),
        "yolo_conf": yolo_conf,
        "ocr_conf": 0.0,
        "corrected": False,
        "correction_method": "-",
        "valid_parse": False,
        "time_ms": 0,
        "status": status,
        "error": error,
    }


def print_summary(results: list[dict]) -> None:
    """Print a detailed summary of the benchmark results."""

    successful = [r for r in results if r["status"] == "OK"]
    failed = [r for r in results if r["status"] != "OK"]
    exact_matches = [r for r in successful if r["exact_match"]]
    accuracies = [r["char_accuracy"] for r in successful]

    total = len(results)

    print("\n\n" + "═" * 90)
    print("  NEW OCR PIPELINE — BENCHMARK RESULTS  (PaddleOCR + Positional Fix + State Correction)")
    print("═" * 90)

    # Per-image results table
    print(f"\n  {'#':<3} {'File':<16} {'Expected':<14} {'Final Plate':<14} {'Raw OCR':<20} "
          f"{'Acc%':>6} {'ED':>3} {'Corr':>5} {'Match':>5}")
    print(f"  {'─'*3} {'─'*16} {'─'*14} {'─'*14} {'─'*20} "
          f"{'─'*6} {'─'*3} {'─'*5} {'─'*5}")

    for i, r in enumerate(results, 1):
        match_str = "✅" if r["exact_match"] else "❌"
        if r["status"] != "OK":
            match_str = "💀"
        corr_str = r["correction_method"][:5] if r["corrected"] else "-"

        # Truncate raw OCR for table readability
        raw_trunc = r["raw_ocr"][:18] + ".." if len(r["raw_ocr"]) > 20 else r["raw_ocr"]

        print(f"  {i:<3} {r['file']:<16} {r['expected']:<14} {r['final_plate']:<14} "
              f"{raw_trunc:<20} {r['char_accuracy']:>5.1f}% {r['edit_distance']:>3} "
              f"{corr_str:>5} {match_str:>3}")

    # Aggregate numbers
    print(f"\n{'─'*90}")
    print(f"  AGGREGATE METRICS")
    print(f"{'─'*90}")
    print(f"  Total images tested:     {total}")
    print(f"  Successful OCR runs:     {len(successful)}/{total}")
    print(f"  Failed/no detection:     {len(failed)}/{total}")

    if failed:
        for r in failed:
            print(f"    • {r['file']}: {r['status']} — {r['error']}")

    if successful:
        avg_accuracy = sum(accuracies) / len(accuracies)
        min_acc = min(accuracies)
        max_acc = max(accuracies)
        avg_yolo = sum(r["yolo_conf"] for r in successful) / len(successful)
        avg_ocr = sum(r["ocr_conf"] for r in successful) / len(successful)
        avg_edit = sum(r["edit_distance"] for r in successful) / len(successful)
        avg_time = sum(r["time_ms"] for r in successful) / len(successful)
        corrected_count = sum(1 for r in successful if r["corrected"])
        valid_parse = sum(1 for r in successful if r["valid_parse"])

        print(f"\n  Exact match rate:        {len(exact_matches)}/{len(successful)} "
              f"({len(exact_matches)/len(successful)*100:.1f}%)")
        print(f"  Valid plate parsed:      {valid_parse}/{len(successful)} "
              f"({valid_parse/len(successful)*100:.1f}%)")
        print(f"  State code corrections:  {corrected_count}")
        print(f"  Avg character accuracy:  {avg_accuracy:.2f}%")
        print(f"  Min character accuracy:  {min_acc:.2f}%")
        print(f"  Max character accuracy:  {max_acc:.2f}%")
        print(f"  Avg edit distance:       {avg_edit:.2f}")
        print(f"  Avg YOLO confidence:     {avg_yolo:.4f}")
        print(f"  Avg OCR confidence:      {avg_ocr:.4f}")
        print(f"  Avg processing time:     {avg_time:.0f}ms")

        # Accuracy distribution
        perfect = sum(1 for a in accuracies if a == 100)
        high = sum(1 for a in accuracies if 90 <= a < 100)
        medium = sum(1 for a in accuracies if 80 <= a < 90)
        low = sum(1 for a in accuracies if a < 80)

        print(f"\n  Accuracy distribution:")
        print(f"    100%      (perfect):    {perfect:>3}  {'█' * perfect}")
        print(f"    90–99%    (good):       {high:>3}  {'█' * high}")
        print(f"    80–89%    (acceptable): {medium:>3}  {'█' * medium}")
        print(f"    <80%      (poor):       {low:>3}  {'█' * low}")

        # Comparison note
        print(f"\n  ┌──────────────────────────────────────────────────────────────┐")
        print(f"  │  Compare these results against the OLD pipeline (test_ocr.py)│")
        print(f"  │  to see if the new camera.md pipeline is an improvement.     │")
        print(f"  └──────────────────────────────────────────────────────────────┘")

        # Verdict
        print(f"\n{'═'*90}")
        match_rate = len(exact_matches) / len(successful) * 100
        if avg_accuracy >= 95 and match_rate >= 80:
            print("  🏆 VERDICT: EXCELLENT — New pipeline is production-ready")
        elif avg_accuracy >= 85 and match_rate >= 60:
            print("  ✅ VERDICT: GOOD — New pipeline works well, minor improvements possible")
        elif avg_accuracy >= 70:
            print("  ⚠️  VERDICT: ACCEPTABLE — Pipeline works but needs tuning")
        else:
            print("  ❌ VERDICT: POOR — Pipeline needs significant work")
        print(f"{'═'*90}\n")


def save_results_csv(results: list[dict], output_path: str) -> None:
    """Save per-image results to CSV for further analysis."""
    fieldnames = [
        "file", "expected", "final_plate", "raw_ocr", "cleaned",
        "exact_match", "char_accuracy", "edit_distance",
        "yolo_conf", "ocr_conf", "corrected", "correction_method",
        "valid_parse", "time_ms", "status", "error",
    ]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    print(f"  📄 Detailed results saved to: {output_path}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    script_dir = Path(__file__).parent
    test_dir = script_dir / "outputs" / "test_images"
    model_path = script_dir / "models" / "best.pt"

    if not model_path.exists():
        print(f"❌ Model not found at: {model_path}")
        print(f"   Place your YOLO best.pt at: {model_path}")
        sys.exit(1)

    if not test_dir.exists():
        print(f"❌ Test images directory not found: {test_dir}")
        sys.exit(1)

    print("\n" + "═" * 90)
    print("  NEW OCR PIPELINE — ACCURACY BENCHMARK")
    print("  Pipeline: YOLO → OpenCV Preprocess → PaddleOCR → Clean → Fix → State Correct")
    print("═" * 90)

    # Initialize services
    print("\n  🔧 Loading YOLO model...")
    yolo_service = YOLOService(str(model_path))
    print("  🔧 Loading PaddleOCR engine...")
    ocr_service = OCRService()
    print("  ✅ Both services loaded.\n")

    if len(sys.argv) >= 3:
        # Single image mode
        image_path = sys.argv[1]
        expected = sys.argv[2].upper()
        result = run_single_image(yolo_service, ocr_service, image_path, expected, 1, 1)
        sys.exit(0 if result["exact_match"] else 1)
    else:
        # Batch mode
        print(f"  Test directory: {test_dir}")
        print(f"  Total images:   {len(GROUND_TRUTH)}")
        print("═" * 90)

        results = []
        total = len(GROUND_TRUTH)

        for idx, (filename, expected) in enumerate(GROUND_TRUTH.items(), 1):
            image_path = str(test_dir / filename)
            result = run_single_image(
                yolo_service, ocr_service, image_path, expected, idx, total
            )
            results.append(result)

        print_summary(results)

        # Save CSV
        csv_path = str(script_dir / "outputs" / "new_pipeline_benchmark_results.csv")
        save_results_csv(results, csv_path)

        # Exit code
        successful = [r for r in results if r["status"] == "OK"]
        exact = [r for r in successful if r["exact_match"]]
        sys.exit(0 if len(exact) == len(results) else 1)


if __name__ == "__main__":
    main()
