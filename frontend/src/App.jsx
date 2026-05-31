// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './auth';

// We will build these pages in the next step!
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Profile from './pages/Profile';

// A wrapper component to protect private routes
const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// A wrapper to prevent logged-in users from seeing the login/register pages again
const PublicRoute = ({ children }) => {
    if (isLoggedIn()) {
        return <Navigate to="/home" replace />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-cp-dark text-cp-text font-sans selection:bg-cp-primary selection:text-white">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                    {/* Protected Routes */}
                    
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;