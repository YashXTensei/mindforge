import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchNotes, createNote, updateNote, deleteNote, fetchCategories, fetchTags, createCategory, createTag, deleteCategory, deleteTag } from '../api/notes';
import { Plus, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { NoteCard } from '../components/notes/NoteCard';
import { FilterBar } from '../components/notes/FilterBar';
import { NoteForm } from '../components/notes/NoteForm';
import { DetailPanel } from '../components/ui/DetailPanel';
import { NoteDetail } from '../components/notes/NoteDetail';

const NoteSkeleton = () => (
    <div className="bg-surface-card rounded-lg border border-border p-4 h-[120px] animate-pulse flex flex-col justify-between">
        <div className="space-y-3">
            <div className="h-5 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
        <div className="flex justify-between items-end mt-4">
            <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-800 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-800 rounded-full"></div>
            </div>
            <div className="h-4 w-12 bg-gray-800 rounded"></div>
        </div>
    </div>
);

export default function Notes() {
    const queryClient = useQueryClient(); 
    
    // UI States
    const [showForm, setShowForm] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    
    // Form States
    const [editingNote, setEditingNote] = useState(null); 
    const [newlyCreatedCategory, setNewlyCreatedCategory] = useState(null);
    const [newlyCreatedTag, setNewlyCreatedTag] = useState(null);
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

    const createCategoryMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['categories']);
            setNewlyCreatedCategory(data.id);
        }
    });

    const createTagMutation = useMutation({
        mutationFn: createTag,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['tags']);
            setNewlyCreatedTag(data.id);
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            queryClient.invalidateQueries(['notes']);
        }
    });

    // Tag delete mutation
    const deleteTagMutation = useMutation({
        mutationFn: deleteTag,
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries(['tags']);
            queryClient.invalidateQueries(['notes']);
            setSelectedTags(prev => prev.filter(id => id !== deletedId)); // Filter se bhi hatao
        }
    });

    const handleDeleteClick = (id) => {
        if (window.confirm("Are you sure you want to delete this note?")) {
            toast.promise(
                deleteMutation.mutateAsync(id),
                { loading: 'Deleting...', success: 'Note deleted!', error: 'Failed to delete note.' }
            );
        }
    };

    // --- Helper Functions ---
    const resetForm = () => {
        setShowForm(false);
        setEditingNote(null);
        setNewlyCreatedCategory(null);
        setNewlyCreatedTag(null);
    };

    const handleEditClick = (note) => {
        setEditingNote(note);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormSubmit = (noteData) => {
        if (editingNote) {
            toast.promise(
                updateMutation.mutateAsync({ id: editingNote.id, noteData }),
                { loading: 'Updating...', success: 'Note updated!', error: 'Failed to update note.' }
            );
        } else {
            toast.promise(
                createMutation.mutateAsync(noteData),
                { loading: 'Saving...', success: 'Note created!', error: 'Failed to create note.' }
            );
        }
    };

    // --- Rendering ---
    // isLoading sirf FIRST time true hota hai. isFetching har bar true hota hai (background fetch).
    // keepPreviousData ki wajah se isLoading false rehta hai jab purana data available ho.
    if (isError) return <div className="text-red-400 p-8">Error fetching notes! ❌</div>;

    return (
        <div className="flex h-full gap-0 animate-fade-in">
            {/* Left: Main Notes Area */}
            <div className={`flex-1 min-w-0 overflow-y-auto ${selectedNote ? 'pr-0' : ''}`}>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-white m-0">Notes</h1>
                    <button 
                        onClick={() => {
                            if (showForm) resetForm();
                            else setShowForm(true);
                        }}
                        className={`flex items-center gap-2 border-none px-4 py-2.5 rounded-md cursor-pointer text-white transition-colors ${showForm ? 'bg-gray-800 hover:bg-gray-700' : 'bg-accent hover:bg-accent-dark'}`}
                    >
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        {showForm ? 'Cancel' : 'New Note'}
                    </button>
                </div>

                {/* Create / Edit Form — filters se UPAR */}
                {showForm && (
                    <NoteForm 
                        key={editingNote ? editingNote.id : 'new'}
                        initialData={editingNote}
                        isEditing={!!editingNote}
                        onSubmit={handleFormSubmit}
                        onCancel={resetForm}
                        isPending={createMutation.isPending || updateMutation.isPending}
                        categories={categories}
                        tags={tags}
                        onCreateCategory={(name) => {
                            toast.promise(
                                createCategoryMutation.mutateAsync({ name }),
                                { loading: 'Adding...', success: 'Category added!', error: 'Failed to add.' }
                            );
                        }}
                        onDeleteCategory={(id) => {
                            toast.promise(
                                deleteCategoryMutation.mutateAsync(id),
                                { loading: 'Deleting category...', success: 'Category deleted!', error: 'Failed to delete.' }
                            );
                        }}
                        isCreatingCategory={createCategoryMutation.isPending}
                        onCreateTag={(name) => {
                            toast.promise(
                                createTagMutation.mutateAsync({ name }),
                                { loading: 'Adding...', success: 'Tag added!', error: 'Failed to add.' }
                            );
                        }}
                        onDeleteTag={(id) => {
                            toast.promise(
                                deleteTagMutation.mutateAsync(id),
                                { loading: 'Deleting tag...', success: 'Tag deleted!', error: 'Failed to delete.' }
                            );
                        }}
                        isCreatingTag={createTagMutation.isPending}
                        newlyCreatedCategory={newlyCreatedCategory}
                        newlyCreatedTag={newlyCreatedTag}
                    />
                )}

                {/* Filter Bar — form ke NEECHE */}
                <FilterBar 
                    categories={categories}
                    tags={tags}
                    selectedCategory={selectedCategory}
                    selectedTags={selectedTags}
                    onCategoryChange={setSelectedCategory}
                    onTagsChange={setSelectedTags}
                    onClear={() => { setSelectedCategory(''); setSelectedTags([]); }}
                    isFetching={isFetching}
                />

                {/* Notes List */}
                {isLoading ? (
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!selectedNote ? 'max-w-5xl' : ''}`}>
                        {[1, 2, 3, 4, 5, 6].map(i => <NoteSkeleton key={i} />)}
                    </div>
                ) : notes?.length === 0 ? (
                    <p className="text-gray-400">
                        {(selectedCategory || selectedTags.length > 0)
                            ? 'No notes found for this filter. Try changing or clearing the filters! 🔍'
                            : 'No notes yet. Create your first note! ✍️'
                        }
                    </p>
                ) : (
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!selectedNote ? 'max-w-5xl' : ''}`}>
                        {notes?.map((note) => (
                            <NoteCard 
                                key={note.id}
                                note={note}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onNavigate={(id) => {
                                    const clicked = notes.find(n => n.id === id);
                                    setSelectedNote(prev => prev?.id === id ? null : clicked);
                                }}
                                isDeleting={deleteMutation.isPending}
                                isSelected={selectedNote?.id === note.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Detail Panel */}
            <DetailPanel 
                isOpen={!!selectedNote}
                onClose={() => setSelectedNote(null)}
                title={selectedNote?.title || ''}
            >
                <NoteDetail note={selectedNote} />
                {/* View Full Note link */}
                <button
                    onClick={() => navigate(`/notes/${selectedNote?.id}`)}
                    className="mt-6 w-full py-2.5 px-4 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors text-center"
                >
                    Open Full Note →
                </button>
            </DetailPanel>
        </div>
    );
}