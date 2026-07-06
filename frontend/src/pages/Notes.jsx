import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotes, createNote, updateNote, deleteNote, fetchCategories, fetchTags } from '../api/notes';
import { Plus, X, Pencil, Trash2, Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Notes() {
    const queryClient = useQueryClient(); 
    
    // UI States
    const [showForm, setShowForm] = useState(false);
    
    // Form States
    const [editingId, setEditingId] = useState(null); 

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState('');  // '' means "All"
    const [selectedTag, setSelectedTag] = useState('');

    // Build filters object - sirf non-empty values bhejo
    const activeFilters = {};
    if (selectedCategory) activeFilters.category = selectedCategory;
    if (selectedTag) activeFilters.tag = selectedTag;

    // --- Queries & Mutations ---
    const { data: notes, isLoading, isError } = useQuery({
        queryKey: ['notes', activeFilters],  // Filter change = fresh fetch!
        queryFn: () => fetchNotes(activeFilters),
    });

    // Categories fetch karo
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });

    // Tags fetch karo
    const { data: tags } = useQuery({
        queryKey: ['tags'],
        queryFn: fetchTags,
    });
    const createMutation = useMutation({
        mutationFn: createNote,
        onSuccess: () => {
            queryClient.invalidateQueries(['notes']);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateNote,
        onSuccess: () => {
            queryClient.invalidateQueries(['notes']); // Cache update karo
            resetForm(); // Form band karo
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNote,
        onSuccess: () => {
            queryClient.invalidateQueries(['notes']); // UI ko automatically update karo
        }
    });

    const handleDeleteClick = (id) => {
        // Confirmation alert box
        if (window.confirm("Are you sure you want to delete this note?")) {
            deleteMutation.mutate(id);
        }
    };

    // --- Helper Functions ---
    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setTitle('');
        setContent('');
    };

    const handleEditClick = (note) => {
        setEditingId(note.id);
        setTitle(note.title);
        setContent(note.content);
        setShowForm(true);
        // Page ke top par scroll kar do taaki form dikh jaye
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            // Edit Mode
            updateMutation.mutate({ id: editingId, noteData: { title, content } });
        } else {
            // Create Mode
            createMutation.mutate({ title, content });
        }
    };

    // --- Rendering ---
    if (isLoading) return <div style={{ color: 'white' }}>Loading notes... ⏳</div>;
    if (isError) return <div style={{ color: '#ff4d4d' }}>Error fetching notes! ❌</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: 'white' }}>Notes</h1>
                <button 
                    onClick={() => {
                        if (showForm) resetForm();
                        else setShowForm(true);
                    }}
                    style={{
                        backgroundColor: showForm ? '#333' : '#A076F9', 
                        color: 'white', border: 'none', padding: '10px 15px',
                        borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancel' : 'New Note'}
                </button>
            </div>

            {/* Filter Bar */}
            <div style={{
                display: 'flex', gap: '15px', marginBottom: '20px',
                alignItems: 'center', flexWrap: 'wrap'
            }}>
                <Filter size={18} style={{ color: '#aaa' }} />

                {/* Category Dropdown */}
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                        padding: '8px 12px', borderRadius: '6px',
                        border: '1px solid #444', backgroundColor: '#2A2A2A',
                        color: 'white', cursor: 'pointer', fontSize: '14px'
                    }}
                >
                    <option value="">All Categories</option>
                    {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                {/* Tag Dropdown */}
                <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    style={{
                        padding: '8px 12px', borderRadius: '6px',
                        border: '1px solid #444', backgroundColor: '#2A2A2A',
                        color: 'white', cursor: 'pointer', fontSize: '14px'
                    }}
                >
                    <option value="">All Tags</option>
                    {tags?.map((tag) => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                </select>

                {/* Clear Filters button - sirf dikhao jab koi filter active ho */}
                {(selectedCategory || selectedTag) && (
                    <button
                        onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
                        style={{
                            padding: '8px 12px', borderRadius: '6px',
                            border: '1px solid #555', backgroundColor: 'transparent',
                            color: '#ff6b6b', cursor: 'pointer', fontSize: '13px'
                        }}
                    >
                        Clear Filters ✕
                    </button>
                )}
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px',
                    marginBottom: '30px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px'
                }}>
                    <h3 style={{ margin: 0, color: '#A076F9' }}>
                        {editingId ? 'Edit Note' : 'Create New Note'}
                    </h3>
                    <input 
                        type="text" 
                        placeholder="Note Title" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white' }}
                    />
                    <textarea 
                        placeholder="Write your note here..." 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white', fontFamily: 'inherit' }}
                    />
                    <button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending} 
                        style={{
                            backgroundColor: '#A076F9', color: 'white', border: 'none', padding: '10px',
                            borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start'
                        }}
                    >
                        {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Note'}
                    </button>
                </form>
            )}

            {/* Notes List */}
            {notes?.length === 0 ? (
                <p style={{ color: '#aaa' }}>
                    {(selectedCategory || selectedTag)
                        ? 'No notes found for this filter. Try changing or clearing the filters! 🔍'
                        : 'No notes yet. Create your first note! ✍️'
                    }
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {notes?.map((note) => (
                        <div key={note.id} style={{
                            backgroundColor: '#2A2A2A', padding: '20px', borderRadius: '8px',
                            border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                        }}>
                            <div style={{ flexGrow: 1 }}>
                                <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>
                                    {note.is_pinned && '📌 '} {note.title}
                                </h3>
                                <div style={{ 
                                    margin: 0, 
                                    color: '#ccc', 
                                    fontSize: '15px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3, // Sirf 3 lines dikhayega, uske baad ... lag jayega
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {note.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            
                                {/* Action Buttons Container */}
                            <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
                                <button 
                                    onClick={() => handleEditClick(note)}
                                    style={{ 
                                        background: 'transparent', border: 'none', color: '#aaa', 
                                        cursor: 'pointer', padding: '5px' 
                                    }}
                                    title="Edit Note"
                                >
                                    <Pencil size={18} />
                                </button>
                                {/* Delete Button */}
                                <button 
                                    onClick={() => handleDeleteClick(note.id)}
                                    disabled={deleteMutation.isPending} // Delete hote waqt disable kardo
                                    style={{ 
                                        background: 'transparent', border: 'none', color: '#ff4d4d', 
                                        cursor: 'pointer', padding: '5px' 
                                    }}
                                    title="Delete Note"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}