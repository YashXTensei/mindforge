import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-fade-in">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-200 mb-2">Page Not Found</h2>
            <p className="text-gray-400 mb-8 max-w-md">
                Oops! The page you are looking for doesn't exist or has been moved.
            </p>
            <Link 
                to="/dashboard" 
                className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-medium transition-colors no-underline"
            >
                <Home size={18} />
                Back to Dashboard
            </Link>
        </div>
    );
}
