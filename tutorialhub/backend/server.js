const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      success: true,
      message: "TutorialHub backend and MySQL are connected"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

// Get all courses
app.get("/api/courses", async (req, res) => {
  try {
    const [courses] = await db.query(
      "SELECT * FROM courses ORDER BY id"
    );

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Could not fetch courses"
    });
  }
});

// Get one course by ID
app.get("/api/courses/:id", async (req, res) => {
  try {
    const [courses] = await db.execute(
      "SELECT * FROM courses WHERE id = ?",
      [req.params.id]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({ success: true, data: courses[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Could not fetch course"
    });
  }
});

// Get all tutorials
app.get("/api/tutorials", async (req, res) => {
  try {
    const [tutorials] = await db.query(`
      SELECT
        t.id,
        t.title,
        t.description,
        t.category,
        t.content,
        t.course_id,
        c.title AS course_title
      FROM tutorials t
      LEFT JOIN courses c ON t.course_id = c.id
      ORDER BY t.id
    `);

    res.json({
      success: true,
      count: tutorials.length,
      data: tutorials
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Could not fetch tutorials"
    });
  }
});

// Get community statistics
app.get("/api/stats", async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        (SELECT members_count
         FROM community_stats
         ORDER BY id DESC LIMIT 1) AS members_count,
        (SELECT COUNT(*) FROM tutorials) AS tutorials_count,
        (SELECT COUNT(*) FROM courses) AS courses_count
    `);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Could not fetch statistics"
    });
  }
});

// Save a contact message
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO contact_messages (name, email, message)
       VALUES (?, ?, ?)`,
      [name.trim(), email.trim(), message.trim()]
    );

    res.status(201).json({
      success: true,
      message: "Contact message saved successfully",
      id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Could not save contact message"
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TutorialHub API running at http://localhost:${PORT}`);
});