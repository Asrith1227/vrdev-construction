const cloudinary = require("cloudinary").v2;
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const PORT = process.env.PORT || 3000;

/* =========================
   CREATE UPLOADS FOLDER
========================= */

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* =========================
   BODY LIMIT
========================= */

app.use(express.json({
  limit: "100mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "100mb"
}));

/* =========================
   STATIC FILES
========================= */

app.use(express.static(__dirname));

app.use("/uploads", express.static("uploads"));

/* =========================
   HOME PAGE
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
   MULTER STORAGE
========================= */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() +
      "-" +
      file.originalname.replace(/\s+/g, "-");

    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/* =========================
   IMAGE UPLOAD API
========================= */

app.post("/upload", upload.array("images"), async (req, res) => {

  try {

    const uploadedImages = [];

    for (const file of req.files) {

      const result = await cloudinary.uploader.upload(file.path);

      uploadedImages.push(result.secure_url);

      fs.unlinkSync(file.path);
    }

    res.json(uploadedImages);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Upload failed"
    });
  }
});

/* =========================
   DATA STORAGE
========================= */

const DATA_FILE = path.join(__dirname, "data.json");

/* =========================
   SAVE DATA
========================= */

app.post("/api/data", (req, res) => {

  try {

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(req.body, null, 2)
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Could not save data"
    });
  }
});

/* =========================
   GET DATA
========================= */

app.get("/api/data", (req, res) => {

  try {

    if (!fs.existsSync(DATA_FILE)) {

      return res.json({
        projects: [],
        offers: []
      });
    }

    const rawData = fs.readFileSync(DATA_FILE);

    const parsedData = JSON.parse(rawData);

    res.json(parsedData);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Could not load data"
    });
  }
});

/* =========================
   SERVER START
========================= */

app.listen(PORT, () => {

  console.log(
    `Server listening on http://localhost:${PORT}`
  );
});