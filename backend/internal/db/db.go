package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	host     := os.Getenv("DB_HOST")
	port     := os.Getenv("DB_PORT")
	user     := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname   := os.Getenv("DB_NAME")

	if host == "" { host = "127.0.0.1" }
	if port == "" { port = "5432" }
	if user == "" { user = "postgres" }
	if password == "" { password = "12345678" }
	if dbname == "" { dbname = "course_predictor_db" }

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		host, port, user, password, dbname,
	)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to open a DB connection: ", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("Failed to ping the database (is Postgres running?): ", err)
	}

	fmt.Println("🚀 Successfully connected to PostgreSQL!")
}
