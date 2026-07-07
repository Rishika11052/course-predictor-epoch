package main

import (
	"course-predictor-backend/internal/db"
	"course-predictor-backend/internal/handlers"
	"fmt"
	"log"
	"net/http"
	"os"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db.InitDB()
	defer db.DB.Close()

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowCredentials = true
	config.AddAllowHeaders("Authorization", "Content-Type")
	r.Use(cors.New(config))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "Go backend is running smoothly!"})
	})

	auth := r.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	api := r.Group("/api")
	{
		api.GET("/courses", handlers.GetCourses)
		api.POST("/reviews", handlers.SubmitReview)
		api.POST("/activity", handlers.LogActivity)
		api.GET("/students/:id", handlers.GetStudentProfile)
		api.GET("/recommend/:studentId", handlers.GetRecommendations)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Starting server on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server crashed: ", err)
	}
}
