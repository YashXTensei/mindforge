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

    if (isLoading) return <div className="text-white p-10">Loading note...</div>;
    if (isError) return <div className="text-red-400 p-10">Error loading note.</div>;

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
        <div className="max-w-4xl mx-auto p-10 text-gray-200">
            {/* Header Actions */}
            <div className="flex justify-between mb-8">
                <button onClick={() => navigate('/notes')} className="bg-transparent border-none text-accent cursor-pointer flex items-center gap-2 hover:text-accent-dark">
                    <ArrowLeft size={20} /> Back to Notes
                </button>
                
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="bg-gray-800 border-none text-white py-2 px-4 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-700 transition-colors">
                        <Edit2 size={16} /> Edit Note
                    </button>
                ) : (
                    <div className="flex gap-2.5">
                        <button onClick={() => setIsEditing(false)} className="bg-gray-800 border-none text-white py-2 px-4 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-700 transition-colors">
                            <X size={16} /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={updateMutation.isPending} className="bg-accent border-none text-white py-2 px-4 rounded-md cursor-pointer flex items-center gap-2 hover:bg-accent-dark transition-colors disabled:opacity-50">
                            <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            {/* Read Mode vs Edit Mode */}
            {!isEditing ? (
                // --- READ MODE ---
                <div>
                    <h1 className="text-white text-3xl mb-4 mt-0">{note.title}</h1>
                    
                    <div className="flex gap-4 mb-8 flex-wrap">
                        {note.category && (
                            <span className="bg-accent-muted text-accent py-1 px-3 rounded-full text-sm font-medium">
                                Folder: {note.category.name}
                            </span>
                        )}
                        {note.tags_detail?.map(tag => (
                            <span key={tag.id} className="bg-gray-800 text-gray-300 py-1 px-3 rounded-full text-sm font-medium">
                                #{tag.name}
                            </span>
                        ))}
                    </div>

                    <div className="bg-surface-card p-8 rounded-xl border border-border min-h-[300px] leading-relaxed text-gray-300">
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                // --- EDIT MODE ---
                <div className="flex flex-col gap-5">
                    <input 
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Note Title"
                        className="w-full p-4 bg-surface-card border border-border rounded-lg text-white text-2xl outline-none focus:border-accent transition-colors font-semibold"
                    />
                    
                    <div className="flex gap-5">
                        <select 
                            value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                            className="p-3 bg-surface-card border border-border rounded-lg text-white flex-1 outline-none focus:border-accent transition-colors"
                        >
                            <option value="">No Category</option>
                            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {tags?.map(tag => (
                            <button key={tag.id} type="button" onClick={() => handleTagToggle(tag.id)}
                                className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition-colors ${selectedTags.includes(tag.id) ? 'border-accent bg-accent text-white' : 'border-gray-600 bg-transparent text-gray-300 hover:border-gray-500'}`}
                            >
                                #{tag.name}
                            </button>
                        ))}
                    </div>

                    <textarea 
                        value={content} onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your note here in Markdown..."
                        className="w-full h-[400px] p-5 bg-surface-card border border-border rounded-lg text-white text-base outline-none resize-y focus:border-accent transition-colors"
                    />
                </div>
            )}
        </div>
    );
}