import { useState, useEffect } from 'react';
import { CategoryPicker } from './CategoryPicker';
import { TagPicker } from './TagPicker';

export function NoteForm({
    initialData,
    isEditing,
    onSubmit,
    onCancel,
    isPending,
    categories,
    tags,
    onCreateCategory,
    onDeleteCategory,
    isCreatingCategory,
    onCreateTag,
    onDeleteTag,
    isCreatingTag,
    // Add these to update the form's local state if category/tag is deleted/created externally
    newlyCreatedCategory, 
    newlyCreatedTag
}) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [formCategory, setFormCategory] = useState(initialData?.category || '');
    const [formTags, setFormTags] = useState(initialData?.tags_detail?.map(t => t.id) || []);

    // When a new category is created, automatically select it
    useEffect(() => {
        if (newlyCreatedCategory) {
            setFormCategory(newlyCreatedCategory);
        }
    }, [newlyCreatedCategory]);

    // When a new tag is created, automatically select it
    useEffect(() => {
        if (newlyCreatedTag) {
            setFormTags(prev => {
                if (!prev.includes(newlyCreatedTag)) {
                    return [...prev, newlyCreatedTag];
                }
                return prev;
            });
        }
    }, [newlyCreatedTag]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            title,
            content,
            category: formCategory || null,
            tags: formTags
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-surface-elevated p-5 rounded-lg mb-8 border border-border flex flex-col gap-4 shadow-lg">
            <h3 className="m-0 text-accent font-semibold text-lg">
                {isEditing ? 'Edit Note' : 'Create New Note'}
            </h3>
            
            <input 
                type="text" 
                placeholder="Note Title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="p-2.5 rounded-md border border-gray-700 bg-surface-card text-white outline-none focus:border-accent font-medium"
            />
            
            <textarea 
                placeholder="Write your note here..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="p-2.5 rounded-md border border-gray-700 bg-surface-card text-white outline-none focus:border-accent font-sans resize-y min-h-[120px]"
            />

            {/* ===== Category Picker ===== */}
            <CategoryPicker 
                categories={categories}
                selectedCategory={formCategory}
                onChange={setFormCategory}
                onCreateCategory={onCreateCategory}
                onDeleteCategory={onDeleteCategory}
                isCreating={isCreatingCategory}
            />

            {/* ===== Tags Picker ===== */}
            <TagPicker 
                tags={tags}
                selectedTags={formTags}
                onChange={setFormTags}
                onCreateTag={onCreateTag}
                onDeleteTag={onDeleteTag}
                isCreating={isCreatingTag}
            />

            <div className="flex gap-3 mt-2">
                <button 
                    type="submit" 
                    disabled={isPending} 
                    className="bg-accent text-white border-none py-2 px-4 rounded-md cursor-pointer hover:bg-accent-dark disabled:opacity-50"
                >
                    {isPending ? 'Saving...' : 'Save Note'}
                </button>
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="bg-transparent text-gray-400 border border-gray-600 py-2 px-4 rounded-md cursor-pointer hover:bg-surface-hover hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
