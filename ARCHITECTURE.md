# Multi-Mall Parking Management System — Architecture

> **ParkIQ** is a multi-tenant, intelligent parking management platform that automates vehicle entry and exit using computer vision (YOLO + OCR), and gives every mall its own admin-controlled parking layout. The system is designed to be run by a central **Super Admin** who onboards malls, with each mall getting its own **Admin** who configures parking floors/slots, and **Officers** who manage the day-to-day ground-level operations.

---

## 1. High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│   Web Browser (React + Vite SPA)                             │
│   Camera Device (Entry Gate)                                 │
└───────────┬──────────────────────────────────────────────────┘
            │  HTTPS / REST API
┌───────────▼──────────────────────────────────────────────────┐
│               Spring Boot REST Backend                        │
│  (JWT-secured, Role-based, Domain-Driven Design)             │
│                                                              │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Auth & Security │  │  Parking Core  │  │ Mall Mgmt    │  │
│  │  JWT / BCrypt   │  │ Entry / Slots  │  │ Floors/Staff │  │
│  └─────────────────┘  └────────────────┘  └──────────────┘  │
│                                                              │
│             Slot Allocation Strategy Engine                  │
│         (FirstAvailable  |  SmartAllocation)                 │
└───────────┬──────────────────────────────────────────────────┘
            │  Spring Data JPA / Hibernate
┌───────────▼──────────────────────────────────────────────────┐
│                     MySQL Database                           │
│  malls, floors, parking_slots, vehicle_entries,              │
│  staff, mall_allocation_configs                              │
└──────────────────────────────────────────────────────────────┘

              External AI Pipeline (Entry Gate)
┌──────────────────────────────────────────────────────────────┐
│  Camera → YOLO (Number Plate Detection) → OCR Engine         │
│        → Extracted Plate Number → Backend /entries API       │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Vehicle Entry Flow (The Core User Journey)

This is the heart of the system — what happens every time a car arrives at a mall gate.

```
Car Arrives at Mall Entry Gate
        │
        ▼
┌───────────────────────┐
│  Entry-Gate Camera    │  Captures image of the vehicle
└──────────┬────────────┘
           │ Image (frame)
           ▼
┌───────────────────────┐
│  YOLO Model           │  Detects the number plate bounding box
│  (Number Plate        │  within the captured image
│   Detection)          │
└──────────┬────────────┘
           │ Cropped plate region
           ▼
┌───────────────────────┐
│  OCR Engine           │  Reads the text on the plate
│  (Text Extraction)    │  e.g.  "MH12 AB 1234"
└──────────┬────────────┘
           │ Plain-text plate number
           ▼
┌───────────────────────────────────────────────────────────┐
│  Backend  POST /api/entries                               │
│  { "vehicleNumber": "MH12AB1234", "mallId": 3 }           │
│                                                           │
│  VehicleEntryServiceImpl                                  │
│  ① Verify mall exists                                     │
│  ② Check vehicle is NOT already parked (no duplicates)    │
│  ③ Fetch all AVAILABLE slots (pessimistic DB lock)        │
│  ④ Select best slot via Allocation Strategy               │
│  ⑤ Mark slot as OCCUPIED                                  │
│  ⑥ Save VehicleEntry record (status=ACTIVE, timestamp)    │
│  ⑦ Return: slotNumber, floorName, entryTime               │
└──────────┬────────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────┐
│  Parking Ticket       │  Printed / displayed at gate:
│  Generated            │  • Vehicle Number
│                       │  • Assigned Slot  (e.g. B-204)
│                       │  • Floor Name     (e.g. Basement)
│                       │  • Entry Time
└───────────────────────┘
           │
           ▼
  Driver goes DIRECTLY to the assigned slot — no manual search!
```

### Manual Fallback (Officer Mode)
If the camera or AI pipeline is unavailable, an **Officer** can type the vehicle number directly into the Officer Dashboard web app — the backend allocation logic is exactly the same, just triggered manually.

---

## 3. Vehicle Exit Flow

```
Car Approaches Exit Gate
        │
        ▼
Officer searches vehicle number in web app
        │  GET /api/entries/mall/{mallId}/active
        ▼
System finds the active parking record
  • Shows: Slot, Floor, Entry Time, Duration
        │
        ▼
Officer clicks "Process Exit"
        │  POST /api/entries/{entryId}/exit
        ▼
VehicleEntryServiceImpl
  ① Sets VehicleEntry.status  →  CLOSED
  ② Sets VehicleEntry.exitTime  →  now()
  ③ Sets ParkingSlot.status   →  AVAILABLE
  ④ Slot is now free for the next car
        │
        ▼
Officer Dashboard shows: "Exit Processed ✅"
  (slot count auto-refreshes every 30 seconds)
```

---

## 4. Slot Allocation Strategy Engine

The backend uses a **Strategy Pattern** to decide which parking slot to assign. This is pluggable and configured per-mall.

```
SlotAllocationStrategy  (interface)
        │
        ├── FirstAvailableStrategy
        │     Picks the very first AVAILABLE slot found.
        │     Used when no special config exists for the mall.
        │
        └── SmartAllocationStrategy
              Reads MallAllocationConfig (set by Admin)
              and applies weighted/preference-based rules
              (e.g., prefer ground floor, fill top-down, etc.).
              Used when the Admin has configured an active config.
```

The `VehicleEntryServiceImpl` checks at runtime:
- If an **active** `MallAllocationConfig` exists → use **SmartAllocationStrategy**
- If not → fall back to **FirstAvailableStrategy**

---

## 5. Role-Based Access Control (3 Roles)

```
┌────────────────┬─────────────────────────────────────────────────────────┐
│ Role           │ Capabilities                                            │
├────────────────┼─────────────────────────────────────────────────────────┤
│ SUPER_ADMIN    │ • Register new malls in the platform                    │
│                │ • Activate / deactivate malls                           │
│                │ • Create ADMIN accounts for each mall                   │
│                │ • View all malls and their Admin staff (SA Dashboard)   │
├────────────────┼─────────────────────────────────────────────────────────┤
│ ADMIN          │ • Design their mall's parking layout (Floors + Slots)   │
│                │ • Add / manage Officer accounts for their mall          │
│                │ • Configure the Slot Allocation Strategy (Smart config) │
│                │ • Monitor live dashboard: active cars, slot occupancy   │
├────────────────┼─────────────────────────────────────────────────────────┤
│ OFFICER        │ • Register vehicle entry (manual input / gate camera)   │
│                │ • Search active vehicles and process their exit         │
│                │ • View live slot availability (auto-refresh every 30s)  │
│                │ • View list of all currently active entries             │
└────────────────┴─────────────────────────────────────────────────────────┘
```

All routes are JWT-protected. The `JwtAuthFilter` (extends `OncePerRequestFilter`) intercepts every request, validates the token via `JwtService`, and loads the user via `UserDetailsServiceImpl`. Role-level access is enforced by `SecurityConfig`.

---

## 6. Backend Architecture (Spring Boot)

The backend follows a **Domain-Driven Design (DDD)** package structure:

```
com.ashu.parking_backend/
│
├── config/
│   ├── DataSeeder.java           ← Seeds default SUPER_ADMIN on first startup
│   ├── OpenApiConfig.java        ← Swagger/OpenAPI documentation config
│   └── SecurityConfig.java       ← Spring Security + CORS + filter chain
│
├── common/
│   ├── enums/                    ← EntryStatus, SlotStatus, StaffRole
│   ├── exception/                ← BusinessException, ResourceNotFoundException
│   ├── response/                 ← Unified ApiResponse<T> wrapper
│   └── security/                 ← JwtService, JwtAuthFilter, UserDetailsServiceImpl
│
└── domain/                       ← Core business logic, split by domain
    ├── auth/                     ← AuthController, AuthService (login → JWT)
    ├── mall/                     ← Mall entity, MallController, MallService
    ├── floor/                    ← Floor entity, FloorController, FloorService
    ├── slot/                     ← ParkingSlot entity, ParkingSlotController, ParkingSlotService
    ├── staff/                    ← Staff entity, StaffController, StaffService
    ├── entry/                    ← VehicleEntry entity, VehicleEntryController, VehicleEntryService
    └── allocation/
        ├── config/               ← MallAllocationConfig, its service & repository
        └── strategy/             ← SlotAllocationStrategy interface + implementations
```

### Key Design Decisions
- **Pessimistic Locking** on slot fetch (`findAvailableSlotsByMallIdWithLock`) prevents two vehicles being assigned the same slot under concurrent load.
- **BaseEntity** provides common `id`, `createdAt`, `updatedAt` fields across all entities.
- **GlobalExceptionHandler** catches `BusinessException`, `ResourceNotFoundException`, validation errors, and bad credentials — returning consistent `ApiResponse` error envelopes.
- **DataSeeder** runs on startup (`ApplicationRunner`) and bootstraps the first `SUPER_ADMIN` account so the system is usable out of the box.

---

## 7. Frontend Architecture (React + Vite)

The frontend is a **React SPA** (Vite-bundled) with role-aware routing.

```
src/
├── App.jsx           ← Route definitions + ProtectedRoute guards
├── context/
│   └── AuthContext   ← Global auth state (token, role, mallId, username)
├── hooks/
│   ├── useAuth.js        ← Reads AuthContext (used across all pages)
│   └── useSlotPolling.js ← Polls /slots API every N seconds for live counts
├── api/
│   └── axios.js      ← Axios instance with base URL + JWT header injection
├── components/
│   └── layout/       ← DashboardLayout, Sidebar, Navbar, ProtectedRoute
└── pages/
    ├── login/         ← Login page (issues JWT, stores in context)
    ├── superadmin/    ← SADashboard, Malls, SAStaff
    ├── admin/         ← ADashboard, Floors, Slots, AdminStaff, AllocationConfig
    └── officer/       ← OfficerDashboard (entry+exit), ActiveEntries
```

### Routing & Auth Guard
Every protected route is wrapped in `<ProtectedRoute allowedRoles={[...]}>`. If the logged-in user's role does not match, they are redirected. Unauthenticated users are sent to `/login`.

---

## 8. Data Model (Entity Relationships)

```
SUPER_ADMIN
    │  creates
    ▼
  Mall ──────────────────────────────────────────────┐
    │  has many                                        │
    ▼                                                 │
  Floor (e.g. Ground, B1, B2)                        │
    │  has many                                        │
    ▼                                                 │
  ParkingSlot (status: AVAILABLE | OCCUPIED)          │
    │  assigned via                                    │
    ▼                                                 │
  VehicleEntry (vehicleNumber, entryTime,             │
                exitTime, status: ACTIVE|CLOSED) ─────┘
                
  Staff (SUPER_ADMIN | ADMIN | OFFICER)
    │  belongs to
    ▼
  Mall (nullable for SUPER_ADMIN)

  MallAllocationConfig
    │  belongs to
    ▼
  Mall (defines the Smart strategy params for a mall)
```

---

## 9. Technology Stack

| Layer | Technology |
|---|---|
| Backend Framework | Spring Boot 3.4.1 (Java 21) |
| Security | Spring Security + JWT (jjwt 0.12.6) |
| Database ORM | Spring Data JPA / Hibernate |
| Database | MySQL |
| Validation | Spring Validation (Bean Validation) |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Build Tool | Apache Maven |
| Frontend Framework | React 18 (Vite) |
| Frontend Routing | React Router DOM |
| HTTP Client | Axios |
| Styling | Vanilla CSS (CSS variables, dark theme) |
| AI / Vision | YOLO (plate detection) + OCR Engine |

---

## 10. Security Architecture

```
Request  →  JwtAuthFilter (OncePerRequestFilter)
                  │
                  ▼  Extract Bearer token
                JwtService.validateToken()
                  │
                  ▼  Load user
                UserDetailsServiceImpl (reads Staff from DB)
                  │
                  ▼  Set SecurityContext
                SecurityConfig.securityFilterChain()
                  │  Role-based method/route access
                  ▼
              Controller / Service layer
```

- Passwords are hashed with **BCryptPasswordEncoder**.
- CORS is configured via `SecurityConfig.corsConfigurationSource()` to allow requests from the React dev/prod origin.
- All public endpoints (only `/api/auth/login`) are permit-all; everything else requires a valid JWT.

---

## 11. Multi-Mall Tenancy Model

ParkIQ supports **multiple malls** on a single deployment. Each mall is logically isolated:

- A `Staff` member (Admin or Officer) is always associated with exactly one `Mall`.
- All queries for floors, slots, and vehicle entries are scoped by `mallId`.
- The `SUPER_ADMIN` is the only role with cross-mall visibility (sees all malls, can create admins for any mall).
- A mall can be **activated or deactivated** by the Super Admin without deleting data.

---

*Last updated: June 2026*
