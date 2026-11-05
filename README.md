# 🎨 StudioSpace Server

Backend REST API for **StudioSpace** — a creative studio rental and booking platform connecting creators with photo studios, sound stages, podcast rooms, music suites, and art workshops.

---

## 🚀 Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) (Official MongoDB Node.js Driver)
- **Authentication:** [Jose](https://github.com/panva/jose) (JWT verification via Remote JWKS from Better Auth)
- **Utilities:** `cors`, `dotenv`
- **Deployment:** [Vercel](https://vercel.com/) (Serverless)

---

## 📋 Features

- **Studio Management (CRUD):**
  - Browse all creative spaces.
  - View individual studio details.
  - Filter studios by category.
  - Featured / latest studio listings.
  - Create, update, and delete listings (Protected).
- **Booking Management:**
  - Create bookings with **time slot collision detection** (prevents double bookings on the same date and overlapping time).
  - Retrieve user bookings by email.
  - Update booking status (confirm/cancel).
- **Authentication & Security:**
  - Token-based verification using Remote JWKS (`requireAuth` middleware).
  - Protected mutation routes for authenticated creators and hosts.
  - CORS configured for frontend integration.
  - Safe payload updates (stripping immutable `_id` to prevent database errors).

---

## 🛠️ Getting Started Locally

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and [npm](https://www.npmjs.com/) installed.

### 2. Clone and Install Dependencies
```bash
cd StudioSpace_Server
npm install
```

### 3. Start the Server
```bash
# Start server
npm start

# Or with nodemon (development)
npx nodemon index.js
```

The server will start on `http://localhost:5000`.

---

## 📡 API Endpoints

### 🌐 Public Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Server health check |
| `GET` | `/studios` | Get all studio listings |
| `GET` | `/studios/:id` | Get details of a single studio by ID |
| `GET` | `/category/:id` | Get studios filtered by category |
| `GET` | `/featured` | Get latest 6 featured studios |

---

### 🔒 Protected Endpoints (Requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/test-auth` | Verify JWT token authentication |
| `POST` | `/studios` | Add a new studio listing |
| `PATCH` | `/studios/:id` | Update studio details |
| `DELETE` | `/studios/:id` | Delete a studio listing |
| `POST` | `/bookings` | Create a new booking (with collision check) |
| `GET` | `/bookings/:email` | Get all bookings for a user by email |
| `PATCH` | `/bookings/:id` | Update a booking (e.g., status) |

---

## 🛡️ Authentication Middleware (`requireAuth`)

Private routes require a valid Bearer token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

The server validates tokens against the client's JWKS endpoint (`${AUTH_URL}/api/auth/jwks`). If the token is missing or invalid, the API returns:
```json
{
  "message": "Unauthorized: Missing or invalid token"
}
```

---

## ☁️ Deployment (Vercel)

The server includes [`vercel.json`](./vercel.json) configuration for seamless serverless deployment:

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables in the Vercel Project Settings:
   - `MONGODB_URL`: Your production MongoDB Atlas connection string.
   - `AUTH_URL`: Your production client URL (e.g., `https://your-client.vercel.app`).
4. Deploy!

---

## 📄 License


