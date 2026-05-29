# 03 — Data Model

Schema: `prisma/schema.prisma`  
Migrations: `prisma/migrations/`

## Entity overview

```
User
 ├── Session[]            (Better Auth)
 ├── Account[]            (OAuth providers)
 ├── AvailabilitySlot[]
 ├── Member[]             (org memberships)
 ├── TeamMember[]
 ├── ProductMember[]
 ├── Invitation[]         (sent invitations)
 ├── JoinCode[]           (created join codes)
 ├── Appointment[]        (organized)
 └── AppointmentAttendee[]

Organization
 ├── Member[]
 ├── Invitation[]
 ├── Team[]
 ├── Product[]
 └── JoinCode[]

Team
 └── TeamMember[]

Product
 └── ProductMember[]

Appointment
 └── AppointmentAttendee[]
```

## Key tables

### AvailabilitySlot

| Column | Type | Notes |
|--------|------|-------|
| dayOfWeek | Int | 0=Mon … 6=Sun |
| startTime | String | `"HH:MM"` wall-clock in the owner's `User.timezone` |
| endTime | String | `"HH:MM"` wall-clock in the owner's `User.timezone` |
| label | String? | Optional display label |

Unique per `(userId, dayOfWeek, startTime, endTime)`.

### Member

| Column | Notes |
|--------|-------|
| role | `owner` / `admin` / `member` |
| teamId | Optional — which team the member was assigned at invite time |

### Invitation

| Column | Notes |
|--------|-------|
| status | `pending` (only state — accepted invitations convert to Member rows) |
| expiresAt | Set by Better Auth, typically 48 h from creation |

### JoinCode

| Column | Notes |
|--------|-------|
| code | Unique 8-char alphanumeric (no ambiguous chars) |
| teamId | If set, joiner is also added to this team |
| productId | If set, joiner is also added to this product |
| role | Role granted on join (`member` default) |
| expiresAt | `null` = never expires |
| maxUses | `null` = unlimited |
| uses | Incremented on each successful join |

### Appointment

| Column | Notes |
|--------|-------|
| startsAt / endsAt | Absolute UTC instants |
| timezone | Organizer's IANA zone — used for display formatting only |

### AppointmentAttendee

| Column | Notes |
|--------|-------|
| status | `pending` / `accepted` / `declined` |

## Cascade behavior

- Deleting a `User` cascades to their sessions, slots, organized appointments, sent invitations, and created join codes.
- Deleting an `Organization` cascades to members, invitations, teams, products, and join codes.
- Deleting a `Team` cascades to team members.
- Deleting a `Product` cascades to product members.
- Deleting an `Appointment` cascades to attendees.
