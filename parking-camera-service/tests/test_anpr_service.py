#!/usr/bin/env python
"""
ANPR Service Testing Examples

Run this script to test the ANPR service with various scenarios.
"""

import requests
import json
import time
from pathlib import Path

# Configuration
SERVICE_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:8080"

def test_health():
    """Test service health."""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    try:
        response = requests.get(f"{SERVICE_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_detect_image(image_path: str):
    """Test detection with an image file."""
    print("\n" + "="*60)
    print(f"TEST 2: Detect Plate - {image_path}")
    print("="*60)
    
    if not Path(image_path).exists():
        print(f"✗ Image not found: {image_path}")
        return False
    
    try:
        start = time.time()
        
        with open(image_path, "rb") as f:
            response = requests.post(
                f"{SERVICE_URL}/detect",
                files={"file": f},
                timeout=30
            )
        
        elapsed = time.time() - start
        
        print(f"Status: {response.status_code}")
        print(f"Response Time: {elapsed:.2f}s")
        
        data = response.json()
        print(json.dumps(data, indent=2))
        
        # Analyze result
        if response.status_code == 200:
            print(f"\n✓ Detection successful!")
            print(f"  Plate: {data.get('plate_number')}")
            print(f"  Status: {data.get('status')}")
            print(f"  Confidence: {data.get('confidence', 0)*100:.1f}%")
            print(f"  YOLO: {data.get('yolo_confidence', 0)*100:.1f}%")
            print(f"  OCR: {data.get('ocr_confidence', 0)*100:.1f}%")
        elif response.status_code == 404:
            print(f"\n⚠ No plate detected (expected for some images)")
        else:
            print(f"\n✗ Unexpected status: {response.status_code}")
        
        return response.status_code in [200, 404]
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_batch_detection(image_dir: str):
    """Test detection with multiple images."""
    print("\n" + "="*60)
    print(f"TEST 3: Batch Detection - {image_dir}")
    print("="*60)
    
    image_path = Path(image_dir)
    if not image_path.exists():
        print(f"✗ Directory not found: {image_dir}")
        return False
    
    images = list(image_path.glob("*.jpg")) + list(image_path.glob("*.png"))
    
    if not images:
        print(f"✗ No images found in: {image_dir}")
        return False
    
    print(f"Found {len(images)} images")
    
    results = {
        "auto_detected": 0,
        "manual_review": 0,
        "manual_entry": 0,
        "errors": 0,
        "total_time": 0
    }
    
    for img_path in images:
        try:
            start = time.time()
            
            with open(img_path, "rb") as f:
                response = requests.post(
                    f"{SERVICE_URL}/detect",
                    files={"file": f},
                    timeout=30
                )
            
            elapsed = time.time() - start
            results["total_time"] += elapsed
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "unknown")
                results[status.lower().replace(" ", "_")] += 1
                print(f"✓ {img_path.name}: {status} ({elapsed:.2f}s)")
            elif response.status_code == 404:
                print(f"⚠ {img_path.name}: No plate detected")
                results["errors"] += 1
            else:
                print(f"✗ {img_path.name}: Error {response.status_code}")
                results["errors"] += 1
                
        except Exception as e:
            print(f"✗ {img_path.name}: {e}")
            results["errors"] += 1
    
    # Summary
    print(f"\n--- Summary ---")
    print(f"Auto Detected: {results['auto_detected']}")
    print(f"Manual Review: {results['manual_review']}")
    print(f"Manual Entry: {results['manual_entry']}")
    print(f"Errors: {results['errors']}")
    print(f"Total Time: {results['total_time']:.2f}s")
    if len(images) > 0:
        print(f"Avg Time: {results['total_time']/len(images):.2f}s per image")
    
    return True

def test_backend_integration():
    """Test integration with Spring Boot backend."""
    print("\n" + "="*60)
    print("TEST 4: Backend Integration")
    print("="*60)
    
    try:
        # Check if backend is running
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        
        if response.status_code == 200:
            print(f"✓ Backend is running")
            print(json.dumps(response.json(), indent=2))
            
            # Try to get active entries for mall 1
            try:
                entries = requests.get(
                    f"{BACKEND_URL}/entries/mall/1/active",
                    timeout=5
                )
                print(f"\nActive entries for mall 1: {entries.json()}")
            except Exception as e:
                print(f"Could not retrieve active entries: {e}")
            
            return True
        else:
            print(f"✗ Backend returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Backend not reachable at {BACKEND_URL}")
        print("  (This is OK for testing without backend)")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_invalid_image():
    """Test with invalid image."""
    print("\n" + "="*60)
    print("TEST 5: Invalid Image Handling")
    print("="*60)
    
    try:
        # Create invalid image data
        invalid_data = b"not an image"
        
        response = requests.post(
            f"{SERVICE_URL}/detect",
            files={"file": ("invalid.jpg", invalid_data)},
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 400:
            print("\n✓ Invalid image properly rejected")
            return True
        else:
            print(f"\n✗ Unexpected response for invalid image")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_csv_download():
    """Test CSV download endpoint."""
    print("\n" + "="*60)
    print("TEST 6: CSV Download")
    print("="*60)
    
    try:
        response = requests.get(
            f"{SERVICE_URL}/api/v1/detections/csv",
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            lines = response.text.split("\n")
            print(f"CSV rows: {len(lines)}")
            if len(lines) > 1:
                print(f"Headers: {lines[0]}")
                print(f"Sample: {lines[1]}")
            print("\n✓ CSV download successful")
            return True
        else:
            print(json.dumps(response.json(), indent=2))
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*10 + "ANPR SERVICE TEST SUITE" + " "*25 + "║")
    print("╚" + "="*58 + "╝")
    
    tests = [
        ("Health Check", test_health),
        ("Detect Plate", lambda: test_detect_image("test_image.jpg")),
        ("Batch Detection", lambda: test_batch_detection("test_images")),
        ("Backend Integration", test_backend_integration),
        ("Invalid Image Handling", test_invalid_image),
        ("CSV Download", test_csv_download),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = "PASS" if result else "FAIL"
        except KeyboardInterrupt:
            print("\n\nTests interrupted by user")
            break
        except Exception as e:
            print(f"\n✗ Test error: {e}")
            results[test_name] = "ERROR"
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results.items():
        status_symbol = "✓" if result == "PASS" else "✗"
        print(f"{status_symbol} {test_name}: {result}")
    
    passed = sum(1 for r in results.values() if r == "PASS")
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")

if __name__ == "__main__":
    main()
