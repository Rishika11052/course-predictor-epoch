// backend/internal/handlers/handlers.go
package handlers

import (
	"bytes"
	"course-predictor-backend/internal/db"
	"course-predictor-backend/internal/models"
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Secret key for JWT signing. In production, this goes in an .env file.
var jwtKey = []byte("iith_course_predictor_super_secret_key_123")

// --- AUTHENTICATION ---

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Hash password (cost 12)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	email := strings.ToLower(req.RollNumber) + "@iith.ac.in"
	req.RollNumber = strings.ToUpper(req.RollNumber)

	_, err = db.DB.Exec(`
		INSERT INTO students (id, name, email, password, department, cgpa) 
		VALUES ($1, $2, $3, $4, $5, $6)`,
		req.RollNumber, req.FullName, email, string(hashedPassword), req.Department, req.CGPA)

	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "Roll number or email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error during registration"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Registration successful. Please log in."})
}

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	req.RollNumber = strings.ToUpper(req.RollNumber)

	var student models.Student
	var hashedPassword string

	err := db.DB.QueryRow(`SELECT id, name, email, password, department, cgpa FROM students WHERE id = $1`, req.RollNumber).
		Scan(&student.ID, &student.Name, &student.Email, &hashedPassword, &student.Department, &student.CGPA)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid roll number or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid roll number or password"})
		return
	}

	// Generate JWT Token (24 hour expiry)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"student_id": student.ID,
		"exp":        time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   tokenString,
		"student": student,
	})
}

// --- COURSES & REVIEWS ---

func GetCourses(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT 
			ci.id AS course_instructor_id,
			c.code, c.name, i.name AS instructor,
			cr.avg_clarity, cr.avg_workload, cr.avg_grading_strictness, cr.avg_eval_fairness, cr.avg_overall
		FROM course_instructor ci
		JOIN courses c ON ci.course_id = c.id
		JOIN instructors i ON ci.instructor_id = i.id
		LEFT JOIN course_ratings cr ON ci.id = cr.course_instructor_id
		ORDER BY cr.avg_overall DESC NULLS LAST
	`)
	if err != nil {
		log.Println("GetCourses DB Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courses"})
		return
	}
	defer rows.Close()

	var courses []models.CourseDisplay
	for rows.Next() {
		var cd models.CourseDisplay
		// Use sql.NullFloat64 in case ratings don't exist yet
		var cly, wl, gs, ef, oa sql.NullFloat64

		if err := rows.Scan(&cd.CourseInstructorID, &cd.CourseCode, &cd.CourseName, &cd.InstructorName, &cly, &wl, &gs, &ef, &oa); err != nil {
			continue
		}
		cd.AvgClarity = cly.Float64
		cd.AvgWorkload = wl.Float64
		cd.AvgStrictness = gs.Float64
		cd.AvgFairness = ef.Float64
		cd.AvgOverall = oa.Float64
		courses = append(courses, cd)
	}

	// If nil, return empty array instead of null for React frontend
	if courses == nil {
		courses = []models.CourseDisplay{}
	}
	c.JSON(http.StatusOK, courses)
}

func SubmitReview(c *gin.Context) {
	var req models.ReviewSubmission
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// --- NEW: Map Frontend Letter Grade to Internal ML Scale (10 to 3) ---
    var gradeToMLScale = map[string]int{
        "A+": 10, "A":  9, "A-": 8, "B":  7, "B-": 6, "C":  5, "C-": 4, "D":  3,
    }

	// Assuming req.GradeReceived is a string from the frontend
    internalScore, exists := gradeToMLScale[req.GradeReceived]
    if !exists {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid grade submitted"})
        return
    }

	/// Insert each question score using the mapped internalScore
    for qID, score := range req.Scores {
        _, err := db.DB.Exec(`
            INSERT INTO survey_responses (student_id, course_instructor_id, question_id, score, grade_received)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (student_id, course_instructor_id, question_id) DO UPDATE 
            SET score = EXCLUDED.score, grade_received = EXCLUDED.grade_received`,
            req.StudentID, req.CourseInstructorID, qID, score, internalScore) 
        
        if err != nil {
            log.Println("SubmitReview DB Error:", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save review"})
            return
        }
    }

	// Trigger Recalculate Ratings SQL Logic
	recalculateRatings(req.CourseInstructorID)

	c.JSON(http.StatusOK, gin.H{"message": "Review submitted successfully"})
}

// recalculateRatings uses your specific CTE logic to upsert course_ratings
func recalculateRatings(ciID int) {
	query := `
		WITH avgs AS (
			SELECT 
				course_instructor_id,
				COALESCE(ROUND(AVG(CASE WHEN question_id = 1 THEN score END), 2), 0) as clarity,
				COALESCE(ROUND(AVG(CASE WHEN question_id = 2 THEN score END), 2), 0) as workload,
				COALESCE(ROUND(AVG(CASE WHEN question_id = 3 THEN score END), 2), 0) as strictness,
				COALESCE(ROUND(AVG(CASE WHEN question_id = 4 THEN score END), 2), 0) as fairness
			FROM survey_responses
			WHERE course_instructor_id = $1
			GROUP BY course_instructor_id
		)
		INSERT INTO course_ratings (course_instructor_id, avg_clarity, avg_workload, avg_grading_strictness, avg_eval_fairness, avg_overall)
		SELECT 
			course_instructor_id,
			clarity, workload, strictness, fairness,
			ROUND((clarity*0.30 + (6.0 - workload)*0.20 + (6.0 - strictness)*0.20 + fairness*0.30), 2)
		FROM avgs
		ON CONFLICT (course_instructor_id) DO UPDATE SET
			avg_clarity = EXCLUDED.avg_clarity,
			avg_workload = EXCLUDED.avg_workload,
			avg_grading_strictness = EXCLUDED.avg_grading_strictness,
			avg_eval_fairness = EXCLUDED.avg_eval_fairness,
			avg_overall = EXCLUDED.avg_overall;
	`
	_, err := db.DB.Exec(query, ciID)
	if err != nil {
		log.Println("Recalculate Ratings Error:", err)
	}
}

// --- ACTIVITY & PREREQUISITES ---

func LogActivity(c *gin.Context) {
	var req models.ActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.DB.Exec(`
		INSERT INTO user_activity (student_id, course_id, action) 
		VALUES ($1, $2, $3)
		ON CONFLICT (student_id, course_id, action) DO NOTHING`,
		req.StudentID, req.CourseID, req.Action)

	if err != nil {
		log.Println("LogActivity Error:", err)
	}
	c.JSON(http.StatusOK, gin.H{"message": "Activity logged"})
}

func GetStudentProfile(c *gin.Context) {
	id := c.Param("id")
	var student models.Student
	err := db.DB.QueryRow(`SELECT id, name, email, department, cgpa FROM students WHERE id = $1`, strings.ToUpper(id)).
		Scan(&student.ID, &student.Name, &student.Email, &student.Department, &student.CGPA)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}
	c.JSON(http.StatusOK, student)
}

func GetRecommendations(c *gin.Context) {
	studentID := strings.ToUpper(c.Param("studentId"))

	// 1. Get student CGPA from DB
	var cgpa float64
	err := db.DB.QueryRow(`SELECT cgpa FROM students WHERE id = $1`, studentID).Scan(&cgpa)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// 2. Prepare payload for ML Service
	mlPayload := map[string]interface{}{
		"student_id": studentID,
		"cgpa":       cgpa,
	}
	jsonData, _ := json.Marshal(mlPayload)

	// 3. Call Python ML Service
	resp, err := http.Post("http://localhost:8000/recommend", "application/json", bytes.NewBuffer(jsonData))
	
	// 4. FALLBACK LOGIC (If Python is down or throws an error)
	if err != nil || resp.StatusCode != http.StatusOK {
		log.Println("⚠️ ML Service unreachable! Triggering fallback to top courses. Error:", err)
		
		rows, dbErr := db.DB.Query(`
			SELECT c.code, c.name, i.name AS instructor,
			       COALESCE(cr.avg_overall, 3.0), COALESCE(cr.avg_clarity, 3.0), COALESCE(cr.avg_workload, 3.0)
			FROM course_instructor ci
			JOIN courses c ON ci.course_id = c.id
			JOIN instructors i ON ci.instructor_id = i.id
			LEFT JOIN course_ratings cr ON ci.id = cr.course_instructor_id
			ORDER BY cr.avg_overall DESC NULLS LAST
			LIMIT 5
		`)
		if dbErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error during fallback"})
			return
		}
		defer rows.Close()

		var fallbacks []map[string]interface{}
		for rows.Next() {
			var code, name, instructor string
			var overall, clarity, workload float64
			if err := rows.Scan(&code, &name, &instructor, &overall, &clarity, &workload); err == nil {
				// We format this exactly like the ML response so the React frontend doesn't break
				fallbacks = append(fallbacks, map[string]interface{}{
					"code": code,
					"name": name,
					"instructor": instructor,
					"avg_overall": overall,
					"avg_clarity": clarity,
					"avg_workload": workload,
					"predicted_grade": "N/A", 
					"score": overall,
					"reason": "Top rated course (Fallback: ML Service Offline)",
				})
			}
		}
		c.JSON(http.StatusOK, fallbacks)
		return
	}
	defer resp.Body.Close()

	// 5. If successful, pass the ML JSON response directly to the React frontend
	body, _ := io.ReadAll(resp.Body)
	c.Data(http.StatusOK, "application/json", body)
}