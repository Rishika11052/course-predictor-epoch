// frontend/src/pages/Landing.jsx
import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div 
            className="min-h-screen flex flex-col justify-center items-center relative bg-cp-dark overflow-hidden"
        >
            {/* Background Image with Overlay */}
            <div 
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
            ></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-cp-dark to-transparent opacity-90"></div>

            {/* Content */}
            <div className="relative z-10 text-center px-4">
                <h1 className="font-gothic text-6xl md:text-8xl text-cp-hover mb-4 tracking-wider drop-shadow-lg">
                    Course Predictor
                </h1>
                <p className="font-display text-2xl md:text-4xl text-cp-text mb-12 font-bold tracking-wide">
                    Pick smarter. Graduate stronger.
                </p>
                
                <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                    <Link 
                        to="/register" 
                        className="w-48 py-3 text-lg font-bold text-white bg-cp-primary rounded-md shadow-lg transition-all duration-300 hover:bg-cp-hover hover:-translate-y-1 hover:shadow-xl text-center"
                    >
                        Get Started
                    </Link>
                    <Link 
                        to="/login" 
                        className="w-48 py-3 text-lg font-bold text-cp-text bg-transparent border-2 border-cp-card rounded-md transition-all duration-300 hover:border-cp-hover hover:text-cp-hover text-center"
                    >
                        Log In
                    </Link>
                </div>
            </div>
        </div>
    );
}