import { useQuery } from '@tanstack/react-query';
import { fetchNotes } from '../api/notes';
import { Plus } from 'lucide-react';

export default function Notes() {
    // Ye line magic hai! Pura data fetching, loading state, error state handle ho gaya.
    const { data: notes, isLoading, isError } = useQuery({
        queryKey: ['notes'], // Is data ki pehchan cache ke andar
        queryFn: fetchNotes, // Data lane ka function
    });

    if (isLoading) return <div style={{ color: 'white' }}>Loading notes... ⏳</div>;
    if (isError) return <div style={{ color: '#ff4d4d' }}>Error fetching notes! ❌</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: 'white' }}>Notes</h1>
                <button style={{
                    backgroundColor: '#A076F9', color: 'white', border: 'none', padding: '10px 15px',
                    borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <Plus size={18} /> New Note
                </button>
            </div>

            {/* Agar notes list empty hai */}
            {notes?.length === 0 ? (
                <p style={{ color: '#aaa' }}>No notes found. Create your first note!</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Notes mapping */}
                    {notes?.map((note) => (
                        <div key={note.id} style={{
                            backgroundColor: '#2A2A2A', padding: '20px', borderRadius: '8px',
                            border: '1px solid #333'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>
                                {note.is_pinned && '📌 '} {note.title}
                            </h3>
                            {/* Pura content nahi, thoda summary dikhayenge */}
                            <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
                                {note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}