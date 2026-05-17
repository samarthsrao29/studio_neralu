const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "assets", "img", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static assets from the current directory
app.use(express.static(__dirname));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `work-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Error: Only image files are allowed!"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const dbPath = path.join(__dirname, "data", "works.json");

// Helper function to read database
const readDatabase = () => {
  try {
    if (!fs.existsSync(dbPath)) {
      return [];
    }
    const data = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return [];
  }
};

// Helper function to write database
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
};

// API: Get all works
app.get("/api/works", (req, res) => {
  const works = readDatabase();
  res.json(works);
});

// API: Upload new work
app.post("/api/works", upload.single("image"), (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Please upload an image." });
    }

    const works = readDatabase();

    const newWork = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      image: `assets/img/uploads/${req.file.filename}`,
    };

    works.unshift(newWork); // Add new work to the top (newest first)
    writeDatabase(works);

    res.status(201).json({ success: true, work: newWork });
  } catch (error) {
    console.error("Error saving work:", error);
    res.status(500).json({ error: "Failed to upload work." });
  }
});

// API: Edit an existing work
app.put("/api/works/:id", upload.single("image"), (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    let works = readDatabase();
    const workIndex = works.findIndex((w) => w.id === id);

    if (workIndex === -1) {
      return res.status(404).json({ error: "Work not found." });
    }

    const currentWork = works[workIndex];
    let imagePath = currentWork.image;

    // If a new image was uploaded
    if (req.file) {
      // Delete the old file from assets/img/uploads/ to save disk space
      if (currentWork.image.startsWith("assets/img/uploads/")) {
        const oldFilePath = path.join(__dirname, currentWork.image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      imagePath = `assets/img/uploads/${req.file.filename}`;
    }

    const updatedWork = {
      ...currentWork,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      image: imagePath,
    };

    works[workIndex] = updatedWork;
    writeDatabase(works);

    res.json({ success: true, work: updatedWork });
  } catch (error) {
    console.error("Error editing work:", error);
    res.status(500).json({ error: "Failed to update project." });
  }
});

// API: Delete a work
app.delete("/api/works/:id", (req, res) => {
  try {
    const { id } = req.params;
    let works = readDatabase();
    const workToDelete = works.find((w) => w.id === id);

    if (!workToDelete) {
      return res.status(404).json({ error: "Work not found." });
    }

    // If it's an uploaded image, delete the actual file from disk to save space
    if (workToDelete.image.startsWith("assets/img/uploads/")) {
      const filePath = path.join(__dirname, workToDelete.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    works = works.filter((w) => w.id !== id);
    writeDatabase(works);

    res.json({ success: true, message: "Work deleted successfully." });
  } catch (error) {
    console.error("Error deleting work:", error);
    res.status(500).json({ error: "Failed to delete work." });
  }
});

// Serve Admin Dashboard page explicitly (optional shortcut)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Fallback error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  res.status(500).json({ error: err.message || "An unexpected error occurred." });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` STUDIO NERALU — Server running on port ${PORT}`);
  console.log(` User Webpage:   http://localhost:${PORT}/`);
  console.log(` Admin Panel:    http://localhost:${PORT}/admin.html`);
  console.log(`==================================================`);
});
