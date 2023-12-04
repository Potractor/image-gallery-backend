// var Express = require("express");
// var Mongoclient = require("mongodb").MongoClient;
// var cors = require("cors");
// const multer = require("multer");

// var app = Express();
// app.use(cors());

// var CONNECTION_STRING =
//   "mongodb+srv://parameshkumar22:s7zlfp5N31BUy5D0@todoapp.lzt5uqf.mongodb.net/?retryWrites=true&w=majority";

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const CONNECTION_STRING =
  "mongodb+srv://parameshkumar22:s7zlfp5N31BUy5D0@todoapp.lzt5uqf.mongodb.net/?retryWrites=true&w=majority"; // Replace with your MongoDB connection string
const DATABASE_NAME = "todoappdb"; // Replace with your database name

let database;

MongoClient.connect(CONNECTION_STRING, (error, client) => {
  if (error) {
    console.error("Error connecting to MongoDB:", error);
    return;
  }
  database = client.db(DATABASE_NAME);
  console.log("MongoDB Connection Successful");
});

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage }).single("image");

// Endpoint for uploading images with tags
app.post("/api/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("Error uploading image:", err);
      res.status(500).json({ error: "Error uploading image" });
    } else {
      const { tags } = req.body;
      const imageUrl = req.file.path;

      database
        .collection("todoappcollection")
        .insertOne({ imageUrl, tags: tags.split(",") }, (error) => {
          if (error) {
            console.error("Error adding image to database:", error);
            res.status(500).json({ error: "Error adding image to database" });
          } else {
            res.json("Image uploaded successfully");
          }
        });
    }
  });
});

// Endpoint for searching images by tags
app.get("/api/search", async (req, res) => {
  try {
    const images = await database
      .collection("todoappcollection")
      .find({})
      .toArray();
    console.log("Fetched Images:", images); // Log fetched images
    res.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Error fetching images" });
  }
});

app.delete("/api/delete", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await database
      .collection("todoappcollection")
      .deleteOne({ _id: ObjectId(id) });
    if (result.deletedCount === 1) {
      res.json({ message: "Image deleted successfully" });
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Error deleting image" });
  }
});

const PORT = 5038;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
