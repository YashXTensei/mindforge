import { useQuery } from '@tanstack/react-query';
import { fetchNotes, fetchCategories, fetchTags } from '../api/notes';
import { FileText, Folder, Tags, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    // Fetch all required data in parallel
    const { data: notes, isLoading: loadingNotes } = useQuery({
        queryKey: ['notes', {}],
        queryFn: () => fetchNotes({})
    });

    const { data: categories, isLoading: loadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories
    });

    const { data: tags, isLoading: loadingTags } = useQuery({
        queryKey: ['tags'],
        queryFn: fetchTags
    });

    const isLoading = loadingNotes || loadingCategories || loadingTags;

    if (isLoading) return <div style={{ color: 'white' }}>Loading dashboard... ⏳</div>;

    // Quick Stats Calculation
    const totalNotes = notes?.length || 0;
    const totalCategories = categories?.length || 0;
    const totalTags = tags?.length || 0;

    // Recent Notes (top 5 since they are already ordered by -updated_at from the backend)
    const recentNotes = notes?.slice(0, 5) || [];

    // Helper Card Component
    const StatCard = ({ title, value, icon, color }) => (
        <div style={{
            backgroundColor: '#2A2A2A', padding: '20px', borderRadius: '12px',
            border: `1px solid ${color}40`, borderTop: `4px solid ${color}`,
            display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '150px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#aaa' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{title}</span>
                {icon}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>
                {value}
            </div>
        </div>
    );

    return (
        <div>
            <h1 style={{ color: 'white', marginBottom: '30px' }}>Welcome to MindForge 🚀</h1>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
                <StatCard 
                    title="Total Notes" 
                    value={totalNotes} 
                    icon={<FileText size={20} color="#A076F9" />} 
                    color="#A076F9" 
                />
                <StatCard 
                    title="Categories" 
                    value={totalCategories} 
                    icon={<Folder size={20} color="#4ECDC4" />} 
                    color="#4ECDC4" 
                />
                <StatCard 
                    title="Tags" 
                    value={totalTags} 
                    icon={<Tags size={20} color="#FF6B6B" />} 
                    color="#FF6B6B" 
                />
            </div>

            {/* Recent Notes Section */}
            <div style={{ backgroundColor: '#1E1E1E', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>Recent Notes</h2>
                    <button 
                        onClick={() => navigate('/notes')}
                        style={{ 
                            background: 'transparent', border: 'none', color: '#A076F9', 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' 
                        }}
                    >
                        View All <ArrowRight size={16} />
                    </button>
                </div>

                {recentNotes.length === 0 ? (
                    <p style={{ color: '#aaa' }}>No notes created yet. Go to Notes page to start writing!</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentNotes.map(note => (
                            <div 
                                key={note.id} 
                                onClick={() => navigate('/notes')}
                                style={{
                                    backgroundColor: '#2A2A2A', padding: '15px 20px', borderRadius: '8px',
                                    border: '1px solid #444', display: 'flex', justifyContent: 'space-between', 
                                    alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2A2A2A'}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ color: 'white', fontWeight: '500' }}>
                                        {note.is_pinned && '📌 '} {note.title}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} /> 
                                        Last updated: {new Date(note.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <ArrowRight size={16} color="#666" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
