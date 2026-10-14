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

/* ==========================================
   PROGRESS TRACKER API
   ========================================== */

// STEP 1: Get a student's overall progress
app.get("/api/progress/:userId", async (req, res) => {
  try {
    // Get the student ID from the URL
    const { userId } = req.params;

    // Count all tutorials and the tutorials completed by this student
    const [rows] = await db.execute(
      `
      SELECT
        COUNT(t.id) AS total_tutorials,
        COUNT(p.tutorial_id) AS completed_tutorials
      FROM tutorials t
      LEFT JOIN tutorial_progress p
        ON p.tutorial_id = t.id
        AND p.user_id = ?
        AND p.completed = TRUE
      `,
      [userId]
    );

    // Extract the result
    const total = Number(rows[0].total_tutorials);
    const completed = Number(rows[0].completed_tutorials);

    // Calculate the percentage of completed tutorials
    const percentage =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    // Send the progress data to the frontend
    res.json({
      success: true,
      data: {
        user_id: userId,
        total_tutorials: total,
        completed_tutorials: completed,
        remaining_tutorials: total - completed,
        progress_percentage: percentage
      }
    });
  } catch (error) {
    // Print the error in the backend terminal
    console.error(error);

    // Send an error response
    res.status(500).json({
      success: false,
      message: "Could not fetch student progress"
    });
  }
});


// STEP 2: Save or update tutorial progress
app.post("/api/progress", async (req, res) => {
  try {
    // Get the student ID, tutorial ID and completion status
    const { userId, tutorialId, completed } = req.body;

    // Validate the required fields
    if (
      typeof userId !== "string" ||
      !userId.trim() ||
      !Number.isInteger(tutorialId) ||
      tutorialId <= 0 ||
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid userId, tutorialId and completed are required"
      });
    }

    // Check whether the tutorial exists
    const [tutorials] = await db.execute(
      "SELECT id FROM tutorials WHERE id = ?",
      [tutorialId]
    );

    if (tutorials.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tutorial not found"
      });
    }

    // Insert a new progress record or update an existing one
    await db.execute(
      `
      INSERT INTO tutorial_progress
        (user_id, tutorial_id, completed, completed_at)
      VALUES
        (?, ?, ?, IF(? = 1, CURRENT_TIMESTAMP, NULL))
      ON DUPLICATE KEY UPDATE
        completed = VALUES(completed),
        completed_at = IF(
          VALUES(completed) = 1,
          COALESCE(completed_at, CURRENT_TIMESTAMP),
          NULL
        )
      `,
      [
        userId.trim(),
        tutorialId,
        completed,
        completed ? 1 : 0
      ]
    );

    // Send the success response
    res.status(200).json({
      success: true,
      message: "Tutorial progress saved successfully",
      data: {
        user_id: userId.trim(),
        tutorial_id: tutorialId,
        completed: completed
      }
    });
  } catch (error) {
    // Print the error in the backend terminal
    console.error(error);

    // Send an error response
    res.status(500).json({
      success: false,
      message: "Could not save tutorial progress"
    });
  }
});


// STEP 3: Get progress for a specific course
app.get(
  "/api/progress/:userId/course/:courseId",
  async (req, res) => {
    try {
      // Get student ID and course ID from the URL
      const { userId, courseId } = req.params;

      // Validate the course ID
      if (!/^[1-9]\d*$/.test(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID"
        });
      }

      // Count tutorials and completed tutorials in this course
      const [rows] = await db.execute(
        `
        SELECT
          c.id AS course_id,
          c.title AS course_title,
          COUNT(t.id) AS total_tutorials,
          COUNT(p.tutorial_id) AS completed_tutorials
        FROM courses c
        LEFT JOIN tutorials t
          ON t.course_id = c.id
        LEFT JOIN tutorial_progress p
          ON p.tutorial_id = t.id
          AND p.user_id = ?
          AND p.completed = TRUE
        WHERE c.id = ?
        GROUP BY c.id, c.title
        `,
        [userId, Number(courseId)]
      );

      // Check whether the course exists
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Calculate course progress
      const total = Number(rows[0].total_tutorials);
      const completed = Number(rows[0].completed_tutorials);

      const percentage =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      // Send course progress to the frontend
      res.json({
        success: true,
        data: {
          user_id: userId,
          course_id: Number(courseId),
          course_title: rows[0].course_title,
          total_tutorials: total,
          completed_tutorials: completed,
          remaining_tutorials: total - completed,
          progress_percentage: percentage
        }
      });
    } catch (error) {
      // Print the error in the backend terminal
      console.error(error);

      // Send an error response
      res.status(500).json({
        success: false,
        message: "Could not fetch course progress"
      });
    }
  }
);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TutorialHub API running at http://localhost:${PORT}`);
});