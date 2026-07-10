import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, StickyNote, LogOut, User , Archive } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Tokens hata do
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Login pe redirect
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#121212', color: 'white' }}>
            {/* Sidebar */}
            <div style={{ 
                width: '200px', 
                backgroundColor: '#1E1E1E', 
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #333'
            }}>
                <h2 style={{ color: '#A076F9', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    MindForge
                </h2>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                    <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link> 

                    <Link to="/notes" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <StickyNote size={20} /> Notes
                    </Link> 
                    
                    <Link to="/vault" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Archive size={20} /> Vault
                    </Link>

                    <Link to="/profile" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={20} /> Profile
                    </Link>
                    
                </nav>

                <button 
                    onClick={handleLogout}
                    style={{ 
                        background: 'transparent', 
                        color: '#ff4d4d', 
                        border: 'none', 
                        cursor: 'pointer',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        padding: '10px 0',
                        fontSize: '16px'
                    }}
                >
                    <LogOut size={20} /> Logout
                </button>
            </div>

            {/* Main Content Area */}
            <div style={{ flexGrow: 1, padding: '40px', overflowY: 'auto' }}>
                {/* Ye Outlet automatically badlega based on URL (Dashboard/Notes) */}
                <Outlet />
            </div>
        </div>
    );
}