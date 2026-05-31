-- database/init.sql

-- 1. Students
-- 1. Students (UPDATED)
CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY, 
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    cgpa NUMERIC(4,2) NOT NULL
);

-- 2. Semesters
CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL, -- 'Odd' or 'Even'
    year INTEGER NOT NULL
);

-- 3. Courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g., CS2233
    name VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    credits INTEGER NOT NULL,
    slots VARCHAR(50)
);

-- 4. Instructors
CREATE TABLE instructors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 5. Course Instructor (Junction)
CREATE TABLE course_instructor (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES semesters(id) ON DELETE CASCADE,
    UNIQUE (course_id, instructor_id, semester_id)
);

-- 6. Survey Questions
CREATE TABLE survey_questions (
    id SERIAL PRIMARY KEY,
    parameter VARCHAR(50) NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    weight NUMERIC(3,2) NOT NULL
);

-- 7. Survey Responses
CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    course_instructor_id INTEGER REFERENCES course_instructor(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES survey_questions(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    grade_received INTEGER CHECK (grade_received >= 3 AND grade_received <= 10),
    UNIQUE (student_id, course_instructor_id, question_id)
);

-- 8. Course Ratings (Pre-computed)
CREATE TABLE course_ratings (
    course_instructor_id INTEGER PRIMARY KEY REFERENCES course_instructor(id) ON DELETE CASCADE,
    avg_clarity NUMERIC(3,2) DEFAULT 0.00,
    avg_workload NUMERIC(3,2) DEFAULT 0.00,
    avg_grading_strictness NUMERIC(3,2) DEFAULT 0.00,
    avg_eval_fairness NUMERIC(3,2) DEFAULT 0.00,
    avg_overall NUMERIC(3,2) DEFAULT 0.00
);

-- 9. User Activity
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('viewed', 'liked', 'enrolled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_id, action)
);

-- 10. Course Prerequisites
CREATE TABLE course_prerequisites (
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, prerequisite_course_id)
);