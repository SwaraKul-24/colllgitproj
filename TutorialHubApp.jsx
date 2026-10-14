/**
 * TutorialHubApp.jsx  (final version, built against your real backend)
 * ---------------------------------------------------------------------------
 * Connects the TutorialHub homepage to your Express + MySQL API:
 *
 *   GET  /api/health        -> server status badge in the footer
 *   GET  /api/stats         -> member / tutorial / course counts
 *   GET  /api/courses       -> course grid with search + category + difficulty filters
 *   GET  /api/tutorials     -> tutorial list, filterable by course, expandable content
 *   POST /api/contact       -> validated contact form
 *
 * Setup
 *  1. Keep Bootstrap 5 CSS + JS and Bootstrap Icons in public/index.html
 *     (same CDN links as your homepage.html).
 *  2. Optional .env in the React project (defaults to http://localhost:5000/api):
 *       Vite: VITE_API_URL=http://localhost:5000/api
 *       CRA:  REACT_APP_API_URL=http://localhost:5000/api
 *  3. Start the backend (npm start) and render:
 *       import TutorialHubApp from "./TutorialHubApp";
 *       <TutorialHubApp />
 *
 * Your backend already has cors() enabled, so no proxy is needed.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ========================================================================== */
/* API                                                                        */
/* ========================================================================== */

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:5000/api";

/** Calls the backend and unwraps its { success, data, message } envelope. */
async function api(path, { method = "GET", body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error("Can't reach the server. Make sure the backend is running.");
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return json;
}

/** Fetch on mount with loading / error / retry and automatic cancellation. */
function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: controller.signal })
      .then((json) => setState({ data: json.data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [path, attempt]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
}

/* ========================================================================== */
/* SMALL HELPERS                                                              */
/* ========================================================================== */

const scrollToId = (id) => {
  if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
  else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const DIFFICULTY_STYLE = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
};

const Spinner = ({ small }) => (
  <span className={`spinner-border ${small ? "spinner-border-sm" : ""}`} role="status" aria-label="Loading" />
);

const ErrorBox = ({ error, onRetry }) => (
  <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
    <span>{error.message}</span>
    {onRetry && (
      <button className="btn btn-sm btn-outline-danger ms-3" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 4500);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 2000 }}>
      <div
        role="status"
        className={`toast show align-items-center border-0 text-bg-${toast.type === "error" ? "danger" : "success"}`}
      >
        <div className="d-flex">
          <div className="toast-body">{toast.message}</div>
          <button className="btn-close btn-close-white me-2 m-auto" aria-label="Dismiss" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* NAVBAR + HERO                                                              */
/* ========================================================================== */

function Navbar() {
  const links = [
    ["Home", "top"],
    ["Courses", "courses"],
    ["Tutorials", "tutorials"],
    ["About", "features"],
    ["Contact", "contact"],
  ];

  // Collapse the mobile menu after choosing a link
  const go = (e, id) => {
    e.preventDefault();
    const menu = document.getElementById("navbarNav");
    if (menu?.classList.contains("show")) menu.classList.remove("show");
    scrollToId(id);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container">
        <a className="navbar-brand" href="#top" onClick={(e) => go(e, "top")}>
          TutorialHub
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {links.map(([label, id]) => (
              <li className="nav-item" key={id}>
                <a className="nav-link" href={`#${id}`} onClick={(e) => go(e, id)}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ background: "#f8f9fa", padding: "60px 20px", textAlign: "center" }}>
      <div className="container">
        <h1 style={{ fontSize: "3rem", fontWeight: "bold" }}>Welcome to Student Learning Hub</h1>
        <p style={{ fontSize: "1.2rem", color: "#555" }}>
          Learn coding, design, and more with step-by-step tutorials.
        </p>
        <button className="btn btn-primary btn-lg mt-3" onClick={() => scrollToId("courses")}>
          Get Started
        </button>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* FEATURES + LIVE STATS                                                      */
/* ========================================================================== */

function Features() {
  const { data: stats, loading, error } = useApi("/stats");
  const fmt = (n) => Number(n ?? 0).toLocaleString();

  const items = [
    {
      icon: "bi-laptop",
      color: "primary",
      title: "Easy Tutorials",
      text: "Step-by-step guides for beginners and pros.",
      stat: stats && `${fmt(stats.tutorials_count)} tutorials`,
    },
    {
      icon: "bi-people",
      color: "success",
      title: "Community Support",
      text: "Join learners worldwide and share knowledge.",
      stat: stats && `${fmt(stats.members_count)} members`,
    },
    {
      icon: "bi-lightbulb",
      color: "warning",
      title: "Practical Learning",
      text: "Hands-on projects to boost your skills.",
      stat: stats && `${fmt(stats.courses_count)} courses`,
    },
  ];

  return (
    <section id="features" className="py-5">
      <div className="container">
        <div className="row text-center">
          {items.map((f) => (
            <div className="col-md-4 mb-4 mb-md-0" key={f.title}>
              <i className={`bi ${f.icon} fs-1 text-${f.color}`} aria-hidden="true" />
              <h4 className="mt-3">{f.title}</h4>
              <p className="mb-1">{f.text}</p>
              <p className="fw-semibold mb-0" style={{ minHeight: "1.5em" }}>
                {loading ? <Spinner small /> : error ? "" : f.stat}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* COURSES                                                                    */
/* ========================================================================== */

function CourseCard({ course, tutorialCount, onViewTutorials }) {
  return (
    <div className="col-sm-6 col-lg-3">
      <div className="card h-100 shadow-sm">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
            <span className="badge text-bg-secondary">{course.category}</span>
            <span className={`badge text-bg-${DIFFICULTY_STYLE[course.difficulty] || "secondary"}`}>
              {course.difficulty}
            </span>
          </div>
          <h5 className="card-title">{course.title}</h5>
          <p className="card-text text-muted flex-grow-1">{course.description}</p>
          <ul className="list-unstyled small text-muted mb-3">
            <li>
              <i className="bi bi-person me-2" aria-hidden="true" />
              {course.instructor}
            </li>
            <li>
              <i className="bi bi-clock me-2" aria-hidden="true" />
              {course.duration_hours} {course.duration_hours === 1 ? "hour" : "hours"}
            </li>
          </ul>
          <button
            className="btn btn-outline-primary"
            disabled={tutorialCount === 0}
            onClick={() => onViewTutorials(course)}
          >
            {tutorialCount === 0
              ? "No tutorials yet"
              : `View ${tutorialCount} tutorial${tutorialCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Courses({ tutorials, onViewTutorials }) {
  const { data, loading, error, retry } = useApi("/courses");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const courses = data || [];
  const categories = useMemo(() => ["All", ...new Set(courses.map((c) => c.category))], [courses]);

  const tutorialCounts = useMemo(() => {
    const map = {};
    (tutorials || []).forEach((t) => {
      if (t.course_id != null) map[t.course_id] = (map[t.course_id] || 0) + 1;
    });
    return map;
  }, [tutorials]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter(
      (c) =>
        (category === "All" || c.category === category) &&
        (difficulty === "All" || c.difficulty === difficulty) &&
        (!q || [c.title, c.description, c.instructor, c.category].join(" ").toLowerCase().includes(q))
    );
  }, [courses, search, category, difficulty]);

  const reset = () => {
    setSearch("");
    setCategory("All");
    setDifficulty("All");
  };

  return (
    <section id="courses" className="py-5 bg-light">
      <div className="container">
        <h2 className="mb-4">Courses</h2>

        <div className="row g-2 mb-4">
          <div className="col-md-6">
            <input
              type="search"
              className="form-control"
              placeholder="Search by title, topic or instructor"
              aria-label="Search courses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All categories" : c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" aria-label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {["All", "Beginner", "Intermediate", "Advanced"].map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "All levels" : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <ErrorBox error={error} onRetry={retry} />}
        {loading && (
          <div className="text-center py-5">
            <Spinner />
          </div>
        )}

        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                <p>No courses match your filters.</p>
                <button className="btn btn-outline-secondary btn-sm" onClick={reset}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {filtered.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    tutorialCount={tutorialCounts[c.id] || 0}
                    onViewTutorials={onViewTutorials}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ========================================================================== */
/* TUTORIALS                                                                  */
/* ========================================================================== */

function Tutorials({ tutorials, loading, error, retry, courseFilter, clearCourseFilter }) {
  const [openId, setOpenId] = useState(null);

  const visible = (tutorials || []).filter((t) => !courseFilter || t.course_id === courseFilter.id);

  return (
    <section id="tutorials" className="py-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <h2 className="mb-0">Tutorials</h2>
          {courseFilter && (
            <span className="badge text-bg-primary fs-6 d-flex align-items-center gap-2">
              {courseFilter.title}
              <button
                className="btn-close btn-close-white"
                style={{ fontSize: "0.6rem" }}
                aria-label="Show all tutorials"
                onClick={clearCourseFilter}
              />
            </span>
          )}
        </div>

        {error && <ErrorBox error={error} onRetry={retry} />}
        {loading && (
          <div className="text-center py-5">
            <Spinner />
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="text-center">No tutorials available yet.</p>
        )}

        <div className="row g-4">
          {visible.map((t) => {
            const open = openId === t.id;
            return (
              <div className="col-md-6" key={t.id}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {t.category && <span className="badge text-bg-info">{t.category}</span>}
                      {t.course_title && <span className="badge text-bg-light border">{t.course_title}</span>}
                    </div>
                    <h5 className="card-title">{t.title}</h5>
                    <p className="card-text text-muted">{t.description}</p>
                    {open && <div className="border-start border-3 border-primary ps-3 mb-3">{t.content}</div>}
                    <button
                      className="btn btn-link p-0"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : t.id)}
                    >
                      {open ? "Hide details" : "Read more"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* CONTACT                                                                    */
/* ========================================================================== */

function Contact({ notify }) {
  const empty = { name: "", email: "", message: "" };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!values.name.trim()) found.name = "Enter your name.";
    if (!isEmail(values.email.trim())) found.email = "Enter a valid email address.";
    if (values.message.trim().length < 10) found.message = "Write at least 10 characters.";
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await api("/contact", { method: "POST", body: values });
      notify("Message sent. We'll reply by email.");
      setValues(empty);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, props = {}) => {
    const Tag = props.as || "input";
    return (
      <div className="mb-3">
        <label htmlFor={`contact-${name}`} className="form-label">
          {label}
        </label>
        <Tag
          id={`contact-${name}`}
          name={name}
          className={`form-control ${errors[name] ? "is-invalid" : ""}`}
          value={values[name]}
          onChange={onChange}
          type={props.as ? undefined : props.type || "text"}
          rows={props.rows}
          autoComplete={props.autoComplete}
        />
        {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
      </div>
    );
  };

  return (
    <section id="contact" className="py-5 bg-light">
      <div className="container" style={{ maxWidth: 640 }}>
        <h2 className="mb-4 text-center">Contact us</h2>
        <form onSubmit={onSubmit} noValidate>
          {field("name", "Name", { autoComplete: "name" })}
          {field("email", "Email", { type: "email", autoComplete: "email" })}
          {field("message", "Message", { as: "textarea", rows: 5 })}
          {serverError && <div className="alert alert-danger">{serverError}</div>}
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? <Spinner small /> : "Send message"}
          </button>
        </form>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* FOOTER (with live server status)                                           */
/* ========================================================================== */

function Footer() {
  const [online, setOnline] = useState(null); // null = checking

  useEffect(() => {
    let cancelled = false;
    api("/health")
      .then(() => !cancelled && setOnline(true))
      .catch(() => !cancelled && setOnline(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer style={{ background: "#343a40", color: "white", padding: "20px 0", textAlign: "center" }}>
      <div className="container">
        <p className="mb-1">&copy; {new Date().getFullYear()} TutorialHub. All rights reserved.</p>
        <small className="text-white-50">
          <span
            className={`d-inline-block rounded-circle me-2 bg-${online === null ? "secondary" : online ? "success" : "danger"}`}
            style={{ width: 8, height: 8 }}
            aria-hidden="true"
          />
          {online === null ? "Checking server" : online ? "Server online" : "Server offline"}
        </small>
      </div>
    </footer>
  );
}

/* ========================================================================== */
/* APP                                                                        */
/* ========================================================================== */

export default function TutorialHubApp() {
  const tutorialsApi = useApi("/tutorials");
  const [courseFilter, setCourseFilter] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => setToast({ message, type }), []);
  const closeToast = useCallback(() => setToast(null), []);

  const viewTutorials = (course) => {
    setCourseFilter(course);
    // wait a tick so the filtered list renders before scrolling
    setTimeout(() => scrollToId("tutorials"), 0);
  };

  return (
    <div id="top">
      <Navbar />
      <Hero />
      <Features />
      <Courses tutorials={tutorialsApi.data} onViewTutorials={viewTutorials} />
      <Tutorials
        tutorials={tutorialsApi.data}
        loading={tutorialsApi.loading}
        error={tutorialsApi.error}
        retry={tutorialsApi.retry}
        courseFilter={courseFilter}
        clearCourseFilter={() => setCourseFilter(null)}
      />
      <Contact notify={notify} />
      <Footer />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
