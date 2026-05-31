// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { getStudent, logout } from '../auth';

// Paperclip SVG icon
const PaperClip = () => (
    <svg className="absolute -top-6 right-8 w-12 h-12 text-gray-400 transform rotate-12 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
);

export default function Home() {
    const student = getStudent();

    // Helper to render the notebook holes
    const renderHoles = () => (
        <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around py-4 opacity-40">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-cp-dark shadow-inner"></div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-cp-cream text-cp-dark selection:bg-cp-green selection:text-white pb-12">
            
            {/* Top Ticker Bar */}
            <div className="bg-cp-dark text-cp-hover py-2 overflow-hidden whitespace-nowrap border-b-4 border-cp-primary">
                <div className="animate-[pulse_4s_ease-in-out_infinite] text-center font-bold tracking-widest text-sm">
                    RATE COURSES ✦ GET PICKS ✦ BOOST YOUR CG ✦ IITH ONLY
                </div>
            </div>

            {/* Navbar */}
            <nav className="bg-cp-green-light border-b border-[#c8dcb8] px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="font-gothic text-3xl text-cp-green font-bold">Course Predictor</div>
                <div className="flex items-center gap-6">
                    <span className="font-bold text-cp-dark border-b-2 border-cp-primary">Home</span>
                    <button onClick={logout} className="text-sm font-bold text-cp-dark hover:text-cp-primary transition-colors">
                        Logout →
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 mt-10">
                
                {/* Hero Section (Two Columns) */}
                <div className="flex flex-col md:flex-row gap-6 mb-16">
                    {/* Left: Greeting & Call to Action */}
                    <div className="md:w-3/5 bg-cp-green text-cp-green-light p-10 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl mb-2 font-medium text-opacity-90 text-white">Welcome back, {student?.name.split(' ')[0]}</h2>
                            <h1 className="font-display text-5xl font-extrabold mb-6 text-cp-accent">Pick Smart.</h1>
                            <Link to="/courses" className="inline-block bg-cp-primary text-white font-bold py-3 px-8 rounded shadow hover:bg-cp-hover transition-colors">
                                Browse Courses →
                            </Link>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute -bottom-10 -right-10 opacity-10">
                            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path></svg>
                        </div>
                    </div>

                    {/* Right: Explanation */}
                    <div className="md:w-2/5 bg-cp-hover text-cp-dark p-10 rounded-2xl shadow-xl">
                        <h3 className="font-display text-2xl font-bold mb-4 border-b-2 border-cp-dark pb-2 inline-block">What is this?</h3>
                        <p className="font-medium text-lg leading-relaxed">
                            A smart, ML-powered platform built exclusively for IITH. We use a Random Forest algorithm and Collaborative Filtering to analyze your CGPA and match you with courses that boost your academic performance.
                        </p>
                    </div>
                </div>

                {/* Notebook Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-8">
                    
                    {/* Card 1: Courses */}
                    <Link to="/courses" className="group relative block h-80 transition-all duration-300 hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl">
                        <PaperClip />
                        <div className="absolute inset-0 bg-cp-green rounded shadow-lg overflow-hidden border-2 border-cp-green">
                            {renderHoles()}
                            {/* Lined Paper Content */}
                            <div className="absolute inset-y-0 right-0 left-12 bg-white flex flex-col"
                                 style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)' }}>
                                <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                                    <h3 className="font-display text-4xl font-black text-cp-green mb-4">COURSES</h3>
                                    <p className="text-gray-600 font-bold">Search and filter all offerings.</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: For You (Profile) */}
                    <Link to="/profile" className="group relative block h-80 transition-all duration-300 hover:-translate-y-2 hover:-rotate-1 hover:shadow-2xl">
                        <PaperClip />
                        <div className="absolute inset-0 bg-cp-hover rounded shadow-lg overflow-hidden border-2 border-cp-hover">
                            {renderHoles()}
                            {/* Lined Paper Content */}
                            <div className="absolute inset-y-0 right-0 left-12 bg-white flex flex-col"
                                 style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)' }}>
                                <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                                    <h3 className="font-display text-4xl font-black text-cp-hover mb-4">FOR YOU</h3>
                                    <p className="text-gray-600 font-bold">Your ML-powered course picks.</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Rate It */}
                    <Link to="/courses" className="group relative block h-80 transition-all duration-300 hover:-translate-y-2 hover:rotate-2 hover:shadow-2xl">
                        <PaperClip />
                        <div className="absolute inset-0 bg-cp-dark rounded shadow-lg overflow-hidden border-2 border-cp-dark">
                            {renderHoles()}
                            {/* Lined Paper Content */}
                            <div className="absolute inset-y-0 right-0 left-12 bg-white flex flex-col"
                                 style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)' }}>
                                <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                                    <h3 className="font-display text-4xl font-black text-cp-dark mb-4">RATE IT</h3>
                                    <p className="text-gray-600 font-bold">Submit reviews to help others.</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
}