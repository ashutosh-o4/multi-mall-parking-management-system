"""
HTTP client to communicate with the Spring Boot parking backend.

Calls the existing VehicleEntryController endpoint:
    POST /entries  →  {"vehicleNumber": "KA 01 AB 1234", "mallId": 1}

This triggers VehicleEntryServiceImpl.createEntry() which:
    1. Checks if vehicle is already parked (prevents duplicates)
    2. Finds available slots with pessimistic locking
    3. Uses smart or first-available allocation strategy
    4. Creates VehicleEntry and returns slot assignment
"""
import requests
import logging
from app.config import BACKEND_URL, MALL_ID, AUTH_TOKEN

logger = logging.getLogger(__name__)


def register_vehicle_entry(vehicle_number: str, mall_id: int = None) -> dict:
    """
    POST to Spring Boot backend to register a vehicle entry.

    Endpoint: POST {BACKEND_URL}/entries
    Body:     {"vehicleNumber": "<plate_text>", "mallId": <id>}

    The backend responds with:
        {
            "success": true,
            "message": "Vehicle entry registered successfully",
            "data": {
                "id": 1,
                "vehicleNumber": "KA 01 AB 1234",
                "slotId": 5,
                "slotNumber": "A-05",
                "floorName": "Ground Floor",
                "entryTime": "2025-10-01T10:30:00",
                "exitTime": null,
                "status": "ACTIVE"
            }
        }

    Args:
        vehicle_number: validated plate text (e.g., "KA 01 AB 1234")
        mall_id: target mall ID (defaults to config MALL_ID)

    Returns:
        dict: backend response data, or error dict on failure
    """
    url = f"{BACKEND_URL}/entries"
    payload = {
        "vehicleNumber": vehicle_number,
        "mallId": mall_id or MALL_ID
    }
    headers = {
        "Content-Type": "application/json"
    }

    # Add JWT auth token if configured
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()

        slot_info = data.get("data", {})
        logger.info(
            f"Entry registered: {vehicle_number} → "
            f"Slot {slot_info.get('slotNumber', 'N/A')} "
            f"on {slot_info.get('floorName', 'N/A')}"
        )
        return data

    except requests.exceptions.HTTPError as e:
        # Backend returns 4xx/5xx — could be duplicate vehicle, no slots, etc.
        error_body = {}
        try:
            error_body = e.response.json()
        except Exception:
            pass

        error_msg = error_body.get("message", str(e))
        logger.warning(f"Backend rejected entry for {vehicle_number}: {error_msg}")
        return {"error": error_msg, "status_code": e.response.status_code}

    except requests.exceptions.ConnectionError:
        logger.error(f"Cannot connect to backend at {BACKEND_URL}")
        return {"error": f"Backend unreachable at {BACKEND_URL}"}

    except requests.exceptions.Timeout:
        logger.error(f"Backend request timed out for {vehicle_number}")
        return {"error": "Backend request timed out"}

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to register entry for {vehicle_number}: {e}")
        return {"error": str(e)}


def process_vehicle_exit(vehicle_number: str, mall_id: int = None) -> dict:
    """
    Look up an active entry by vehicle number and process its exit.

    This first queries GET /entries/mall/{mallId}/active, finds the matching
    entry, then calls POST /entries/{entryId}/exit.

    Args:
        vehicle_number: the plate text to look up
        mall_id: mall to search in

    Returns:
        dict: exit response or error
    """
    target_mall = mall_id or MALL_ID
    headers = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"

    try:
        # Step 1: Get active entries for the mall
        list_url = f"{BACKEND_URL}/entries/mall/{target_mall}/active"
        response = requests.get(list_url, headers=headers, timeout=5)
        response.raise_for_status()
        entries = response.json().get("data", [])

        # Step 2: Find matching entry by vehicle number
        matching = [e for e in entries if e.get("vehicleNumber") == vehicle_number]
        if not matching:
            return {"error": f"No active entry found for {vehicle_number}"}

        entry_id = matching[0]["id"]

        # Step 3: Process exit
        exit_url = f"{BACKEND_URL}/entries/{entry_id}/exit"
        exit_response = requests.post(exit_url, headers=headers, timeout=5)
        exit_response.raise_for_status()

        logger.info(f"Exit processed for {vehicle_number} (entry ID: {entry_id})")
        return exit_response.json()

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to process exit for {vehicle_number}: {e}")
        return {"error": str(e)}
