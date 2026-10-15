CREATE DATABASE IF NOT EXISTS tutorialhub_db;

USE tutorialhub_db;


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
