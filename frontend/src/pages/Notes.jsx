import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchNotes, createNote, updateNote, deleteNote, fetchCategories, fetchTags, createCategory, createTag, deleteCategory, deleteTag } from '../api/notes';
import { Plus, X, Pencil, Trash2, Filter, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';

export default function Notes() {
    const queryClient = useQueryClient(); 
    
    // UI States
    const [showForm, setShowForm] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const tagDropdownRef = useRef(null);

    // Click outside to close tag dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
                setShowTagDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Form States
    const [editingId, setEditingId] = useState(null); 

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const [formCategory, setFormCategory] = useState(''); //Category ID for the note
    const [formTags, setFormTags] = useState([]);               // Array of tag IDs [1, 3, 5]
    const [newCategoryName, setNewCategoryName] = useState(''); // Inline create input
    const [newTagName, setNewTagName] = useState('');           // Inline create input
    // Filter States
    const [selectedCategory, setSelectedCategory] = useState('');  // '' means "All"
    const [selectedTags, setSelectedTags] = useState([]);           // Multiple tag IDs [1, 3, 5]

    // Build filters object - sirf non-empty values bhejo
    const activeFilters = {};
    if (selectedCategory) activeFilters.category = selectedCategory;
    if (selectedTags.length > 0) activeFilters.tags = selectedTags.join(','); // [1,3,5] → "1,3,5"

    // --- Queries & Mutations ---
    const { data: notes, isLoading, isError, isFetching } = useQuery({
        queryKey: ['notes', activeFilters],  // Filter change = fresh fetch!
        queryFn: () => fetchNotes(activeFilters),
        placeholderData: keepPreviousData, // Purana data dikhao jab tak naya aa raha hai — no blink!
    });

    const navigate = useNavigate();
    
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

    // Category create mutation
    const createCategoryMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: (data) => {
            // data = { id: 7, name: "DSA", created_at: "..." } — jo backend ne return kiya
            queryClient.invalidateQueries(['categories']); // Dropdown refresh karo
            setFormCategory(data.id);    // Naye category ko auto-select karo
            setNewCategoryName('');      // Input saaf karo
        }
    });

    // Tag create mutation
    const createTagMutation = useMutation({
            mutationFn: createTag,
            onSuccess: (data) => {
                // data = { id: 4, name: "python" }
                queryClient.invalidateQueries(['tags']); // Tag list refresh karo
                setFormTags(prev => [...prev, data.id]); // Naye tag ko selected list mein add karo
                setNewTagName('');                       // Input saaf karo
            }
        });

    // Category delete mutation
    const deleteCategoryMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            queryClient.invalidateQueries(['notes']); // Notes bhi refresh karo kyunki unki category hat gayi
            setFormCategory(''); // Agar selected thi toh reset karo
        }
    });

    // Tag delete mutation
    const deleteTagMutation = useMutation({
        mutationFn: deleteTag,
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries(['tags']);
            queryClient.invalidateQueries(['notes']);
            setFormTags(prev => prev.filter(id => id !== deletedId)); // Agar selected tha toh hatao
            setSelectedTags(prev => prev.filter(id => id !== deletedId)); // Filter se bhi hatao
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
        setFormCategory('');     // Category reset
        setFormTags([]);          // Tags reset
        setNewCategoryName('');
        setNewTagName('');
    };

    const handleEditClick = (note) => {
        setEditingId(note.id);
        setTitle(note.title);
        setContent(note.content);
        setFormCategory(note.category || '');                     // Existing category set karo (ya empty)
        setFormTags(note.tags_detail?.map(t => t.id) || []);     // Existing tags ki IDs ka array banao
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const noteData = {
            title,
            content,
            category: formCategory || null,  // Empty string ko null mein convert karo (backend ke liye)
            tags: formTags,                   // Array of IDs: [1, 3, 5]
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, noteData });
        } else {
            createMutation.mutate(noteData);
        }
    };

    // --- Rendering ---
    // isLoading sirf FIRST time true hota hai. isFetching har bar true hota hai (background fetch).
    // keepPreviousData ki wajah se isLoading false rehta hai jab purana data available ho.
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

            {/* Create / Edit Form — filters se UPAR */}
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

                    {/* ===== Category Picker ===== */}
                    <div>
                        <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '5px', display: 'block' }}>
                            Category
                        </label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value)}
                                style={{
                                    padding: '10px', borderRadius: '4px', flex: 1,
                                    border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white'
                                }}
                            >
                                <option value="">No Category</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {/* Delete selected category button */}
                            {formCategory && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const catName = categories?.find(c => c.id == formCategory)?.name;
                                        if (window.confirm(`Delete category "${catName}"? It will be removed from all associated notes.`)) {
                                            deleteCategoryMutation.mutate(formCategory);
                                        }
                                    }}
                                    title="Delete this category"
                                    style={{
                                        background: 'transparent', border: 'none',
                                        color: '#ff4d4d', cursor: 'pointer', padding: '5px', fontSize: '16px'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        {/* Inline Create - New Category */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input
                                type="text"
                                placeholder="+ New category name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newCategoryName.trim()) {
                                        e.preventDefault();
                                        createCategoryMutation.mutate({ name: newCategoryName.trim() });
                                    }
                                }}
                                style={{
                                    padding: '8px', borderRadius: '4px', flex: 1, fontSize: '13px',
                                    border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#ccc'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (newCategoryName.trim()) {
                                        createCategoryMutation.mutate({ name: newCategoryName.trim() });
                                    }
                                }}
                                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                                style={{
                                    padding: '8px 12px', borderRadius: '4px', fontSize: '13px',
                                    border: 'none', backgroundColor: '#A076F9', color: 'white',
                                    cursor: 'pointer', opacity: !newCategoryName.trim() ? 0.5 : 1
                                }}
                            >
                                {createCategoryMutation.isPending ? '...' : 'Add'}
                            </button>
                        </div>
                    </div>

                    {/* ===== Tags Picker ===== */}
                    <div>
                        <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '5px', display: 'block' }}>
                            Tags
                        </label>
                        {/* Existing tags as clickable chips with delete option */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            {tags?.map((tag) => {
                                const isSelected = formTags.includes(tag.id);
                                return (
                                    <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setFormTags(prev => prev.filter(id => id !== tag.id));
                                                } else {
                                                    setFormTags(prev => [...prev, tag.id]);
                                                }
                                            }}
                                            style={{
                                                padding: '5px 12px', borderRadius: '20px 0 0 20px', fontSize: '13px',
                                                cursor: 'pointer',
                                                border: isSelected ? '1px solid #A076F9' : '1px solid #444',
                                                borderRight: 'none',
                                                backgroundColor: isSelected ? 'rgba(160, 118, 249, 0.2)' : 'transparent',
                                                color: isSelected ? '#A076F9' : '#aaa',
                                            }}
                                        >
                                            {tag.name} {isSelected && '✓'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Delete tag "${tag.name}"? It will be removed from all associated notes.`)) {
                                                    deleteTagMutation.mutate(tag.id);
                                                }
                                            }}
                                            title={`Delete tag "${tag.name}"`}
                                            style={{
                                                padding: '5px 8px', borderRadius: '0 20px 20px 0', fontSize: '11px',
                                                cursor: 'pointer',
                                                border: isSelected ? '1px solid #A076F9' : '1px solid #444',
                                                borderLeft: 'none',
                                                backgroundColor: isSelected ? 'rgba(160, 118, 249, 0.1)' : 'transparent',
                                                color: '#ff4d4d',
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                            {(!tags || tags.length === 0) && (
                                <span style={{ color: '#555', fontSize: '13px' }}>No tags yet</span>
                            )}
                        </div>

                        {/* Inline Create - New Tag */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="+ New tag name..."
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newTagName.trim()) {
                                        e.preventDefault();
                                        createTagMutation.mutate({ name: newTagName.trim() });
                                    }
                                }}
                                style={{
                                    padding: '8px', borderRadius: '4px', flex: 1, fontSize: '13px',
                                    border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#ccc'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (newTagName.trim()) {
                                        createTagMutation.mutate({ name: newTagName.trim() });
                                    }
                                }}
                                disabled={!newTagName.trim() || createTagMutation.isPending}
                                style={{
                                    padding: '8px 12px', borderRadius: '4px', fontSize: '13px',
                                    border: 'none', backgroundColor: '#A076F9', color: 'white',
                                    cursor: 'pointer', opacity: !newTagName.trim() ? 0.5 : 1
                                }}
                            >
                                {createTagMutation.isPending ? '...' : 'Add'}
                            </button>
                        </div>
                    </div>

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

            {/* Filter Bar — form ke NEECHE */}
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

                {/* Collapsible Tag Selector */}
                <div ref={tagDropdownRef} style={{ position: 'relative' }}>
                    {/* Collapsed View — selected tags + arrow */}
                    <button
                        onClick={() => setShowTagDropdown(prev => !prev)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 12px', borderRadius: '6px',
                            border: '1px solid #444', backgroundColor: '#2A2A2A',
                            color: 'white', cursor: 'pointer', fontSize: '14px',
                            minWidth: '120px'
                        }}
                    >
                        <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                            {selectedTags.length === 0 ? (
                                <span style={{ color: '#aaa' }}>Select Tags</span>
                            ) : (
                                selectedTags.map(tagId => {
                                    const tag = tags?.find(t => t.id === tagId);
                                    return tag ? (
                                        <span key={tagId} style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                                            backgroundColor: 'rgba(160, 118, 249, 0.2)', color: '#A076F9',
                                            border: '1px solid #A076F9'
                                        }}>
                                            {tag.name}
                                        </span>
                                    ) : null;
                                })
                            )}
                        </span>
                        <ChevronDown size={16} style={{
                            color: '#aaa', transition: 'transform 0.2s',
                            transform: showTagDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                        }} />
                    </button>

                    {/* Expanded View — all tag chips */}
                    {showTagDropdown && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, zIndex: 10,
                            marginTop: '6px', padding: '12px', borderRadius: '8px',
                            border: '1px solid #444', backgroundColor: '#1E1E1E',
                            display: 'flex', flexWrap: 'wrap', gap: '8px',
                            maxHeight: '150px', overflowY: 'auto', minWidth: '250px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                        }}>
                            {tags?.length === 0 && (
                                <span style={{ color: '#555', fontSize: '13px' }}>No tags yet</span>
                            )}
                            {tags?.map((tag) => {
                                const isActive = selectedTags.includes(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => {
                                            if (isActive) {
                                                setSelectedTags(prev => prev.filter(id => id !== tag.id));
                                            } else {
                                                setSelectedTags(prev => [...prev, tag.id]);
                                            }
                                        }}
                                        style={{
                                            padding: '5px 12px', borderRadius: '20px', fontSize: '13px',
                                            cursor: 'pointer',
                                            border: isActive ? '1px solid #A076F9' : '1px solid #444',
                                            backgroundColor: isActive ? 'rgba(160, 118, 249, 0.2)' : 'transparent',
                                            color: isActive ? '#A076F9' : '#aaa',
                                        }}
                                    >
                                        {tag.name} {isActive && '✓'}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Clear Filters button */}
                {(selectedCategory || selectedTags.length > 0) && (
                    <button
                        onClick={() => { setSelectedCategory(''); setSelectedTags([]); }}
                        style={{
                            padding: '8px 12px', borderRadius: '6px',
                            border: '1px solid #555', backgroundColor: 'transparent',
                            color: '#ff6b6b', cursor: 'pointer', fontSize: '13px'
                        }}
                    >
                        Clear Filters ✕
                    </button>
                )}

                {/* Subtle loading indicator for background fetch */}
                {isFetching && (
                    <span style={{ color: '#A076F9', fontSize: '12px' }}>Updating...</span>
                )}
            </div>

            {/* Notes List */}
            {notes?.length === 0 ? (
                <p style={{ color: '#aaa' }}>
                    {(selectedCategory || selectedTags.length > 0)
                        ? 'No notes found for this filter. Try changing or clearing the filters! 🔍'
                        : 'No notes yet. Create your first note! ✍️'
                    }
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {notes?.map((note) => (
                        <div 
                            key={note.id} 
                            onClick={() => navigate(`/notes/${note.id}`)}
                            style={{
                                backgroundColor: '#2A2A2A', padding: '20px', borderRadius: '8px',
                                border: '1px solid #333', display: 'flex', justifyContent: 'space-between', 
                                alignItems: 'flex-start', cursor: 'pointer', transition: 'transform 0.2s, borderColor 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A076F9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
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
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(note); }}
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
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(note.id); }}
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