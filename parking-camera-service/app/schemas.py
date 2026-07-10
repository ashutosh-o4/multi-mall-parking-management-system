"""
Pydantic models for request/response serialization.

Paper reference:
    Section 5 (Algorithm 1): Output format and response structure
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal


class PlateDetectionResponse(BaseModel):
    """
    Response JSON from /detect endpoint.
    
    Follows the exact format specified in the ANPR pipeline requirements.
    """
    plate_number: str = Field(
        description="Validated license plate number (e.g., 'MH12AB1234')"
    )
    confidence: float = Field(
        description="Overall confidence score (0.0-1.0)"
    )
    status: Literal["AUTO_DETECTED", "MANUAL_REVIEW", "MANUAL_ENTRY"] = Field(
        description="Detection status based on confidence thresholds"
    )
    cropped_plate_base64: str = Field(
        description="Base64-encoded cropped plate image"
    )
    yolo_confidence: float = Field(
        description="YOLO detection confidence (0.0-1.0)"
    )
    ocr_confidence: float = Field(
        description="EasyOCR text confidence (0.0-1.0)"
    )
    raw_ocr_output: str = Field(
        description="Raw OCR output before validation (e.g., 'MH 12 AB 1234')"
    )


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model: str
    version: str


class ErrorResponse(BaseModel):
    """Error response format."""
    error: str
    details: Optional[str] = None
    status: Literal["NO_PLATE_DETECTED", "INVALID_IMAGE", "PROCESSING_ERROR"] = None
