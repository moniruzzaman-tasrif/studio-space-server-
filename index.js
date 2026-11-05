import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const database = await connectToMongoDB();
const db = database.db("StudioSpace");
const bookingsData = db.collection("booking");
const StudioSpaceData = db.collection("studios");

// JWKS for JWT authentication
const authUrl = process.env.AUTH_URL || "http://localhost:3000";
const JWKS = createRemoteJWKSet(new URL(`${authUrl}/api/auth/jwks`));

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized: Invalid or expired token", error: error.message });
  }
};

// ==================== STUDIOS ROUTES ====================

// Read all studios (Public)
app.get("/studios", async (req, res) => {
  try {
    const data = await StudioSpaceData.find({}).toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studios", error });
  }
});

// Single studio by ID (Public)
app.get("/studios/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    const data = await StudioSpaceData.findOne(query);
    if (!data) {
      return res.status(404).send({ message: "Studio not found" });
    }
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studio", error });
  }
});

// Studios by category (Public)
app.get("/category/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { category: id };
    const data = await StudioSpaceData.find(query).toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studio", error });
  }
});

// Featured 6 studios - sorted by newest (Public)
app.get("/featured", async (req, res) => {
  try {
    const limitData = await StudioSpaceData.find({})
      .sort({ _id: -1 })
      .limit(6)
      .toArray();
    res.send(limitData);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studios", error });
  }
});

// Create studio (Protected)
app.post("/studios", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const senddata = await StudioSpaceData.insertOne(data);
    res.send({ success: true, result: senddata });
  } catch (error) {
    console.error("Error creating studio:", error);
    res.status(500).send({ message: "Failed to create studio", error });
  }
});

// Legacy route alias (Protected)
app.post("/studionspace", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const senddata = await StudioSpaceData.insertOne(data);
    res.send({ success: true, result: senddata });
  } catch (error) {
    console.error("Error creating studio:", error);
    res.status(500).send({ message: "Failed to create studio", error });
  }
});

// Update studio by ID (Protected)
app.patch("/studios/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    // _id cannot be modified in MongoDB
    const updateData = { ...req.body };
    delete updateData._id;

    const data = await StudioSpaceData.updateOne(query, { $set: updateData });
    if (data.matchedCount === 0) {
      return res.status(404).send({ message: "Studio not found" });
    }
    res.send({ success: true, result: data });
  } catch (error) {
    console.error("Error updating studio:", error);
    res.status(500).send({ message: "Failed to update studio", error });
  }
});

// Delete studio by ID (Protected)
app.delete("/studios/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const data = await StudioSpaceData.deleteOne(query);
    console.log("Delete result:", data);
    if (data.deletedCount === 0) {
      return res.status(404).send({ message: "Studio not found" });
    }
    res.send(data);
  } catch (error) {
    console.error("Error deleting studio:", error);
    res.status(500).send({ message: "Failed to delete studio", error });
  }
});

// ==================== BOOKINGS ROUTES ====================

// Create booking (Protected)
app.post("/bookings", requireAuth, async (req, res) => {
  try {
    const { title, bookingData } = req.body;
    const { bookingDate, startTime, endTime } = bookingData || {};

    if (title && bookingDate && startTime && endTime) {
      const overlappingBooking = await bookingsData.findOne({
        title: title,
        "bookingData.bookingDate": bookingDate,
        "bookingData.startTime": { $lt: endTime },
        "bookingData.endTime": { $gt: startTime },
      });

      if (overlappingBooking) {
        return res.status(400).send({
          success: false,
          message: "Time slot collision: This item is already booked during this time range on this date.",
        });
      }
    }

    const senddata = await bookingsData.insertOne(req.body);
    res.send({ success: true, result: senddata });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).send({ message: "Failed to create booking", error: error.message });
  }
});

// Get user bookings by email (Protected)
app.get("/bookings/:email", requireAuth, async (req, res) => {
  try {
    const email = req.params.email;
    const query = {
      $or: [
        { userEmail: email },
        { email: email },
        { "userData.email": email },
      ],
    };
    const getData = await bookingsData.find(query).toArray();
    res.send(getData);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send({ message: "Failed to fetch bookings", error });
  }
});

// Update booking (Protected)
app.patch("/bookings/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { userEmail: id };

    // _id cannot be modified in MongoDB
    const updateData = { ...req.body };
    delete updateData._id;

    const update = { $set: updateData };
    const data = await bookingsData.updateOne(query, update);
    console.log("Update result:", data);

    if (data.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Booking not found" });
    }

    res.send({ success: true, result: data });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).send({ success: false, message: "Failed to update booking", error: error.message });
  }
});

// ==================== TEST & HEALTH ROUTES ====================

// Route to test requireAuth
app.get("/test-auth", requireAuth, (req, res) => {
  res.send({ success: true, message: "Token is valid!", user: req.user });
});

// Root health check (Public)
app.get("/", (req, res) => {
  res.send("StudioSpace server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
