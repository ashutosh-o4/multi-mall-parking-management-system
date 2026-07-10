#!/usr/bin/env python
"""
Quick start script for ANPR service.

Usage:
    python start.py          # Run service in development mode
    python start.py --prod   # Run in production mode
"""
import os
import sys
import subprocess
from pathlib import Path

def check_model():
    """Check if model file exists."""
    model_path = Path("models/best.pt")
    if not model_path.exists():
        print("⚠️  WARNING: Model file not found at models/best.pt")
        print("   Please download your trained model from Google Colab training notebook")
        print("   and place it in the models/ directory")
        return False
    return True

def check_dependencies():
    """Check if all dependencies are installed."""
    try:
        import fastapi
        import ultralytics
        import easyocr
        import cv2
        print("✓ All dependencies installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("  Run: pip install -r requirements.txt")
        return False

def check_backend():
    """Check if Spring Boot backend is reachable."""
    import requests
    try:
        response = requests.get("http://localhost:8080/health", timeout=2)
        if response.status_code == 200:
            print("✓ Spring Boot backend is running")
            return True
    except:
        pass
    
    print("⚠️  WARNING: Spring Boot backend not reachable at http://localhost:8080")
    print("   Check .env for correct BACKEND_URL")
    return False

def main():
    """Start the service."""
    print("=" * 60)
    print("PARKING ANPR CAMERA SERVICE")
    print("=" * 60)
    
    # Pre-startup checks
    print("\n[Startup Checks]")
    checks = [
        ("Model file", check_model()),
        ("Dependencies", check_dependencies()),
        ("Backend", check_backend()),
    ]
    
    print("\n" + "=" * 60)
    
    # Determine mode
    prod_mode = "--prod" in sys.argv
    
    if prod_mode:
        print("\n🚀 Starting in PRODUCTION MODE")
        cmd = [
            "uvicorn", "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--workers", "4"
        ]
    else:
        print("\n🔧 Starting in DEVELOPMENT MODE (with auto-reload)")
        cmd = [
            "uvicorn", "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ]
    
    print(f"\nCommand: {' '.join(cmd)}")
    print("\nAPI Documentation: http://localhost:8000/docs")
    print("=" * 60)
    
    # Start service
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n\nShutdown requested by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
