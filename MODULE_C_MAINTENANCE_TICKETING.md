# Module C – Maintenance & Incident Ticketing

## 1. Overview

The Maintenance & Incident Ticketing system allows campus users to report maintenance issues, track their resolution, and manage technician workloads. It is built on a role-based access model ensuring each user type interacts only with what is relevant to them.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4, Java 25, Spring Security, JPA / Hibernate |
| Database | PostgreSQL |
| Frontend | React 19, TypeScript, Tailwind CSS, Zustand |
| File Storage | Local disk (`./uploads/tickets/`) |
| Auth | JWT (Bearer token) |

---

## 3. Roles & Permissions

| Action | Student | Lecturer | Technical Staff | Admin |
|---|:---:|:---:|:---:|:---:|
| Create ticket | ✓ | ✓ | ✓ | ✓ |
| View own tickets | ✓ | ✓ | ✓ | ✓ |
| View all tickets | ✗ | ✓ | ✓ | ✓ |
| Update ticket status | ✗ | ✗ | ✓ | ✓ |
| Reject ticket (with reason) | ✗ | ✗ | ✗ | ✓ |
| Close ticket | ✗ | ✗ | ✗ | ✓ |
| Assign technician | ✗ | ✗ | ✗ | ✓ |
| Delete ticket | ✗ | ✗ | ✗ | ✓ |
| Upload images | Own only | ✓ | ✓ | ✓ |
| Delete images | Own only | ✓ | ✓ | ✓ |
| Add comment | Own only | ✓ | ✓ | ✓ |
| Edit comment | Own only | Own only | Own only | Own only |
| Delete comment | Own only | Own only | Own only | ✓ (any) |

---

## 4. Ticket Status Lifecycle

```
                  ┌─────────────────────────────────┐
                  │                                 ▼
OPEN  ──►  IN_PROGRESS  ──►  RESOLVED  ──►  CLOSED (Admin only)
                                        └──►  REJECTED (Admin only, reason required)
```

### Status Transition Rules

| From | To | Allowed Roles | Conditions |
|---|---|---|---|
| OPEN | IN_PROGRESS | Technical Staff, Admin | — |
| IN_PROGRESS | RESOLVED | Technical Staff, Admin | — |
| RESOLVED | CLOSED | Admin only | Must be RESOLVED first |
| Any | REJECTED | Admin only | Rejection reason required |

> **Note:** Status can only move forward. Backwards transitions are not allowed.

---

## 5. Ticket Data Model

### Ticket Fields

| Field | Type | Required | Description |
|---|---|:---:|---|
| title | String | ✓ | Short summary of the issue |
| location | String | ✓ | Where the problem is on campus |
| category | Enum | ✓ | Type of maintenance issue |
| description | Text | ✓ | Full details of the issue |
| priority | Enum | ✓ | Urgency level |
| status | Enum | auto | Current ticket status (default: OPEN) |
| preferredContactEmail | String | ✗ | Optional contact email |
| preferredContactPhone | String | ✗ | Optional contact phone |
| rejectionReason | Text | ✗ | Required when status = REJECTED |
| resolutionNotes | Text | ✗ | Added when resolving |
| createdBy | User | auto | Reporter |
| assignedTo | User | ✗ | Assigned technician |
| assignedAt | DateTime | auto | When technician was assigned |
| images | List | ✗ | Up to 3 image attachments |
| comments | List | ✗ | Thread of comments |
| createdAt | DateTime | auto | Creation timestamp |
| updatedAt | DateTime | auto | Last update timestamp |

### Category Values

`ELECTRICAL` · `PLUMBING` · `IT_EQUIPMENT` · `FURNITURE` · `HVAC` · `SAFETY` · `CLEANING` · `OTHER`

### Priority Values

`LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

---

## 6. Technician Assignment Rules

- Only **Admin** can assign tickets to technicians.
- The assignment dropdown shows **only TECHNICAL_STAFF** users.
- Each technician displays:
  - **Daily count** — how many tickets assigned to them today (X/5)
  - **Active count** — tickets currently OPEN or IN_PROGRESS
- **Daily limit: 5 tickets per technician per day.**
  - Enforced on the backend — throws an error if the limit is exceeded.
  - Enforced on the frontend — the option is disabled and the Assign button is blocked.
- `assignedAt` is recorded on every assignment to accurately calculate the daily count.

---

## 7. Image Attachments

- Maximum **3 images per ticket**.
- Supported at ticket creation and after creation.
- Images are stored on disk at `./uploads/tickets/{ticketId}/`.
- Images are served via **authenticated API endpoints** — direct URL access is not possible.
- The frontend fetches images via axios with the JWT token and renders them as blob URLs.
- The `uploads/` folder is excluded from version control via `.gitignore`.

---

## 8. API Reference

### Ticket Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/tickets` | Authenticated | Create a new ticket |
| `GET` | `/api/tickets` | Authenticated | Get tickets (own or all, by role) |
| `GET` | `/api/tickets/{id}` | Owner / Staff / Admin | Get a single ticket |
| `PATCH` | `/api/tickets/{id}/status` | Technical Staff, Admin | Update ticket status |
| `PATCH` | `/api/tickets/{id}/assign` | Admin only | Assign a technician |
| `DELETE` | `/api/tickets/{id}` | Admin only | Delete a ticket |

### Image Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/tickets/{id}/images` | Owner / Staff / Admin | Upload an image (multipart/form-data) |
| `GET` | `/api/tickets/images/{imageId}` | Authenticated | Download an image |
| `DELETE` | `/api/tickets/{id}/images/{imageId}` | Owner / Staff / Admin | Delete an image |

### Comment Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/tickets/{id}/comments` | Owner / Staff / Admin | Add a comment |
| `PUT` | `/api/tickets/{id}/comments/{commentId}` | Author only | Edit own comment |
| `DELETE` | `/api/tickets/{id}/comments/{commentId}` | Author / Admin | Delete a comment |

---

## 9. Request & Response Examples

### Create Ticket — `POST /api/tickets`

**Request Body:**
```json
{
  "title": "Broken AC in Lab 102",
  "location": "Building A, Room 102",
  "category": "HVAC",
  "description": "The air conditioning unit has stopped working completely.",
  "priority": "HIGH",
  "preferredContactEmail": "student@campus.edu",
  "preferredContactPhone": "0771234567"
}
```

**Response `201 Created`:**
```json
{
  "id": 5,
  "title": "Broken AC in Lab 102",
  "location": "Building A, Room 102",
  "category": "HVAC",
  "description": "The air conditioning unit has stopped working completely.",
  "priority": "HIGH",
  "status": "OPEN",
  "createdById": 12,
  "createdByName": "John Silva",
  "assignedToId": null,
  "assignedToName": null,
  "imageIds": [],
  "comments": [],
  "createdAt": "2026-04-19T10:30:00",
  "updatedAt": "2026-04-19T10:30:00",
  "assignedAt": null
}
```

### Update Status — `PATCH /api/tickets/{id}/status`

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "resolutionNotes": "Technician dispatched to inspect the unit."
}
```

### Reject Ticket — `PATCH /api/tickets/{id}/status`

**Request Body:**
```json
{
  "status": "REJECTED",
  "rejectionReason": "This issue falls outside campus maintenance scope."
}
```

### Assign Technician — `PATCH /api/tickets/{id}/assign`

**Request Body:**
```json
{
  "assignedToId": 8
}
```

---

## 10. Frontend Pages

### My Tickets Page (`/maintenance/tickets`)

Accessible by: **Student, Lecturer, Technical Staff**

| Role | Behaviour |
|---|---|
| Student | Sees only their own tickets. Can create, view, upload images, and comment on own tickets. |
| Lecturer | Sees all tickets. Can comment. Cannot update status. |
| Technical Staff | Sees all tickets. Can update status (OPEN → IN_PROGRESS → RESOLVED). Can upload/delete images and comment on any ticket. |

**Features:**
- Status filter tabs (ALL / OPEN / IN_PROGRESS / RESOLVED / CLOSED / REJECTED)
- Create ticket modal with image attachment support (up to 3)
- Ticket detail panel with comments thread and image gallery

---

### Incidents Page (`/admin/incidents`)

Accessible by: **Admin only**

**Features:**
- Summary stats cards — Total / Open / In Progress / Resolved
- Status filter tabs
- Full ticket table with Assigned Technician column
- Create ticket modal with attachments
- Ticket detail panel with:
  - Full status management (including REJECT and CLOSE)
  - Technician assignment dropdown (TECHNICAL_STAFF only, with daily workload display)
  - Image upload and delete
  - Comments with admin delete rights
- Delete ticket with confirmation dialog

---

## 11. Backend File Structure

```
src/main/java/com/smartcampus/api/
├── model/
│   ├── Ticket.java
│   ├── TicketStatus.java
│   ├── TicketPriority.java
│   ├── TicketCategory.java
│   ├── TicketImage.java
│   └── TicketComment.java
├── dto/
│   ├── TicketRequestDTO.java
│   ├── TicketResponseDTO.java
│   ├── TicketStatusUpdateDTO.java
│   ├── TicketAssignDTO.java
│   ├── TicketCommentRequestDTO.java
│   └── TicketCommentResponseDTO.java
├── repository/
│   ├── TicketRepository.java
│   ├── TicketImageRepository.java
│   └── TicketCommentRepository.java
├── service/
│   └── TicketService.java
├── controller/
│   └── TicketController.java
└── exception/
    └── TicketNotFoundException.java
```

---

## 12. Frontend File Structure

```
src/
├── services/
│   └── ticketService.ts
└── features/
    ├── maintenance/
    │   └── pages/
    │       └── MyTicketsPage.tsx
    └── admin/
        └── pages/
            └── IncidentsPage.tsx
```

---

## 13. Environment Configuration

Add the following to `application.yml` (backend):

```yaml
app:
  upload:
    tickets-dir: ./uploads/tickets
```

The `uploads/` directory is created automatically on first image upload. It is excluded from git via `.gitignore`.

---

*Module C — Smart Campus Application | Academic Year 2025/2026*
