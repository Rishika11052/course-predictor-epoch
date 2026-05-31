// backend/internal/models/models.go
package models

// --- Database Models ---

type Student struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Email      string  `json:"email"`
	Password   string  `json:"-"` // The hyphen ensures the password hash is NEVER sent to the frontend
	Department string  `json:"department"`
	CGPA       float64 `json:"cgpa"`
}

type Course struct {
	ID         int    `json:"id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	Department string `json:"department"`
	Credits    int    `json:"credits"`
	Slots      string `json:"slots"`
}

// --- Frontend Display Models ---

// CourseDisplay combines course info, instructor info, and pre-computed ratings into one neat package for the React UI.
type CourseDisplay struct {
	CourseInstructorID int     `json:"course_instructor_id"`
	CourseCode         string  `json:"code"`
	CourseName         string  `json:"name"`
	InstructorName     string  `json:"instructor"`
	AvgClarity         float64 `json:"avg_clarity"`
	AvgWorkload        float64 `json:"avg_workload"`
	AvgStrictness      float64 `json:"avg_strictness"`
	AvgFairness        float64 `json:"avg_fairness"`
	AvgOverall         float64 `json:"avg_overall"`
}

// --- API Request Payloads ---

type RegisterRequest struct {
	FullName   string  `json:"full_name"`
	RollNumber string  `json:"roll_number"`
	Department string  `json:"department"`
	CGPA       float64 `json:"cgpa"`
	Password   string  `json:"password"`
}

type LoginRequest struct {
	RollNumber string `json:"roll_number"`
	Password   string `json:"password"`
}

type ReviewSubmission struct {
	StudentID          string         `json:"student_id"`
	CourseInstructorID int            `json:"course_instructor_id"`
	GradeReceived      string         `json:"grade_received"`
	Scores             map[int]int    `json:"scores"` // e.g., {"1": 4, "2": 3} mapping question_id to score (1-5)
}

type ActivityRequest struct {
	StudentID string `json:"student_id"`
	CourseID  int    `json:"course_id"`
	Action    string `json:"action"` // "viewed", "liked", "enrolled"
}