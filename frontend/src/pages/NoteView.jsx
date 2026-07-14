import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNote, updateNote, fetchCategories, fetchTags } from '../api/notes';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Edit2, Save, X, Trash2 } from 'lucide-react';

export default function NoteView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    // Fetch Note Data
    const { data: note, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => fetchNote(id)
    });

    // Fetch Categories & Tags for Edit Mode
    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories, enabled: isEditing });
    const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags, enabled: isEditing });

    // Populate state when entering edit mode
    useEffect(() => {
        if (note && !isEditing) {
            setTitle(note.title);
            setContent(note.content);
            setCategoryId(note.category?.id || '');
            setSelectedTags(note.tags_detail?.map(t => t.id) || []);
        }
    }, [note, isEditing]);

    const updateMutation = useMutation({
        mutationFn: updateNote,
        onSuccess: () => {
            queryClient.invalidateQueries(['note', id]);
            queryClient.invalidateQueries(['notes']);
            setIsEditing(false); // Wapas Read Mode me jao
        }
    });

    if (isLoading) return <div style={{ color: 'white', padding: '40px' }}>Loading note...</div>;
    if (isError) return <div style={{ color: '#ff4d4d', padding: '40px' }}>Error loading note.</div>;

    const handleSave = () => {
        updateMutation.mutate({
            id,
            noteData: { title, content, category: categoryId || null, tags: selectedTags }
        });
    };

    const handleTagToggle = (tagId) => {
        setSelectedTags(prev => 
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', color: '#e0e0e0' }}>
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <button onClick={() => navigate('/notes')} style={{ background: 'none', border: 'none', color: '#A076F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={20} /> Back to Notes
                </button>
                
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} style={{ background: '#333', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Edit2 size={16} /> Edit Note
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setIsEditing(false)} style={{ background: '#333', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <X size={16} /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={updateMutation.isPending} style={{ background: '#A076F9', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            {/* Read Mode vs Edit Mode */}
            {!isEditing ? (
                // --- READ MODE ---
                <div>
                    <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '15px' }}>{note.title}</h1>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        {note.category && (
                            <span style={{ backgroundColor: '#2d1b4e', color: '#A076F9', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' }}>
                                Folder: {note.category.name}
                            </span>
                        )}
                        {note.tags_detail?.map(tag => (
                            <span key={tag.id} style={{ backgroundColor: '#333', color: '#ccc', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' }}>
                                #{tag.name}
                            </span>
                        ))}
                    </div>

                    <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333', minHeight: '300px', lineHeight: '1.6' }}>
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                // --- EDIT MODE ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input 
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Note Title"
                        style={{ width: '100%', padding: '15px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '24px', outline: 'none' }}
                    />
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <select 
                            value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                            style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white', flex: 1 }}
                        >
                            <option value="">No Category</option>
                            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {tags?.map(tag => (
                            <button key={tag.id} type="button" onClick={() => handleTagToggle(tag.id)}
                                style={{
                                    padding: '5px 12px', borderRadius: '15px', border: '1px solid #555', cursor: 'pointer', fontSize: '12px',
                                    backgroundColor: selectedTags.includes(tag.id) ? '#A076F9' : 'transparent',
                                    color: selectedTags.includes(tag.id) ? 'white' : '#ccc'
                                }}
                            >
                                #{tag.name}
                            </button>
                        ))}
                    </div>

                    <textarea 
                        value={content} onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your note here in Markdown..."
                        style={{ width: '100%', height: '400px', padding: '20px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '16px', outline: 'none', resize: 'vertical' }}
                    />
                </div>
            )}
        </div>
    );
}