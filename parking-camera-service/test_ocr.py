#!/usr/bin/env python3
"""
OCR Accuracy Test with YOLO Detection — Batch Mode

Detects license plates using YOLOv11 and tests OCR accuracy against ground truth
across multiple test images.
"""

import sys
import cv2
import numpy as np
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.detector import detect_plates
from app.preprocessor import preprocess_plate
from app.recognizer import read_plate_text
from app.validator import clean_plate_text


# ─── Ground truth: filename → expected plate (no spaces) ───
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


def levenshtein(s1: str, s2: str) -> int:
    """Compute Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
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


def test_single_image(image_path: str, expected_plate: str, index: int, total: int):
    """
    Test OCR accuracy on a single image.

    Returns a dict with results or None if detection failed entirely.
    """
    filename = Path(image_path).name
    label = f"[{index}/{total}] {filename}"

    print(f"\n{'─'*80}")
    print(f"  {label}")
    print(f"  Expected: {expected_plate}")
    print(f"{'─'*80}")

    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"  ❌ Could not load image")
        return {
            "file": filename, "expected": expected_plate,
            "ocr_text": "", "cleaned": "",
            "exact_match": False, "char_accuracy": 0.0,
            "edit_distance": len(expected_plate),
            "yolo_conf": 0.0, "ocr_conf": 0.0,
            "status": "FAILED", "error": "Image load failed",
        }

    print(f"  Image: {image.shape[1]}×{image.shape[0]} px")

    # YOLO detection
    try:
        boxes = detect_plates(image)
    except Exception as e:
        print(f"  ❌ YOLO error: {e}")
        return {
            "file": filename, "expected": expected_plate,
            "ocr_text": "", "cleaned": "",
            "exact_match": False, "char_accuracy": 0.0,
            "edit_distance": len(expected_plate),
            "yolo_conf": 0.0, "ocr_conf": 0.0,
            "status": "FAILED", "error": f"YOLO: {e}",
        }

    if not boxes or len(boxes) == 0:
        print(f"  ❌ No plate detected")
        return {
            "file": filename, "expected": expected_plate,
            "ocr_text": "", "cleaned": "",
            "exact_match": False, "char_accuracy": 0.0,
            "edit_distance": len(expected_plate),
            "yolo_conf": 0.0, "ocr_conf": 0.0,
            "status": "NO_DETECTION", "error": "No plate found",
        }

    detection = boxes[0]
    yolo_conf = detection["confidence"]
    crop = detection["crop"]
    w = detection["x2"] - detection["x1"]
    h = detection["y2"] - detection["y1"]
    print(f"  YOLO: {len(boxes)} plate(s) | Best conf: {yolo_conf:.4f} | Crop: {w}×{h}")

    # Preprocessing
    try:
        preprocessed, quality_score = preprocess_plate(crop)
    except Exception as e:
        print(f"  ❌ Preprocess error: {e}")
        return {
            "file": filename, "expected": expected_plate,
            "ocr_text": "", "cleaned": "",
            "exact_match": False, "char_accuracy": 0.0,
            "edit_distance": len(expected_plate),
            "yolo_conf": yolo_conf, "ocr_conf": 0.0,
            "status": "FAILED", "error": f"Preprocess: {e}",
        }

    # OCR
    try:
        ocr_text, ocr_conf = read_plate_text(crop)
    except Exception as e:
        print(f"  ❌ OCR error: {e}")
        return {
            "file": filename, "expected": expected_plate,
            "ocr_text": "", "cleaned": "",
            "exact_match": False, "char_accuracy": 0.0,
            "edit_distance": len(expected_plate),
            "yolo_conf": yolo_conf, "ocr_conf": 0.0,
            "status": "FAILED", "error": f"OCR: {e}",
        }

    # Accuracy calculation (ignore spaces)
    cleaned = clean_plate_text(ocr_text)
    expected_upper = expected_plate.upper().replace(" ", "")
    actual_upper = cleaned.upper().replace(" ", "")

    max_len = max(len(expected_upper), len(actual_upper))
    char_matches = sum(1 for e, a in zip(expected_upper, actual_upper) if e == a)
    char_accuracy = (char_matches / max_len * 100) if max_len > 0 else 0
    exact_match = expected_upper == actual_upper
    edit_dist = levenshtein(expected_upper, actual_upper)

    symbol = "✅" if exact_match else ("⚠️" if char_accuracy >= 80 else "❌")
    print(f"  OCR raw:     {ocr_text}")
    print(f"  OCR cleaned: {actual_upper}")
    print(f"  {symbol} Accuracy: {char_accuracy:.1f}% | Edit dist: {edit_dist} | "
          f"YOLO: {yolo_conf:.3f} | OCR: {ocr_conf:.3f}")

    return {
        "file": filename, "expected": expected_upper,
        "ocr_text": ocr_text, "cleaned": actual_upper,
        "exact_match": exact_match, "char_accuracy": char_accuracy,
        "edit_distance": edit_dist,
        "yolo_conf": yolo_conf, "ocr_conf": ocr_conf,
        "status": "OK", "error": None,
    }


def run_batch_test(test_dir: str, ground_truth: dict):
    """Run OCR accuracy test across all images with ground truth."""

    print("\n" + "=" * 80)
    print("  BATCH OCR ACCURACY TEST — YOLO + EasyOCR")
    print("=" * 80)
    print(f"  Test directory: {test_dir}")
    print(f"  Total images:   {len(ground_truth)}")
    print("=" * 80)

    results = []
    total = len(ground_truth)

    for idx, (filename, expected) in enumerate(ground_truth.items(), 1):
        image_path = str(Path(test_dir) / filename)
        result = test_single_image(image_path, expected, idx, total)
        results.append(result)

    # ─── Aggregate Stats ───
    successful = [r for r in results if r["status"] == "OK"]
    failed = [r for r in results if r["status"] != "OK"]
    exact_matches = [r for r in successful if r["exact_match"]]
    accuracies = [r["char_accuracy"] for r in successful]

    print("\n\n" + "=" * 80)
    print("  RESULTS SUMMARY")
    print("=" * 80)

    # Per-image table
    print(f"\n  {'#':<3} {'File':<16} {'Expected':<14} {'OCR Output':<14} {'Acc%':>6} {'ED':>3} {'Match':>6}")
    print(f"  {'─'*3} {'─'*16} {'─'*14} {'─'*14} {'─'*6} {'─'*3} {'─'*6}")

    for i, r in enumerate(results, 1):
        match_str = "✅" if r["exact_match"] else "❌"
        if r["status"] != "OK":
            match_str = "💀"
        print(f"  {i:<3} {r['file']:<16} {r['expected']:<14} {r['cleaned']:<14} "
              f"{r['char_accuracy']:>5.1f}% {r['edit_distance']:>3} {match_str:>4}")

    # Aggregate numbers
    print(f"\n{'─'*80}")
    print(f"  AGGREGATE METRICS")
    print(f"{'─'*80}")
    print(f"  Total images tested:     {total}")
    print(f"  Successful detections:   {len(successful)}/{total}")
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

        print(f"\n  Exact match rate:        {len(exact_matches)}/{len(successful)} "
              f"({len(exact_matches)/len(successful)*100:.1f}%)")
        print(f"  Avg character accuracy:  {avg_accuracy:.2f}%")
        print(f"  Min character accuracy:  {min_acc:.2f}%")
        print(f"  Max character accuracy:  {max_acc:.2f}%")
        print(f"  Avg edit distance:       {avg_edit:.2f}")
        print(f"  Avg YOLO confidence:     {avg_yolo:.4f}")
        print(f"  Avg OCR confidence:      {avg_ocr:.4f}")

        # Accuracy buckets
        perfect = sum(1 for a in accuracies if a == 100)
        high = sum(1 for a in accuracies if 90 <= a < 100)
        medium = sum(1 for a in accuracies if 80 <= a < 90)
        low = sum(1 for a in accuracies if a < 80)

        print(f"\n  Accuracy distribution:")
        print(f"    100%      (perfect):   {perfect:>3}  {'█' * perfect}")
        print(f"    90–99%    (good):      {high:>3}  {'█' * high}")
        print(f"    80–89%    (acceptable):{medium:>3}  {'█' * medium}")
        print(f"    <80%      (poor):      {low:>3}  {'█' * low}")

        # Overall verdict
        print(f"\n{'═'*80}")
        if avg_accuracy >= 95 and len(exact_matches) / len(successful) >= 0.8:
            print("  🏆 VERDICT: EXCELLENT — OCR pipeline is production-ready")
        elif avg_accuracy >= 85:
            print("  ✅ VERDICT: GOOD — OCR pipeline works well, minor improvements possible")
        elif avg_accuracy >= 70:
            print("  ⚠️  VERDICT: ACCEPTABLE — OCR works but needs improvement")
        else:
            print("  ❌ VERDICT: POOR — OCR pipeline needs significant work")
        print(f"{'═'*80}\n")

    return results


if __name__ == "__main__":
    test_dir = "outputs/test_images"

    if len(sys.argv) >= 3:
        # Single image mode: python test_ocr.py <image> <plate>
        image_path = sys.argv[1]
        expected_plate = sys.argv[2].upper()
        result = test_single_image(image_path, expected_plate, 1, 1)
        sys.exit(0 if result and result["exact_match"] else 1)
    else:
        # Batch mode: test all images
        results = run_batch_test(test_dir, GROUND_TRUTH)
        successful = [r for r in results if r["status"] == "OK"]
        exact = [r for r in successful if r["exact_match"]]
        sys.exit(0 if len(exact) == len(results) else 1)
