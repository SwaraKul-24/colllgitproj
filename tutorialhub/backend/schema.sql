CREATE DATABASE IF NOT EXISTS tutorialhub_db;

USE tutorialhub_db;

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    instructor VARCHAR(100),
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced')
        DEFAULT 'Beginner',
    duration_hours INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tutorials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    content TEXT,
    course_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE SET NULL
);

CREATE TABLE community_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    members_count INT DEFAULT 0,
    tutorials_count INT DEFAULT 0,
    courses_count INT DEFAULT 0
);

CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tutorial_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    tutorial_id INT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY unique_user_tutorial (user_id, tutorial_id),
    FOREIGN KEY (tutorial_id) REFERENCES tutorials(id)
        ON DELETE CASCADE
);