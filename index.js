import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const client = new MongoClient(process.env.MONGODB_URL)
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const database= await connectToMongoDB();

const bd= 



app.get("/", (req, res) => {
  res.send("StudioSpace server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});