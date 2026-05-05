---
id: critical-path
title: Critical Path — End-to-End Flow
sidebar_label: Critical Path
sidebar_position: 2
---

# Q-Sync: Process Flow

This page describes the complete end-to-end lifecycle of a customer and a shipment inside Q-Sync, from the first ERP call that creates an account through to the customer confirming delivery at the drop-off point.

---

## Overview

```
ERP → Q-Sync          Customer onboards          Fleet registered
   ↓                        ↓                          ↓
Contract + Loading    Manager creates booking    Booking approved
Advice synced         (PENDING)                  (APPROVED)
                                                      ↓
                                              Driver checks in
                                              at factory gate
                                              (QUEUED)
                                                      ↓
                                        ERP: weight 1 → LOADING
                                        ERP: weight 2 → LOADED
                                                      ↓
                                              Driver exits gate
                                              (DEPARTED)
                                                      ↓
                                          Customer confirms delivery
                                              (DELIVERED)
```

---

## Phase 1 — Customer Provisioning (ERP → Q-Sync)

### 1.1 ERP creates the customer account

The ERP system calls the Q-Sync integration endpoint to register a new customer. Q-Sync creates both a `User` record (for authentication) and a `Customer` record (for business data) in a single atomic transaction.

**ERP → Q-Sync**

```
POST /api/integrations/users
```

**Q-Sync creates the new customer:**

:::info Token delivery
Q-Sync reads `User.preferredNotificationChannel` — either `EMAIL` or `WHATSAPP` — and dispatches the onboarding link accordingly.
:::

---

### 1.2 Customer completes onboarding

The customer receives a magic link; They click it to set a new password, and their account becomes active.

---

### 1.3 ERP syncs contracts and loading advices

After the customer account exists, the ERP pushes the commercial data that authorises the customer to load goods.

```
POST /api/integrations/contracts        → creates Contract
POST /api/integrations/loading-advices  → creates LoadingAdvice (linked to Contract)
POST /api/integrations/skus             → creates or updates SKU records
```

**Data relationships:**

```
Customer
  └── Contract  (title, value, startDate, endDate)
        └── LoadingAdvice  (tonnage, validFrom, validUntil)
              └── SKU[]  (itemNo, itemName — what product is being loaded)
```

`LoadingAdvice.status` starts as `OPEN`. The `bookedTonnage` field tracks how much of the advice has been consumed by approved bookings.

:::note ERP terminology
The IDs for `Contract , LoadingAdvice & SKU` should match the complementary ERP document IDs exactly to allow round-trip reconciliation.
:::

---

## Phase 2 — Fleet Registration (Customer)

![FLEET](/img/guides/qsync/qsync_fleet.png)

Before any booking can be made, the customer must register the trucks and drivers that will carry the load.

### 2.1 Add trucks

**UI path** `/customer/fleet/trucks`

![Add-Truck Screenshot](/img/guides/qsync/qsync_add_truck.png)

### 2.2 Add drivers

**UI path** `/customer/fleet/drivers`

Drivers are associated to one or many `Customer`s and can be assigned to any of the assigned customers' trucks at booking time.

![Add-Driver Screenshot](/img/guides/qsync/qsync_add_driver.png)

---

## Phase 3 — Booking Creation (Manager)

### 3.1 Manager creates a booking

The factory manager creates a `Booking` on behalf of the customer, selecting a `Customer`, then one of the selected customer's `LoadingAdvice`, a date, a time slot, and assigning one or more trucks.

**UI path** `/manager/bookings/new`

![Create-Booking Screenshot](/img/guides/qsync/qsync_create_booking_1.png)

The booking creation form is multipart and validates each selection depending on relations

![Add-Truck-to-Booking Screenshot](/img/guides/qsync/qsync_create_booking_2.png)

![Add-Driver-to-Booking Screenshot](/img/guides/qsync/qsync_create_booking_3.png)

**Validation at creation:**

- The selected `TimeSlot` must be active and cover the `scheduledDate` day of week
- The slot's `maxCapacity` must not be exceeded for that date
- Each truck's `allocatedTonnage` must not exceed `Truck.capacity`
- The sum of allocated tonnage must not exceed `LoadingAdvice.tonnage - LoadingAdvice.bookedTonnage`

**Records created:**

| Record | Key fields |
|--------|-----------|
| `Booking` | `referenceNumber` (auto-generated `BK-YYYYMMDD-XXXXX`), `status: PENDING`, `timeSlotStart`, `timeSlotEnd` |
| `BookingTruck` (one per truck) | `qrCode` (auto-generated, unique), `currentStatus: PENDING`, `skuId`, `sequenceNumber` |

:::info Time slot storage
`Booking.timeSlotStart` and `Booking.timeSlotEnd` store the slot times as plain strings (`"08:00"`, `"09:00"`). There is no foreign key to `TimeSlot` — the times are denormalised onto the booking record so historical bookings are not affected by future slot changes.
:::

`Booking.status` at this point: **`PENDING`**

---

### 3.2 Manager approves the booking

The manager reviews the booking, validates documents, and assigns a loading bay.

**UI path** `/manager/bookings/{id}`

![View-Booking Screenshot](/img/guides/qsync/qsync_booking_manager.png)

**On approval:**

- `Booking.status` → `APPROVED`
- `Booking.approvedById` + `Booking.approvedAt` set
- All `BookingTruck.currentStatus` → `APPROVED`
- QR codes sent to the customer via `Email` / `WhatsApp`
- `Notification` record created: type `BOOKING_APPROVED`

If the manager rejects instead:

- `Booking.status` → `REJECTED`
- `Booking.rejectionReason` stored
- `LoadingAdvice.bookedTonnage` is decremented (tonnage restored)
- Notification type: `BOOKING_REJECTED`

---

<!-- ## Phase 4 — Factory Entry (Security / QR Scan)

### 4.1 Driver checks in at the gate

When the truck arrives at the factory, the security guard scans the QR code on the driver's phone or printed slip. The QR code maps to a specific `BookingTruck` record.

**Two supported paths:**

| Path | Trigger |
|------|---------|
| QR scan | Guard uses mobile scanner; Q-Sync resolves `BookingTruck` by `qrCode` |
| Manual check-in | Guard looks up by `referenceNumber` or `registrationNumber` |

**On check-in:**

- `BookingTruck.currentStatus` → `QUEUED`
- `BookingTruck.checkedInAt` set
- `Queue` record created with `position`, `queueNumber`, `isPriority`
- `BookingTruck.queuePosition` and `BookingTruck.queueNumber` set
- `StatusHistory` record created: `APPROVED → QUEUED`
- Customer notified: type `TRUCK_CHECKED_IN`, message includes queue position
- `Booking.status` synced → `QUEUED` (aggregate across all trucks)

`BookingTruck.currentStatus` at this point: **`QUEUED`**

---

## Phase 5 — Weighbridge (ERP → Q-Sync)

The physical weighbridge scale sends weight readings directly to Q-Sync via the ERP integration. There are two passes — one before loading and one after.

### 5.1 Weight pass 1 — truck arrives at bay (gross weight in)

```
POST /api/integrations/weighbridge
{
  "booking_truck_id": "...",
  "weight": 18500,
  "pass": "in"
}
```

**On receipt:**

- `BookingTruck.weighbridgeIn` set
- `BookingTruck.currentStatus` → `LOADING`
- `BookingTruck.loadingStartedAt` set
- `Queue.grossWeight` set, `Queue.status` → `LOADING`
- `StatusHistory` record created: `QUEUED → LOADING`
- Notification: type `LOADING_STARTED`

`BookingTruck.currentStatus` at this point: **`LOADING`**

---

### 5.2 Weight pass 2 — truck leaves bay (gross weight out)

```
POST /api/integrations/weighbridge
{
  "booking_truck_id": "...",
  "weight": 24200,
  "pass": "out"
}
```

**On receipt:**

- `BookingTruck.weighbridgeOut` set
- `BookingTruck.actualTonnage` calculated: `weighbridgeOut − weighbridgeIn`
- `BookingTruck.currentStatus` → `LOADED`
- `BookingTruck.loadingCompletedAt` set
- `Queue.netWeight` set, `Queue.status` → `LOADED`
- `StatusHistory` record created: `LOADING → LOADED`
- Notification: type `LOADING_COMPLETED`

`BookingTruck.currentStatus` at this point: **`LOADED`**

:::tip Net weight
`actualTonnage = weighbridgeOut − weighbridgeIn`. This is the net weight of product loaded and is the value Q-Sync reports back to the ERP on departure.
:::

---

## Phase 6 — Factory Exit (Security)

### 6.1 Driver checks out at the gate

The security guard confirms the truck is leaving — either by scanning the QR code again or selecting the truck from the active queue on their device.

```
PATCH /api/bookings/trucks/:id/depart
```

**On departure:**

- `BookingTruck.currentStatus` → `DEPARTED`
- `BookingTruck.departedAt` set
- `Queue.exitedAt` set, `Queue.actualWaitTime` calculated
- `Queue.status` → `DEPARTED`
- `StatusHistory` record created: `LOADED → DEPARTED`
- Notification: type `TRUCK_DEPARTED`
- If **all** `BookingTruck` records for the booking are `DEPARTED` or `DELIVERED`:
  - `LoadingBay.status` → `AVAILABLE`
  - `LoadingBayHistory` record created: `OCCUPIED → AVAILABLE`
  - `Booking.status` → `DEPARTED`

`BookingTruck.currentStatus` at this point: **`DEPARTED`**

---

### 6.2 Q-Sync pushes data back to ERP

On departure, Q-Sync sends a webhook to the ERP with the completed `BookingTruck` data. This is the primary data flow **from Q-Sync back to the ERP**.

```
POST <ERP_WEBHOOK_URL>
```

```json
{
  "event": "booking_truck.departed",
  "booking_truck_id": "...",
  "queue_number": "Q-0042-...",
  "reference_number": "BK-20260422-AB3XY",
  "truck_registration": "DJ-1234-AB",
  "driver_name": "Mohamed Ali",
  "sku": {
    "item_no": "SKU-001",
    "item_name": "Cement Grade A"
  },
  "allocated_tonnage": 25.0,
  "actual_tonnage": 5.7,
  "weighbridge_in": 18500,
  "weighbridge_out": 24200,
  "loading_started_at": "2026-04-22T09:14:00Z",
  "loading_completed_at": "2026-04-22T10:02:00Z",
  "departed_at": "2026-04-22T10:18:00Z"
}
```

:::note ERP naming convention
The ERP refers to a `BookingTruck` simply as a **Booking**. Each truck dispatch is treated as an independent booking line in the ERP, identified by `queue_number` or the ERP's own document reference.
:::

---

## Phase 7 — Delivery Confirmation (Customer)

### 7.1 Customer confirms delivery

Once the truck arrives at the delivery destination, the customer (or driver) opens the Q-Sync app and marks the truck as delivered.

```
PATCH /api/bookings/trucks/:id/deliver
```

**On confirmation:**

- `BookingTruck.currentStatus` → `DELIVERED`
- `BookingTruck.deliveredAt` set
- `StatusHistory` record created: `DEPARTED → DELIVERED`
- Notification: type `DELIVERY_CONFIRMED`
- If **all** trucks are `DELIVERED`:
  - `Booking.status` → `DELIVERED`
  - `Booking.completedAt` set
  - `LoadingAdvice.bookedTonnage` updated with actual loaded tonnage

`BookingTruck.currentStatus` at this point: **`DELIVERED`**

---

## Status Reference

### `BookingTruck.currentStatus` lifecycle

```
PENDING → APPROVED → QUEUED → LOADING → LOADED → DEPARTED → DELIVERED
                        ↓         ↓        ↓         ↓
                    CANCELLED  CANCELLED CANCELLED CANCELLED
```

### `Booking.status` — aggregate

`Booking.status` is derived automatically from all its `BookingTruck` records after every truck-level transition:

| Condition | Booking status |
|-----------|---------------|
| All trucks `PENDING` | `PENDING` |
| All trucks `APPROVED` | `APPROVED` |
| Any truck `QUEUED` | `QUEUED` |
| Any truck `LOADING` | `LOADING` |
| Any truck `LOADED` | `LOADED` |
| All trucks `DEPARTED` or `DELIVERED` | `DEPARTED` |
| All trucks `DELIVERED` | `DELIVERED` |
| All trucks `CANCELLED` | `CANCELLED` |

### Cancellation rules

| Role | Cancellable when booking is |
|------|-----------------------------|
| `CUSTOMER` | `PENDING`, `APPROVED` |
| `FACTORY_MANAGER` | `PENDING`, `APPROVED`, `QUEUED` |
| `SYSTEM_ADMIN` | Any status |

---

## Data Flow Summary

```
ERP ──────────────────────────────────────────────────────► Q-Sync
  POST /users          (create customer)
  POST /contracts      (sync contract)
  POST /loading-advices (sync dispatch order)
  POST /skus           (sync product catalogue)
  POST /weighbridge    (pass 1: weight in  → LOADING)
  POST /weighbridge    (pass 2: weight out → LOADED)

Q-Sync ───────────────────────────────────────────────────► ERP
  Webhook: booking_truck.departed   (actual tonnage, net weight, timestamps)
  Webhook: booking_truck.delivered  (delivery confirmation)
```

---

## Key Schema Anchors

| Concept | Schema model | Notes |
|---------|-------------|-------|
| Customer account | `User` + `Customer` | `User.role = CUSTOMER` |
| Authentication token | `Token` (type `VERIFICATION`) | Consumed on password set |
| Dispatch order | `LoadingAdvice` | ERP document reference as `id` |
| Product | `SKU` | Linked to `BookingTruck.skuId` |
| Single truck dispatch | `BookingTruck` | ERP calls this a "booking" |
| Gate entry/exit | `Queue` | Tracks position, wait time, weights |
| Status audit trail | `StatusHistory` | Every `BookingTruck` transition logged |
| Bay lifecycle | `LoadingBayHistory` | Every bay status change logged | -->
