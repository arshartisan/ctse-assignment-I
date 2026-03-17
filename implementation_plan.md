# StayLike — Microservices Implementation Plan

Build a full NestJS + gRPC + MongoDB Atlas microservices backend in `c:\Development\ctse\ass_I`.

## Architecture Overview

```
[Client] → HTTPS → [api-gateway (HTTP :3000)]
                         │ gRPC
       ┌─────────┬───────┼──────────┬─────────────┐
  [auth:50050] [user:50051] [rooms:50052] [booking:50053] [review:50054]
       │            │           │              │              │
       │(no DB)     └───MongoDB Atlas──────────┴──────────────┘
                   user-db   rooms-db    booking-db     review-db
```

## Proposed Changes

### Shared Proto Files
Proto contracts used by all services.

#### [NEW] common/protos/user.proto
gRPC contract for UserService (CreateUser, GetUserByEmail, GetUserById, ValidateUserRole)

#### [NEW] common/protos/auth.proto 
gRPC contract for AuthService (Register, Login, ValidateToken)

#### [NEW] common/protos/rooms.proto
gRPC contract for RoomsService (CreateListing, GetListing, SearchListings, CheckAvailability, BlockDates, UnblockDates)

#### [NEW] common/protos/booking.proto
gRPC contract for BookingService (CreateBooking, CancelBooking, GetBookingsByUser, ValidateBooking)

#### [NEW] common/protos/review.proto
gRPC contract for ReviewService (AddReview, GetReviewsByListing)

---

### user-service (gRPC :50051, DB: user-db)
Stores user profiles & credentials. Exposes gRPC only.

#### [NEW] user-service/package.json
Dependencies: `@nestjs/core`, `@nestjs/microservices`, `@nestjs/mongoose`, `@grpc/grpc-js`, `@grpc/proto-loader`, `mongoose`, `bcryptjs`

#### [NEW] user-service/tsconfig.json
Standard NestJS TypeScript config

#### [NEW] user-service/src/main.ts
Bootstrap gRPC microservice on port 50051

#### [NEW] user-service/src/app.module.ts
Root module importing MongooseModule (dbName: user-db) and UserModule

#### [NEW] user-service/src/modules/user/user.module.ts
Feature module registering User schema and providers

#### [NEW] user-service/src/modules/user/user.schema.ts
Mongoose schema: email, password (bcrypt), name, role, active

#### [NEW] user-service/src/modules/user/user.controller.ts
gRPC controller implementing `@GrpcMethod` handlers for UserService

#### [NEW] user-service/src/modules/user/user.service.ts
Business logic: create user, find by email/id, validate role

#### [NEW] user-service/Dockerfile
Multi-stage build: install → build → runtime

---

### auth-service (gRPC :50050, no DB)
Stateless JWT auth. Calls user-service via gRPC.

#### [NEW] auth-service/package.json
Dependencies: `@nestjs/core`, `@nestjs/microservices`, `@nestjs/jwt`, `@grpc/grpc-js`, `@grpc/proto-loader`, `bcryptjs`

#### [NEW] auth-service/tsconfig.json

#### [NEW] auth-service/src/main.ts
Bootstrap gRPC microservice on port 50050

#### [NEW] auth-service/src/app.module.ts
Root module importing AuthModule with gRPC client for user-service

#### [NEW] auth-service/src/modules/auth/auth.module.ts
Feature module with JwtModule and ClientsModule (gRPC to user-service)

#### [NEW] auth-service/src/modules/auth/auth.controller.ts
gRPC handlers: Register, Login, ValidateToken

#### [NEW] auth-service/src/modules/auth/auth.service.ts
Logic: hash password → call user-service CreateUser, verify password → sign JWT

#### [NEW] auth-service/Dockerfile

---

### rooms-service (gRPC :50052, DB: rooms-db)
Manages listings and availability.

#### [NEW] rooms-service/package.json

#### [NEW] rooms-service/tsconfig.json

#### [NEW] rooms-service/src/main.ts
Bootstrap gRPC microservice on port 50052

#### [NEW] rooms-service/src/app.module.ts
Root module with MongooseModule (dbName: rooms-db) and RoomsModule

#### [NEW] rooms-service/src/modules/rooms/rooms.module.ts

#### [NEW] rooms-service/src/modules/rooms/listing.schema.ts
Mongoose schema: title, city, hostId, description, price, images, active, blockedDates

#### [NEW] rooms-service/src/modules/rooms/rooms.controller.ts
gRPC handlers for all RoomsService methods

#### [NEW] rooms-service/src/modules/rooms/rooms.service.ts
Search, availability check, date blocking logic

#### [NEW] rooms-service/Dockerfile

---

### booking-service (gRPC :50053, DB: booking-db)
Orchestrates bookings. Calls user-service and rooms-service.

#### [NEW] booking-service/package.json

#### [NEW] booking-service/tsconfig.json

#### [NEW] booking-service/src/main.ts
Bootstrap gRPC microservice on port 50053

#### [NEW] booking-service/src/app.module.ts
Root module with MongooseModule (dbName: booking-db), BookingModule, gRPC clients

#### [NEW] booking-service/src/modules/booking/booking.module.ts
Feature module with ClientsModule (gRPC to user-service, rooms-service)

#### [NEW] booking-service/src/modules/booking/reservation.schema.ts
Mongoose schema: userId, listingId, hostId, checkIn, checkOut, status, totalPrice, guests

#### [NEW] booking-service/src/modules/booking/booking.controller.ts
gRPC handlers: CreateBooking, CancelBooking, GetBookingsByUser, ValidateBooking

#### [NEW] booking-service/src/modules/booking/booking.service.ts
Orchestration: validate user → check availability → block dates → save reservation

#### [NEW] booking-service/Dockerfile

---

### review-service (gRPC :50054, DB: review-db)
Stores reviews. Validates booking exists via booking-service.

#### [NEW] review-service/package.json

#### [NEW] review-service/tsconfig.json

#### [NEW] review-service/src/main.ts
Bootstrap gRPC microservice on port 50054

#### [NEW] review-service/src/app.module.ts
Root module with MongooseModule (dbName: review-db), ReviewModule

#### [NEW] review-service/src/modules/review/review.module.ts
Feature module with ClientsModule (gRPC to booking-service)

#### [NEW] review-service/src/modules/review/review.schema.ts
Mongoose schema: userId, listingId, bookingId, rating, comment

#### [NEW] review-service/src/modules/review/review.controller.ts
gRPC handlers: AddReview, GetReviewsByListing

#### [NEW] review-service/src/modules/review/review.service.ts
Business logic with booking validation

#### [NEW] review-service/Dockerfile

---

### api-gateway-service (HTTP :3000)
Public-facing REST API. Translates HTTP → gRPC to internal services.

#### [NEW] api-gateway/package.json
Dependencies include `@nestjs/core`, `@nestjs/microservices`, `@nestjs/passport`, `@nestjs/jwt`, all proto-related packages

#### [NEW] api-gateway/tsconfig.json

#### [NEW] api-gateway/src/main.ts
Bootstrap HTTP app on port 3000

#### [NEW] api-gateway/src/app.module.ts
Root module importing all controller modules and gRPC client registrations

#### [NEW] api-gateway/src/modules/auth/auth.controller.ts
REST: `POST /auth/register`, `POST /auth/login` → gRPC auth-service

#### [NEW] api-gateway/src/modules/auth/auth.module.ts

#### [NEW] api-gateway/src/modules/listings/listings.controller.ts
REST: `GET /listings`, `POST /listings`, `GET /listings/:id` → gRPC rooms-service

#### [NEW] api-gateway/src/modules/listings/listings.module.ts

#### [NEW] api-gateway/src/modules/bookings/bookings.controller.ts
REST: `POST /bookings`, `GET /bookings`, `DELETE /bookings/:id` → gRPC booking-service

#### [NEW] api-gateway/src/modules/bookings/bookings.module.ts

#### [NEW] api-gateway/src/modules/reviews/reviews.controller.ts
REST: `POST /reviews`, `GET /reviews/listing/:id` → gRPC review-service

#### [NEW] api-gateway/src/modules/reviews/reviews.module.ts

#### [NEW] api-gateway/src/common/guards/jwt-auth.guard.ts
JWT verification guard using auth-service ValidateToken

#### [NEW] api-gateway/src/modules/health/health.controller.ts
`GET /health` endpoint

#### [NEW] api-gateway/Dockerfile

---

### Docker Compose

#### [NEW] docker-compose.yml
All 6 services + MongoDB container, bridge network, environment variables for gRPC hostnames and ports

---

### CI/CD

#### [NEW] .github/workflows/deploy.yml
Template pipeline: checkout → build → test → SAST → Docker build/push → ECS deploy

---

## Verification Plan

### Automated Build Verification
```bash
# From project root (c:\Development\ctse\ass_I)
# Install dependencies for each service
cd user-service && npm install && npm run build && cd ..
cd auth-service && npm install && npm run build && cd ..
cd rooms-service && npm install && npm run build && cd ..
cd booking-service && npm install && npm run build && cd ..
cd review-service && npm install && npm run build && cd ..
cd api-gateway && npm install && npm run build && cd ..
```

### Docker Compose Verification
```bash
docker-compose build
docker-compose up -d
# All 6 services + mongo should start without errors
docker-compose ps
docker-compose logs --tail=20
```

### Manual E2E Flow (with curl or Postman)
1. **Register**: `POST http://localhost:3000/auth/register` with `{email, password, name, role}`
2. **Login**: `POST http://localhost:3000/auth/login` with `{email, password}` → get JWT
3. **Create Listing**: `POST http://localhost:3000/listings` with JWT header + listing data
4. **Search Listings**: `GET http://localhost:3000/listings?city=...`
5. **Create Booking**: `POST http://localhost:3000/bookings` with JWT + `{listingId, checkIn, checkOut, guests}`
6. **Add Review**: `POST http://localhost:3000/reviews` with JWT + `{listingId, bookingId, rating, comment}`
7. **Health Check**: `GET http://localhost:3000/health` → `{status: "ok"}`

> [!NOTE]
> Full E2E testing requires Docker running locally with MongoDB. Each individual service can be verified by building it independently (`npm run build`).
