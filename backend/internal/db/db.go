// backend/internal/db/db.go
package db

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq" // The underscore means we import it for side-effects (loading the driver)
)

// DB is a global variable to hold our database connection pool
var DB *sql.DB

func InitDB() {
	// Connection string. 
	// NOTE: If you set a specific password for your postgres user, add it here like: user=postgres password=YOUR_PASS dbname=course_predictor_db...
	connStr := "user=postgres password=12345678 dbname=course_predictor_db sslmode=disable"
	
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to open a DB connection: ", err)
	}

	// Ping verifies the connection to the database is actually alive
	err = DB.Ping()
	if err != nil {
		log.Fatal("Failed to ping the database (is Postgres running?): ", err)
	}

	fmt.Println("🚀 Successfully connected to PostgreSQL!")
}