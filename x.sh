#!/bin/bash

# Exit immediately if any command fails
set -e 

echo "🚀 Starting Full Pipeline Reset..."

# 1. Generate the Seed Data
echo "📦 1/4: Generating Seed Data (Phase 1-3)..."
cd database/
source venv/bin/activate
python3 generate_seed.py

# 2. Reset the Database
echo "🗑️  2/4: Wiping and rebuilding the database..."

# Set the Postgres password so it stops prompting you
export PGPASSWORD="12345678"

# Run the PSQL commands silently (-q) to keep the terminal clean
psql -q -U postgres -h 127.0.0.1 -d course_predictor_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -q -U postgres -h 127.0.0.1 -d course_predictor_db -f init.sql
psql -q -U postgres -h 127.0.0.1 -d course_predictor_db -f seed.sql

echo "✅ Database successfully rebuilt and seeded!"

# 3. Extract the new data for ML
echo "📥 3/4: Extracting data for ML model..."
cd ..
cd ml-service/
source .venv/bin/activate
python3 app/generate_data.py
python3 app/analyze_data.py
# 4. Train the AI
echo "🧠 4/4: Training the Random Forest..."
python3 app/train_model.py

echo "🎉 Pipeline Complete! The AI is updated and ready."
