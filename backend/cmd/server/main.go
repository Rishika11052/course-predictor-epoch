// backend/cmd/server/main.go
package main

import (
	"course-predictor-backend/internal/db"
	"course-predictor-backend/internal/handlers"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Database connection
	db.InitDB()
	defer db.DB.Close()

	// 2. Set up Gin router
	r := gin.Default()

	// 3. Configure CORS (Crucial for React)
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:5180"}
	config.AllowCredentials = true
	config.AddAllowHeaders("Authorization", "Content-Type")
	r.Use(cors.New(config))

	// 4. API Routes
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "Go backend is running smoothly!"})
	})

	// Auth
	auth := r.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	

	// Main API
	api := r.Group("/api")
	{
		api.GET("/courses", handlers.GetCourses)
		api.POST("/reviews", handlers.SubmitReview)
		api.POST("/activity", handlers.LogActivity)
		api.GET("/students/:id", handlers.GetStudentProfile)
		
		// Add this line right here!
		api.GET("/recommend/:studentId", handlers.GetRecommendations) 
	}

	// 5. Start the server
	fmt.Println("Starting server on http://localhost:8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Server crashed: ", err)
	}
}