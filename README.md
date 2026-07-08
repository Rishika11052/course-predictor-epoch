# Course Predictor 

A full-stack web platform where students can rate courses and instructors, and receive personalized elective recommendations powered by a hybrid ML pipeline.

**Live Demo:** https://course-predictor1.vercel.app/

---

## What it does

- Students register and log in using their roll number
- Browse all courses with structured ratings (teaching clarity, workload, grading strictness, evaluation fairness)
- Submit reviews for courses they have taken
- Get personalized elective recommendations based on their CGPA using a hybrid ML model that predicts grades

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Go (Gin framework) |
| ML Service | Python (FastAPI + scikit-learn) |
| Database | PostgreSQL (Supabase) |

---

## Architecture

```
React Frontend (Vercel)
        ↓
Go Backend (Render)
        ↓
PostgreSQL (Supabase)
        ↓
Python ML Microservice (Render)
```

---

## ML Pipeline

The recommendation system uses a 3-stage hybrid approach:

1. **Rule-based filtering** — removes courses with very low ratings
2. **Content-based scoring** — ranks courses by teaching quality, fairness, and workload
3. **Collaborative filtering** — finds students with similar CGPA and weighs their reviews

A **Random Forest Regressor** predicts the grade a student is likely to get in each course based on their CGPA and course metrics.

---

## Database Schema

- `students` — roll number, name, email, department, CGPA
- `courses` — course code, name, department
- `instructors` — instructor name
- `course_instructor` — maps courses to instructors per semester
- `survey_responses` — individual question scores per student per course
- `course_ratings` — aggregated weighted ratings per course-instructor

---

## Live Services

| Service | URL |
|---|---|
| Frontend | https://course-predictor1.vercel.app |
| Backend API | https://course-predictor-backend3.onrender.com |
| ML Service | https://course-predictor-epoch-3.onrender.com |

<!-- > **Note:** Backend and ML service are on Render free tier and may take 30-60 seconds to wake up after inactivity. -->

---

## Project Structure

```
course-predictor/
├── backend/          # Go + Gin REST API
│   ├── cmd/server/
│   └── internal/
│       ├── db/
│       ├── handlers/
│       └── models/
├── ml-service/       # Python FastAPI ML microservice
│   └── app/
│       ├── main.py
│       ├── train_model.py
│       └── grade_model.pkl
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── pages/
│       └── components/
└── database/         # SQL schema and seed data
    ├── init.sql
    └── seed.sql
```

---
