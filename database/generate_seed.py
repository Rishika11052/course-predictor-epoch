# database/generate_seed.py
import pandas as pd
import bcrypt # type: ignore
import numpy as np
import random
import math

COURSES_FILE = 'courses.xlsx'
REG_FILE = 'reviews.xlsx'

course_archetypes_map = [
    {'C': 3.5, 'W': 3.0, 'S': 3.0, 'F': 3.5}, 
    {'C': 4.2, 'W': 4.5, 'S': 4.5, 'F': 3.0}, 
    {'C': 3.0, 'W': 2.0, 'S': 2.0, 'F': 4.1}, 
    {'C': 4.6, 'W': 2.5, 'S': 2.5, 'F': 4.5}, 
    {'C': 1.5, 'W': 4.5, 'S': 4.0, 'F': 2.0}
]

def hash_password(plain_text):
    hashed = bcrypt.hashpw(plain_text.encode('utf-8'), bcrypt.gensalt(rounds=12))
    # CRITICAL FIX FOR GO: Replace Python's $2b$ with Go's expected $2a$
    return hashed.decode('utf-8').replace("$2b$", "$2a$", 1)

def clean_str(val):
    if pd.isna(val):
        return "Unknown"
    # Escape single quotes for SQL (e.g., D'Souza -> D''Souza)
    return str(val).replace("'", "''").strip()

def main():
    print("Loading Excel files...")
    courses_df = pd.read_excel(COURSES_FILE)
    regs_df = pd.read_excel(REG_FILE, sheet_name="All Courses in Jan25-Apr 25")
    
    # Drop completely empty rows just in case
    courses_df.dropna(subset=['Course Code'], inplace=True)
    regs_df.dropna(subset=['RollNo'], inplace=True)

    print("Hashing default password (cost=12, please wait a few seconds)...")
    default_pass = hash_password("password123")

    with open('seed.sql', 'w') as f:
        f.write("-- AUTO-GENERATED SEED DATA\n\n")
        
        # 1. SEMESTERS
        f.write("-- SEMESTERS\n")
        f.write("INSERT INTO semesters (id, name, year) VALUES (1, 'Odd', 2024);\n\n")
        
        # 2. SURVEY QUESTIONS
        f.write("-- SURVEY QUESTIONS\n")
        f.write("""INSERT INTO survey_questions (id, parameter, question_text, weight) VALUES 
(1, 'clarity', 'How clear were the lectures?', 0.30),
(2, 'workload', 'How heavy was the workload? (5=very heavy)', 0.20),
(3, 'grading_strictness', 'How strict was the grading? (5=very strict)', 0.20),
(4, 'eval_fairness', 'How fair were the evaluations?', 0.30);\n\n""")

        # 3. INSTRUCTORS
        print("Processing Instructors...")
        f.write("-- INSTRUCTORS\n")
        unique_instructors = courses_df['Main Instructor / Co-ordinator'].dropna().unique()
        instructor_map = {} # name -> id
        
        for idx, inst in enumerate(unique_instructors, start=1):
            clean_name = clean_str(inst)
            instructor_map[inst] = idx
            f.write(f"INSERT INTO instructors (id, name) VALUES ({idx}, '{clean_name}');\n")
        f.write(f"SELECT setval('instructors_id_seq', {len(unique_instructors)});\n\n")

        # 4. COURSES
        print("Processing Courses... & Assesing Archetypes...")
        f.write("-- COURSES\n")
        course_map = {} # code -> id
        course_archetypes = {} # code -> dict of base scores
        
        # Drop duplicates in case a course is listed multiple times
        unique_courses = courses_df.drop_duplicates(subset=['Course Code'])
        
        for idx, row in enumerate(unique_courses.itertuples(), start=1):
            code = clean_str(row._4) # _4 is 'Course Code' (spaces become _ in itertuples, positional is safer)
            name = clean_str(row._5) # 'Course Name'
            dept = clean_str(row.Department)
            credits = int(row.Credits) if pd.notna(row.Credits) else 3
            slots = clean_str(row.Slot)
            
            course_map[code] = idx

            # Phase 1 : Assign Course Archetypes
            rand_val = random.random()
            if rand_val < 0.45:
                # 1. Standard course (45%)
                arch = 0
            elif rand_val < 0.60:
                # 2. Weeder Course (15%)
                arch = 1
            elif rand_val < 0.80:
                # 3. Easy A Course (20%)
                arch = 2
            elif rand_val < 0.90:
                # 4. Masterclass (10%)
                arch = 3
            else:
                # 5. Disaster (10%)
                arch = 4
            
            course_archetypes[code] = arch
            
            f.write(f"INSERT INTO courses (id, code, name, department, credits, slots) VALUES ({idx}, '{code}', '{name}', '{dept}', {credits}, '{slots}');\n")
        f.write(f"SELECT setval('courses_id_seq', {len(unique_courses)});\n\n")

        # 5. COURSE_INSTRUCTOR
        print("Processing Course-Instructor Links...")
        f.write("-- COURSE_INSTRUCTOR\n")
        ci_map = {} # course_code -> course_instructor_id
        
        for idx, row in enumerate(unique_courses.itertuples(), start=1):
            code = clean_str(row._4)
            inst = row._7 # 'Main Instructor / Co-ordinator'
            
            c_id = course_map.get(code)
            i_id = instructor_map.get(inst)
            
            if c_id and i_id:
                ci_map[code] = idx
                f.write(f"INSERT INTO course_instructor (id, course_id, instructor_id, semester_id) VALUES ({idx}, {c_id}, {i_id}, 1);\n")
        f.write(f"SELECT setval('course_instructor_id_seq', {len(unique_courses)});\n\n")

        # 6. STUDENTS
        print("Processing Students...")
        f.write("-- STUDENTS\n")
        unique_students = regs_df.drop_duplicates(subset=['RollNo'])
        student_cgpa = {} # roll -> cgpa
        
        for row in unique_students.itertuples():
            roll = clean_str(row.RollNo).upper()
            name = clean_str(row.StudentName)
            dept = clean_str(row.ProgramName)
            email = f"{roll.lower()}@iith.ac.in"
            
            # Generate realistic CGPA
            cgpa = round(4.5 + 5.5 * (np.random.beta(4.3, 3.5)), 2) # Beta distribution to skew towards higher CGPAs (mean ~8.5)
            student_cgpa[roll] = cgpa
            
            f.write(f"INSERT INTO students (id, name, email, password, department, cgpa) VALUES ('{roll}', '{name}', '{email}', '{default_pass}', '{dept}', {cgpa});\n")
        f.write("\n")

        # 7. SURVEY RESPONSES (SYNTHETIC ML DATA)
        print("Generating Realistic Synthetic Reviews...")
        f.write("-- SURVEY RESPONSES\n")

        response_id = 1
        for row in regs_df.itertuples():
            roll = clean_str(row.RollNo).upper()
            code = clean_str(row.CourseCode)
            
            if roll not in student_cgpa or code not in ci_map:
                continue
                
            cgpa = student_cgpa[roll]
            ci_id = ci_map[code]
            c_id = course_map.get(code)

            # Get Course Archetype
            arch = course_archetypes_map[course_archetypes[code]]
            base_C, base_W, base_S, base_F = arch['C'], arch['W'], arch['S'], arch['F']

            # Phase 2 : Student perception (Huan Bias + Noise)

            clarity = np.clip(round(base_C + random.uniform(-0.5, 0.5)), 1, 5)
            # High CGPA percieves workload as lighter
            workload = np.clip(round(base_W - ((cgpa - 7.5) * 0.3) + random.uniform(-0.5, 0.5)), 1, 5)
            strictness = np.clip(round(base_S + random.uniform(-0.5, 0.5)), 1, 5)
            # High CGPA students perceive grading as fairer
            fairness = np.clip(round(base_F + ((cgpa - 7.5) * 0.3) + random.uniform(-0.5, 0.5)), 1, 5)
            
            # Phase 3 : The grade calculation
            fairness_boost = (fairness - 3.0) * 0.40
            workload_penalty = (workload - 3.0) * 0.35
            strictness_penalty = (strictness - 3.0) * 0.25
            clarity_boost = (clarity - 3.0) * 0.20
            
            # Base expectation + feature impact + small controlled noise (0.5 standard deviation)
            expected_grade = cgpa + clarity_boost + fairness_boost - workload_penalty - strictness_penalty
            final_raw_grade = expected_grade + np.random.normal(0, 0.4)
            
            # Snap to the strict 10 to 3 custom college scale
            grade_point = int(np.clip(round(final_raw_grade), 3, 10))

            scores = {1: clarity, 2: workload, 3: strictness, 4: fairness}

            # Add user_activity so the app knows they took the course
            if c_id:
                f.write(f"INSERT INTO user_activity (student_id, course_id, action) VALUES ('{roll}', {c_id}, 'enrolled');\n")
            
            for q_id, score in scores.items():
                f.write(f"INSERT INTO survey_responses (id, student_id, course_instructor_id, question_id, score, grade_received) VALUES ({response_id}, '{roll}', {ci_id}, {q_id}, {int(score)}, '{grade_point}');\n")
                response_id += 1

        # 8. PRECOMPUTE RATINGS
        # We trigger the precomputation immediately so our frontend has data before any real user votes.
        f.write("-- PRE-COMPUTED RATINGS\n")
        f.write("""
INSERT INTO course_ratings (course_instructor_id, avg_clarity, avg_workload, avg_grading_strictness, avg_eval_fairness, avg_overall)
SELECT 
    ci.id,
    COALESCE(ROUND(AVG(CASE WHEN sr.question_id = 1 THEN sr.score END), 2), 0) as clarity,
    COALESCE(ROUND(AVG(CASE WHEN sr.question_id = 2 THEN sr.score END), 2), 0) as workload,
    COALESCE(ROUND(AVG(CASE WHEN sr.question_id = 3 THEN sr.score END), 2), 0) as strictness,
    COALESCE(ROUND(AVG(CASE WHEN sr.question_id = 4 THEN sr.score END), 2), 0) as fairness,
    COALESCE(ROUND(
        (AVG(CASE WHEN sr.question_id = 1 THEN sr.score END) * 0.30) +
        ((6.0 - AVG(CASE WHEN sr.question_id = 2 THEN sr.score END)) * 0.20) +
        ((6.0 - AVG(CASE WHEN sr.question_id = 3 THEN sr.score END)) * 0.20) +
        (AVG(CASE WHEN sr.question_id = 4 THEN sr.score END) * 0.30)
    , 2), 0) as overall
FROM course_instructor ci
LEFT JOIN survey_responses sr ON ci.id = sr.course_instructor_id
GROUP BY ci.id;
""")

    print("Done! Check database/seed.sql")

if __name__ == "__main__":
    main()