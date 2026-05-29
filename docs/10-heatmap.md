# 10 — Heatmap

The heatmap at `/heatmap` visualizes when multiple people are simultaneously available, with timezone normalization so a viewer in one timezone sees everyone's slots in their own local time.

## Data model

Each `AvailabilitySlot` stores:
- `dayOfWeek` (0=Mon … 6=Sun)
- `startTime` / `endTime` as `"HH:MM"` wall-clock strings
- These times are in the **slot owner's** `User.timezone`

## Algorithm (`lib/heatmap.ts`)

1. Fetch all `AvailabilitySlot` rows for the selected scope (all users, org, team, or product).
2. For each slot, compute a weekly epoch offset in minutes from Monday 00:00 in the slot owner's timezone.
3. Convert that offset to the viewer's timezone (using `date-fns-tz`).
4. Emit one `HeatmapCell` per 30-minute bucket the slot covers in the viewer's timezone.
5. The UI renders a 7×48 grid (7 days × 48 half-hour slots). Each cell is colored by the count of overlapping people.

## Scope filtering

The scope picker (top of `/heatmap`) allows filtering to:
- All users (cross-org)
- Active organization
- A specific team
- A specific product

The API routes (`/api/slots`) support scoping via query parameters.

## Golden hours

Cells where 50%+ of the selected group are available are highlighted as "golden hours" — the best times to schedule a meeting.

## Click to schedule

From a golden-hours cell, clicking opens the appointment creation form pre-filled with that time slot (feature tracked in issue #9).
