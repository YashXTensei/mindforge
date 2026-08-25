import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, StickyNote, LogOut, User, Archive, Search, Bot, Info, Menu, X, Brain } from 'lucide-react';
import { Button } from './ui/Button';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            navigate('/login');
        }
    };

    const navItems = [
        { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/search', name: 'Search', icon: <Search size={20} /> },
        { path: '/notes', name: 'Notes', icon: <StickyNote size={20} /> },
        { path: '/vault', name: 'Vault', icon: <Archive size={20} /> },
        { path: '/chat', name: 'AI Chat', icon: <Bot size={20} /> },
        { path: '/topics', name: 'Topics', icon: <Brain size={20} /> },
        { path: '/profile', name: 'Profile', icon: <User size={20} /> },
        { path: '/about', name: 'About', icon: <Info size={20} /> },
    ];

    const isChat = location.pathname === '/chat';

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white font-sans">
            
            {/* Mobile Header - Only visible on small screens */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="font-bold text-white text-lg">M</span>
                    </div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        MindForge
                    </h2>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-gray-950 border-r border-gray-800 flex flex-col p-6 shadow-xl shrink-0 transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Area (Hidden on mobile since it's in the header) */}
                <div className="hidden md:flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <span className="font-bold text-white text-lg">M</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        MindForge
                    </h2>
                </div>

                {/* Mobile Close Button in Sidebar (Optional but helpful) */}
                <div className="md:hidden flex justify-between items-center mb-8">
                    <span className="font-bold text-gray-400">Menu</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2 flex-grow">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                onClick={() => setIsSidebarOpen(false)} // Close menu on click in mobile
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                                    ${isActive 
                                        ? 'bg-purple-500/10 text-purple-400 font-medium' 
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                    }`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />
                                )}
                                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User / Logout Area */}
                <div className="mt-auto pt-6 border-t border-gray-800">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-3"
                        onClick={handleLogout}
                        icon={<LogOut size={20} />}
                    >
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto relative pt-16 md:pt-0 ${isChat ? 'p-0' : 'p-4 md:p-8'}`}>
                <div className={`mx-auto h-full ${isChat ? 'w-full' : 'max-w-7xl'}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}