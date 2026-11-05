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

const authUrl = process.env.AUTH_URL ;
const JWKS = createRemoteJWKSet(new URL(`${authUrl}/api/auth/jwks`));

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized: Missing or invalid token", massage: "authorization" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const { payload } = await jwtVerify(token, JWKS)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized", massage: "authorization" })
  }
}


// Create studio
app.post("/studios",requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const senddata = await StudioSpaceData.insertOne(data);
    res.send({ success: true, result: senddata });
  } catch (error) {
    console.error("Error creating studio:", error);
    res.status(500).send({ message: "Failed to create studio", error });
  }
});

app.post("/bookings",requireAuth, async (req, res) => {
  try {
    const { title, bookingData, userData } = req.body;
    const { bookingDate, startTime, endTime } = bookingData;

    const overlappingBooking = await bookingsData.findOne({
      title: title,
      "bookingData.bookingDate": bookingDate,
      "bookingData.startTime": { $lt: endTime },
      "bookingData.endTime": { $gt: startTime }
    });


    if (overlappingBooking) {
      return res.status(400).send({
        success: false,
        message: "Time slot collision: This item is already booked during this time range on this date."
      });
    }


    const senddata = await bookingsData.insertOne(req.body);
    res.send({ success: true, result: senddata });

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).send({ message: "Failed to create booking", error: error.message });
  }
});


app.post("/studionspace",requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const senddata = await StudioSpaceData.insertOne(data);
    res.send({ success: true, result: senddata });
  } catch (error) {
    console.error("Error creating studio:", error);
    res.status(500).send({ message: "Failed to create studio", error });
  }
});

// Read all studios
app.get("/studios",requireAuth, async (req, res) => {
  try {
    const data = await StudioSpaceData.find({}).toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studios", error });
  }
});

app.get("/studios/:id",requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const data = await StudioSpaceData.findOne(query);
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studio", error });
  }
});

app.get("/category/:id",requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id)
    const query = { category:id };
    const data = await StudioSpaceData.find(query).toArray(); 
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studio", error });
  }
});

// limit 6 item
app.get("/featured",async(req,res)=>{
try{
  const limitData= await StudioSpaceData.find({}).limit(6).sort({hourlyRate:-1}).toArray()
  res.send(limitData)

}catch(error){
  res.status(500).send({ message: "Failed to fetch studios", error });
}
})

app.get("/bookings/:email",requireAuth, async (req, res) => {
  try {
    const email = req.params.email;
    const getData = await bookingsData.find({ userEmail: email }).toArray();
    res.send(getData);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send({ message: "Failed to fetch bookings", error });
  }
});



app.delete("/studios/:id",requireAuth, async (req, res) => {
  try {
  const id = req.params.id;
    const query = { _id: new ObjectId(id) };
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

app.patch("/studios/:id",requireAuth,async(req,res)=>{
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const update = { $set: req.body };
  const data = await StudioSpaceData.updateOne(query, update);
  if (data.matchedCount === 0) {
    return res.status(404).send({ message: "Studio not found" });
  }
  res.send({ success: true, result: data });
})

app.patch("/bookings/:id",requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
const query = ObjectId.isValid(id)
  ? { _id: new ObjectId(id) }
  : { userEmail: id };

    const updateData = req.body ;


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

// Route to test requireAuth
app.get("/test-auth", requireAuth, (req, res) => {
  res.send({ success: true, message: "Token is valid!", user: req.user });
});

app.get("/", (req, res) => {
  res.send("StudioSpace server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


export default app