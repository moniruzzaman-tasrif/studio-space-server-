import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

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



// Create studio
app.post("/studios", async (req, res) => {
  try {
    const data = req.body;
    const senddata = await StudioSpaceData.insertOne(data);
    res.send({ success: true, result: senddata });
  } catch (error) {
    console.error("Error creating studio:", error);
    res.status(500).send({ message: "Failed to create studio", error });
  }
});

app.post("/bookings", async (req, res) => {
  try {
    const data = req.body;
    const senddata = await bookingsData.insertOne(data);
    res.send({ success: true, result: senddata });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).send({ message: "Failed to create booking", error });
  }
});

// Also keep the old route alias so existing requests won't break
app.post("/studionspace", async (req, res) => {
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
app.get("/studios", async (req, res) => {
  try {
    const data = await StudioSpaceData.find({}).toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studios", error });
  }
});

app.get("/studios/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const data = await StudioSpaceData.findOne(query);
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studio", error });
  }
});




app.delete("/studios/:id", async (req, res) => {
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

app.patch("studios/:id",async(req,res)=>{
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const update = { $set: req.body };
  const data = await StudioSpaceData.updateOne(query, update);
  if (data.matchedCount === 0) {
    return res.status(404).send({ message: "Studio not found" });
  }
  res.send({ success: true, result: data });
})

app.get("/", (req, res) => {
  res.send("StudioSpace server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
