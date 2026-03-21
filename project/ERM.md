# AstroBookings Entity-Relationship Model

## Entities

### Rocket
Represents a spacecraft available for scheduling launches.

| Attribute  | Type         | Constraints                                      | Notes                       |
|------------|--------------|--------------------------------------------------|-----------------------------|
| `id`       | `string`     | PK, pattern: `rocket-{number}`, auto-generated   | Unique identifier           |
| `name`     | `string`     | Required, non-empty                              | Human-readable rocket name  |
| `range`    | `RocketRange`| Required, enum                                   | See RocketRange enum below  |
| `capacity` | `number`     | Required, integer, 1–10                          | Max seats per launch        |

**RocketRange enum**: `suborbital` | `orbital` | `moon` | `mars`

---

### Launch
Represents a scheduled flight for a specific rocket.

| Attribute          | Type     | Constraints                                        | Notes                                    |
|--------------------|----------|----------------------------------------------------|------------------------------------------|
| `id`               | `string` | PK, pattern: `launch-{number}`, auto-generated     | Unique identifier                        |
| `rocketId`         | `string` | FK → Rocket.id, Required                           | Must reference an existing rocket        |
| `launchDateTime`   | `string` | Required, ISO 8601, must be future date            | Scheduled departure datetime             |
| `price`            | `number` | Required, positive (> 0)                           | Price per seat in USD                    |
| `minPassengers`    | `number` | Required, integer, 1 ≤ value ≤ rocket.capacity     | Minimum passengers threshold             |
| `availableSeats`   | `number` | Derived, starts at rocket.capacity, decremented on booking | Remaining bookable seats    |

---

### Customer
Represents a traveler who can make bookings.

| Attribute | Type     | Constraints                                    | Notes                        |
|-----------|----------|------------------------------------------------|------------------------------|
| `email`   | `string` | PK, unique, valid email format                 | Natural key / identifier     |
| `name`    | `string` | Required, 2–100 characters                     | Full name of the customer    |
| `phone`   | `string` | Required, international phone format           | Contact phone number         |

---

### Booking
Represents a reservation of seats by a customer on a launch.

| Attribute       | Type     | Constraints                                          | Notes                                    |
|-----------------|----------|------------------------------------------------------|------------------------------------------|
| `id`            | `string` | PK, pattern: `booking-{number}`, auto-generated      | Unique identifier                        |
| `customerEmail` | `string` | FK → Customer.email, Required                        | Must reference an existing customer      |
| `launchId`      | `string` | FK → Launch.id, Required                             | Must reference an existing launch        |
| `seats`         | `number` | Required, integer, 1–10, ≤ launch.availableSeats     | Number of seats to reserve               |
| `totalPrice`    | `number` | Calculated: `seats × launch.price`                   | Set on creation/update, not user-provided|

---

## Relationships

```
Rocket ──< Launch : "is used for"
  One Rocket can have many Launches.
  Each Launch belongs to exactly one Rocket.
  Cardinality: Rocket 1 ──── * Launch

Customer ──< Booking : "makes"
  One Customer can have many Bookings.
  Each Booking belongs to exactly one Customer.
  Cardinality: Customer 1 ──── * Booking

Launch ──< Booking : "is reserved via"
  One Launch can have many Bookings.
  Each Booking is for exactly one Launch.
  Cardinality: Launch 1 ──── * Booking
```

### ER Diagram

```
┌──────────────┐         ┌──────────────────┐
│    Rocket    │         │     Launch       │
│──────────────│         │──────────────────│
│ id (PK)      │1      * │ id (PK)          │
│ name         ├─────────┤ rocketId (FK)    │
│ range        │         │ launchDateTime   │
│ capacity     │         │ price            │
└──────────────┘         │ minPassengers    │
                         │ availableSeats   │
                         └────────┬─────────┘
                                  │ 1
                                  │
                                  │ *
                         ┌────────┴─────────┐
                         │     Booking      │
                         │──────────────────│
                         │ id (PK)          │
┌──────────────┐         │ customerEmail(FK)│
│   Customer   │         │ launchId (FK)    │
│──────────────│1      * │ seats            │
│ email (PK)   ├─────────┤ totalPrice       │
│ name         │         └──────────────────┘
│ phone        │
└──────────────┘
```

---

## Business Rules

| Rule | Description |
|------|-------------|
| BR1  | `Launch.availableSeats` is initialized to `Rocket.capacity` on launch creation. |
| BR2  | On booking creation, `Launch.availableSeats` decreases by `Booking.seats`. |
| BR3  | On booking update, `Launch.availableSeats` adjusts by the seat difference (old − new). |
| BR4  | On booking deletion, `Launch.availableSeats` increases by `Booking.seats`. |
| BR5  | `Booking.totalPrice` = `Booking.seats × Launch.price`. |
| BR6  | A booking is only valid if `seats ≤ Launch.availableSeats`. |
| BR7  | `Launch.minPassengers` must be within 1..`Rocket.capacity`. |

---

## API DTO Interfaces

These TypeScript interfaces define the contracts for API clients.

### Rocket DTOs

```typescript
/** Enum for rocket travel range */
type RocketRange = 'suborbital' | 'orbital' | 'moon' | 'mars';

/** Full Rocket resource as returned by the API */
interface Rocket {
  id: string;
  name: string;
  range: RocketRange;
  capacity: number;
}

/** Payload to create a new Rocket */
interface CreateRocketRequest {
  name: string;           // Required, non-empty
  range: RocketRange;     // Required, must be valid enum value
  capacity: number;       // Required, integer 1–10
}

/** Payload to partially update a Rocket */
interface UpdateRocketRequest {
  name?: string;
  range?: RocketRange;
  capacity?: number;
}
```

### Launch DTOs

```typescript
/** Full Launch resource as returned by the API */
interface Launch {
  id: string;
  rocketId: string;
  launchDateTime: string; // ISO 8601 datetime string
  price: number;          // Price per seat (USD)
  minPassengers: number;  // Minimum passengers required
  availableSeats: number; // Remaining bookable seats (server-managed)
}

/** Payload to create a new Launch */
interface CreateLaunchRequest {
  rocketId: string;       // Required, must reference existing Rocket
  launchDateTime: string; // Required, ISO 8601, must be in the future
  price: number;          // Required, positive number
  minPassengers: number;  // Required, integer 1..rocket.capacity
}

/** Payload to partially update a Launch */
interface UpdateLaunchRequest {
  launchDateTime?: string;
  price?: number;
  minPassengers?: number;
  availableSeats?: number;
}
```

### Customer DTOs

```typescript
/** Full Customer resource as returned by the API */
interface Customer {
  email: string;  // PK — unique, valid email format
  name: string;   // 2–100 characters
  phone: string;  // International phone format
}

/** Payload to create a new Customer */
interface CreateCustomerRequest {
  email: string;  // Required, unique, valid email format
  name: string;   // Required, 2–100 characters
  phone: string;  // Required, international phone format
}

/** Payload to partially update a Customer */
interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
}
```

### Booking DTOs

```typescript
/** Full Booking resource as returned by the API */
interface Booking {
  id: string;
  customerEmail: string;  // References Customer.email
  launchId: string;       // References Launch.id
  seats: number;          // Integer 1–10
  totalPrice: number;     // Calculated: seats × launch.price
}

/** Payload to create a new Booking */
interface CreateBookingRequest {
  customerEmail: string;  // Required, must reference existing Customer
  launchId: string;       // Required, must reference existing Launch
  seats: number;          // Required, integer 1–10, ≤ launch.availableSeats
}

/** Payload to update an existing Booking */
interface UpdateBookingRequest {
  seats?: number;  // Updated seat count, re-validates against availability
}
```

### Shared DTOs

```typescript
/** Validation error item returned in 400 responses */
interface ValidationError {
  field: string;    // Name of the invalid field
  message: string;  // Human-readable description of the error
}

/** Standard error response body */
interface ErrorResponse {
  errors: ValidationError[];
}
```

### HTTP Status Code Reference

| Status | Meaning          | Used when                                                  |
|--------|------------------|------------------------------------------------------------|
| 200    | OK               | Successful GET or PUT                                      |
| 201    | Created          | Successful POST (resource created)                         |
| 204    | No Content       | Successful DELETE                                          |
| 400    | Bad Request      | Validation errors (returns `ErrorResponse` in body)        |
| 404    | Not Found        | Resource not found by ID/email                             |
