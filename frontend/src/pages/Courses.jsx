// frontend/src/pages/Courses.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Add Link
import api from '../api';
import { getStudent, logout } from '../auth';

export default function Courses() {
    const student = getStudent();
    
    // Core Data State
    const [courses, setCourses] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 10;

    // Review Modal State
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [scores, setScores] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
    const [grade, setGrade] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/api/courses');
            setCourses(res.data);
        } catch (err) {
            console.error("Failed to fetch courses", err);
        } finally {
            setLoading(false);
        }
    };

    // --- SEARCH & PAGINATION LOGIC ---
    
    // 1. Filter based on search
    const filteredCourses = useMemo(() => {
        return courses.filter(c => 
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.instructor.toLowerCase().includes(search.toLowerCase())
        );
    }, [courses, search]);

    // 2. Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // 3. Slice for pagination
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

    // --- HANDLERS ---

    const handleOpenModal = (course) => {
        setSelectedCourse(course);
        // Log "viewed" activity to Go Backend
        api.post('/api/activity', {
            student_id: student.id,
            course_id: course.course_instructor_id,
            action: 'viewed'
        });
    };

    const submitReview = async () => {
        if (!grade || Object.values(scores).some(s => s === 0)) return;
        setSubmitting(true);
        try {
            await api.post('/api/reviews', {
                student_id: student.id,
                course_instructor_id: selectedCourse.course_instructor_id,
                grade_received: grade,
                scores: scores
            });
            // Log "liked" activity
            api.post('/api/activity', {
                student_id: student.id,
                course_id: selectedCourse.course_instructor_id,
                action: 'enrolled'
            });
            // Cleanup and refresh
            setSelectedCourse(null);
            setScores({ 1: 0, 2: 0, 3: 0, 4: 0 });
            setGrade('');
            fetchCourses(); 
        } catch (err) {
            alert(err.response?.data?.error || "You have already reviewed this course!");
        } finally {
            setSubmitting(false);
        }
    };

    // --- SUB-COMPONENTS ---

    const RatingBar = ({ label, value, color }) => (
        <div className="mb-2">
            <div className="flex justify-between text-[10px] font-black mb-1 uppercase opacity-60">
                <span>{label}</span>
                <span>{value.toFixed(1)}/5.0</span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-700 ease-out`} 
                    style={{ width: `${(value / 5) * 100}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-cp-cream pb-24">
            <nav className="bg-cp-green-light border-b-4 border-cp-dark px-8 py-4 flex justify-between items-center shadow-sm mb-6">
                <Link to="/home" className="font-gothic text-3xl text-cp-green font-bold hover:text-cp-primary transition-colors">
                    Course Predictor
                </Link>
                <div className="flex items-center gap-6">
                    <Link to="/home" className="font-black text-cp-dark hover:text-cp-primary uppercase text-sm">Home</Link>
                    <Link to="/profile" className="font-black text-cp-dark hover:text-cp-primary uppercase text-sm">Profile</Link>
                    <button 
                        onClick={logout} 
                        className="px-4 py-2 bg-cp-primary text-white font-black rounded-lg border-2 border-cp-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase"
                    >
                        Logout
                    </button>
                </div>
            </nav>
            <div className="max-w-6xl mx-auto px-6 pt-16">
                
                {/* Header */}
                <h1 className="font-display text-7xl font-black text-cp-dark mb-10 text-center tracking-tighter">
                    COURSES
                </h1>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-16">
                    <input 
                        type="text"
                        placeholder="Search by code, name, or instructor..."
                        className="w-full pl-14 pr-6 py-5 rounded-2xl border-4 border-cp-dark bg-white shadow-[6px_6px_0px_0px_rgba(26,15,10,1)] focus:outline-none focus:shadow-none transition-all placeholder:text-gray-400 font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="absolute left-5 top-5 text-3xl">🔍</span>
                </div>

                {loading ? (
                    <div className="text-center py-20 font-black text-2xl text-cp-dark animate-pulse">
                        LOADING IITH CATALOG...
                    </div>
                ) : (
                    <>
                        {/* Course List */}
                        <div className="space-y-6">
                            {currentCourses.length > 0 ? (
                                currentCourses.map((course, idx) => (
                                    <div 
                                        key={course.course_instructor_id}
                                        className="bg-white border-4 border-cp-dark rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-[10px_10px_0px_0px_#C0350F] transition-all group"
                                    >
                                        <div className="text-5xl font-black text-cp-primary opacity-10 w-16 italic">
                                            {indexOfFirstCourse + idx + 1}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className="text-xs font-black text-cp-primary mb-1 tracking-widest">{course.code}</h3>
                                            <h2 className="text-2xl font-black text-cp-dark mb-1 leading-tight group-hover:text-cp-primary transition-colors">
                                                {course.name}
                                            </h2>
                                            <p className="font-bold opacity-50">Instructor: {course.instructor}</p>
                                        </div>

                                        <div className="w-full md:w-72">
                                            <RatingBar label="Clarity" value={course.avg_clarity} color="bg-blue-500" />
                                            <RatingBar label="Workload" value={course.avg_workload} color="bg-cp-primary" />
                                            <RatingBar label="Fairness" value={course.avg_fairness} color="bg-cp-green" />
                                        </div>

                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-20 h-20 rounded-2xl border-4 border-cp-dark flex items-center justify-center bg-cp-accent font-black text-2xl shadow-md rotate-3">
                                                {course.avg_overall.toFixed(1)}
                                            </div>
                                            <button 
                                                onClick={() => handleOpenModal(course)}
                                                className="text-[10px] font-black uppercase tracking-[0.2em] bg-cp-dark text-white px-6 py-3 rounded-lg hover:bg-cp-primary transition-all active:scale-95"
                                            >
                                                Rate Course
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 font-bold opacity-30 text-2xl">No courses match your search.</div>
                            )}
                        </div>

                        {/* Pagination Buttons */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-6 mt-16">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="px-8 py-3 bg-white border-4 border-cp-dark font-black rounded-xl disabled:opacity-20 hover:bg-cp-accent transition-all shadow-[4px_4px_0px_0px_rgba(26,15,10,1)] active:shadow-none"
                                >
                                    PREV
                                </button>
                                
                                <span className="font-black text-cp-dark text-lg uppercase tracking-tighter">
                                    Page {currentPage} / {totalPages}
                                </span>

                                <button 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="px-8 py-3 bg-white border-4 border-cp-dark font-black rounded-xl disabled:opacity-20 hover:bg-cp-accent transition-all shadow-[4px_4px_0px_0px_rgba(26,15,10,1)] active:shadow-none"
                                >
                                    NEXT
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* REVIEW MODAL */}
            {selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cp-dark/90 backdrop-blur-md">
                    <div className="bg-cp-cream w-full max-w-2xl rounded-3xl border-4 border-cp-dark p-10 relative max-h-[90vh] overflow-y-auto shadow-2xl">
                        <button 
                            onClick={() => setSelectedCourse(null)} 
                            className="absolute top-6 right-6 text-3xl font-black hover:text-cp-primary"
                        >
                            ✕
                        </button>
                        
                        <div className="text-center mb-10">
                            <h2 className="text-sm font-black text-cp-primary uppercase tracking-widest">{selectedCourse.code}</h2>
                            <h1 className="text-4xl font-display font-black text-cp-dark leading-none mt-2">{selectedCourse.name}</h1>
                            <p className="font-bold opacity-50 mt-2">Evaluation for {selectedCourse.instructor}</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { id: 1, text: "How clear were the lectures?" },
                                { id: 2, text: "How heavy was the workload? (5 = Heavy)" },
                                { id: 3, text: "How strict was the grading? (5 = Strict)" },
                                { id: 4, text: "How fair were the evaluations?" }
                            ].map(q => (
                                <div key={q.id} className="bg-white p-6 rounded-2xl border-2 border-cp-dark/10">
                                    <p className="font-black mb-4 text-cp-dark text-lg">{q.text}</p>
                                    <div className="flex justify-between gap-2">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button 
                                                key={num}
                                                onClick={() => setScores({...scores, [q.id]: num})}
                                                className={`flex-1 h-14 rounded-xl font-black border-4 transition-all ${scores[q.id] === num ? 'bg-cp-primary text-white border-cp-dark scale-110 shadow-lg' : 'bg-gray-50 border-gray-100 hover:border-cp-accent'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="bg-white p-6 rounded-2xl border-2 border-cp-dark/10">
                                <p className="font-black mb-4 text-cp-dark text-lg">Grade Received</p>
                                <select 
                                    className="w-full p-4 rounded-xl border-4 border-cp-dark font-black text-lg bg-white"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                >
                                    <option value="">Choose your grade...</option>
                                    {['A+', 'A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <button 
                                onClick={submitReview}
                                disabled={submitting || !grade || Object.values(scores).some(s => s === 0)}
                                className="w-full py-5 bg-cp-green text-white font-black text-2xl rounded-2xl border-b-[10px] border-green-900 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-20 disabled:grayscale"
                            >
                                {submitting ? "SUBMITTING..." : "CONFIRM REVIEW"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}