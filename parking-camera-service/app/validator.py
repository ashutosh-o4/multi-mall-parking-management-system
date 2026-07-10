"""
Validation module for Indian license plates.

Paper reference:
    Section 3.3 — "Regex patterns were used to validate extracted text
    against known Indian plate formats and state codes"
    
    Equation (6): s_valid_j = ŝ_j if R(ŝ_j) = True, else ∅

Indian license plate format (standard):
    [State Code (2 letters)] [District Code (1-2 digits)] [Series (1-3 letters)] [Number (1-4 digits)]

Examples:
    MH 12 AB 1234   (Maharashtra)
    KA 01 CD 5678   (Karnataka)
    DL 3C EF 9012   (Delhi)
    TN 07 GH 3456   (Tamil Nadu)
"""
import re
import logging

logger = logging.getLogger(__name__)

# Valid Indian state codes (2 letters)
VALID_STATE_CODES = {
    'AN',  # Andaman and Nicobar
    'AP',  # Andhra Pradesh
    'AR',  # Arunachal Pradesh
    'AS',  # Assam
    'BR',  # Bihar
    'CH',  # Chandigarh
    'CG',  # Chhattisgarh
    'DN',  # Dadra and Nagar Haveli
    'DD',  # Daman and Diu
    'DL',  # Delhi
    'GA',  # Goa
    'GJ',  # Gujarat
    'HR',  # Haryana
    'HP',  # Himachal Pradesh
    'JK',  # Jammu and Kashmir
    'JH',  # Jharkhand
    'KA',  # Karnataka
    'KL',  # Kerala
    'LD',  # Lakshadweep
    'MP',  # Madhya Pradesh
    'MH',  # Maharashtra
    'MN',  # Manipur
    'ML',  # Meghalaya
    'MZ',  # Mizoram
    'NL',  # Nagaland
    'OD',  # Odisha
    'PY',  # Puducherry
    'PB',  # Punjab
    'RJ',  # Rajasthan
    'SK',  # Sikkim
    'TN',  # Tamil Nadu
    'TS',  # Telangana
    'TR',  # Tripura
    'UP',  # Uttar Pradesh
    'UK',  # Uttarakhand
    'WB',  # West Bengal
    'BH',  # Bihar (alternative code sometimes seen)
}

# Confidence thresholds (from paper and requirements)
YOLO_CONFIDENCE_THRESHOLD = 0.5
OCR_CONFIDENCE_THRESHOLD = 0.75


# Regex patterns for Indian plates (flexible for OCR variations)
PLATE_PATTERNS = [
    # Standard: XX DD XX DDDD (with optional spaces)
    re.compile(r'^([A-Z]{2})\s?(\d{1,2})\s?([A-Z]{1,3})\s?(\d{1,4})$'),
    # Compact: XXDDXXDDDD
    re.compile(r'^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$'),
]


def clean_plate_text(raw_text: str) -> str:
    """
    Clean OCR output by removing invalid characters and noisy text.
    
    Strips country markings (IND/INDIA) from both prefix and suffix,
    and removes common labels (GOVT, CONTRACTOR, etc.) that OCR
    picks up from plate surroundings.
    
    Args:
        raw_text: raw OCR output string
    
    Returns:
        str: cleaned uppercase text with A-Z, 0-9 only
    """
    # Remove all non-alphanumeric characters except spaces
    cleaned = re.sub(r'[^A-Z0-9\s]', '', raw_text.upper().strip())
    
    # Collapse multiple spaces into single space
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # Remove noisy labels OCR picks up from plate body or surroundings.
    # These can appear as separate words or concatenated with plate text,
    # so we strip them without requiring word boundaries.
    # Order matters: longer words first to avoid partial matches.
    noise_words = [
        'GOVERNMENT', 'CONTRACTOR', 'CONTRACT', 'COMMERCIAL',
        'TRANSPORT', 'TOURIST', 'PRIVATE',
        'INDIA', 'TAXI', 'GOVT', 'IND',
    ]
    for word in noise_words:
        cleaned = cleaned.replace(word, '')
    
    # Collapse spaces again and strip
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned


def extract_plate_components(plate_text: str) -> dict:
    """
    Extract components from a validated plate.
    
    Args:
        plate_text: validated plate text (e.g., "MH 12 AB 1234")
    
    Returns:
        dict: {state_code, district_code, series, number} or None if invalid
    """
    # Try each pattern
    for pattern in PLATE_PATTERNS:
        match = pattern.match(plate_text.replace(' ', ''))
        if match:
            state, district, series, number = match.groups()
            return {
                'state_code': state,
                'district_code': district,
                'series': series,
                'number': number
            }
    
    return None


def validate_plate_format(plate_text: str) -> tuple[bool, dict]:
    """
    Validate plate against Indian format and state codes.
    
    Paper Equation (6): s_valid = ŝ if R(ŝ) is True, else ∅
    
    Args:
        plate_text: cleaned plate text (uppercase, spaces allowed)
    
    Returns:
        tuple: (is_valid: bool, components: dict or None)
    """
    # Extract components
    components = extract_plate_components(plate_text)
    
    if not components:
        logger.warning(f"Plate '{plate_text}' does not match any format pattern")
        return False, None
    
    # Validate state code
    state_code = components['state_code']
    if state_code not in VALID_STATE_CODES:
        logger.warning(f"Invalid state code '{state_code}' in plate '{plate_text}'")
        return False, None
    
    logger.info(f"Plate '{plate_text}' is VALID ✓")
    logger.debug(f"  State: {state_code}, District: {components['district_code']}, "
                 f"Series: {components['series']}, Number: {components['number']}")
    
    return True, components


def determine_status(
    yolo_confidence: float,
    ocr_confidence: float,
    is_valid: bool
) -> str:
    """
    Determine detection status based on confidence thresholds and validation.
    
    Status logic (from requirements):
        - AUTO_DETECTED: YOLO conf > 0.5 AND OCR conf > 0.75 AND regex matches
        - MANUAL_REVIEW: YOLO conf > 0.5 BUT (OCR conf < 0.75 OR regex fails)
        - MANUAL_ENTRY: YOLO conf < 0.5 OR no plate detected
    
    Args:
        yolo_confidence: YOLO detection confidence (0.0-1.0)
        ocr_confidence: OCR confidence (0.0-1.0)
        is_valid: whether plate passed regex validation
    
    Returns:
        str: one of AUTO_DETECTED, MANUAL_REVIEW, MANUAL_ENTRY
    """
    if yolo_confidence < YOLO_CONFIDENCE_THRESHOLD:
        logger.debug(f"Status: MANUAL_ENTRY (YOLO conf {yolo_confidence:.3f} < {YOLO_CONFIDENCE_THRESHOLD})")
        return "MANUAL_ENTRY"
    
    if yolo_confidence >= YOLO_CONFIDENCE_THRESHOLD:
        if ocr_confidence >= OCR_CONFIDENCE_THRESHOLD and is_valid:
            logger.debug(f"Status: AUTO_DETECTED (all thresholds met)")
            return "AUTO_DETECTED"
        else:
            reason = []
            if ocr_confidence < OCR_CONFIDENCE_THRESHOLD:
                reason.append(f"OCR conf {ocr_confidence:.3f} < {OCR_CONFIDENCE_THRESHOLD}")
            if not is_valid:
                reason.append("validation failed")
            logger.debug(f"Status: MANUAL_REVIEW ({', '.join(reason)})")
            return "MANUAL_REVIEW"
    
    # Fallback
    logger.debug("Status: MANUAL_ENTRY (fallback)")
    return "MANUAL_ENTRY"


def validate_and_status(
    raw_ocr_text: str,
    yolo_confidence: float,
    ocr_confidence: float
) -> tuple[str, str, bool]:
    """
    Complete validation pipeline: clean → validate → determine status.
    
    Args:
        raw_ocr_text: raw OCR output
        yolo_confidence: YOLO confidence
        ocr_confidence: OCR confidence
    
    Returns:
        tuple: (cleaned_plate, status, is_valid)
    """
    # Step 1: Clean the text
    cleaned = clean_plate_text(raw_ocr_text)
    
    if not cleaned:
        logger.warning("Cleaned plate text is empty")
        return "", "MANUAL_ENTRY", False
    
    # Step 2: Validate format and state codes
    is_valid, components = validate_plate_format(cleaned)
    
    # Step 3: Determine status
    status = determine_status(yolo_confidence, ocr_confidence, is_valid)
    
    logger.info(f"Validation complete: '{raw_ocr_text}' → '{cleaned}' | Status: {status}")
    
    return cleaned, status, is_valid
