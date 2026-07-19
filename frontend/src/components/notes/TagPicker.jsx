import { useState } from 'react';

export function TagPicker({ 
    tags, 
    selectedTags, 
    onChange, 
    onCreateTag, 
    onDeleteTag, 
    isCreating 
}) {
    const [newTagName, setNewTagName] = useState('');

    const handleCreate = () => {
        if (newTagName.trim()) {
            onCreateTag(newTagName.trim());
            setNewTagName('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && newTagName.trim()) {
            e.preventDefault();
            handleCreate();
        }
    };

    const toggleTag = (tagId) => {
        if (selectedTags.includes(tagId)) {
            onChange(selectedTags.filter(id => id !== tagId));
        } else {
            onChange([...selectedTags, tagId]);
        }
    };

    return (
        <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Tags</label>
            {/* Existing tags as clickable chips with delete option */}
            <div className="flex flex-wrap gap-2 mb-2">
                {tags?.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                        <div key={tag.id} className="flex items-center gap-[2px]">
                            <button
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`px-3 py-1.5 rounded-l-full text-sm cursor-pointer border-r-0 border ${isSelected ? 'border-accent bg-accent-muted text-accent' : 'border-gray-700 bg-transparent text-gray-400 hover:bg-surface-hover'}`}
                            >
                                {tag.name} {isSelected && '✓'}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete tag "${tag.name}"? It will be removed from all associated notes.`)) {
                                        onDeleteTag(tag.id);
                                    }
                                }}
                                title={`Delete tag "${tag.name}"`}
                                className={`px-2 py-1.5 rounded-r-full text-[11px] cursor-pointer border-l-0 border ${isSelected ? 'border-accent bg-accent-muted' : 'border-gray-700 bg-transparent'} text-red-400 hover:text-red-500 hover:bg-red-950`}
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
                {(!tags || tags.length === 0) && (
                    <span className="text-gray-500 text-sm">No tags yet</span>
                )}
            </div>

            {/* Inline Create - New Tag */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="+ New tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="p-2 rounded-md flex-1 text-sm border border-border bg-surface-card text-gray-300 outline-none focus:border-accent"
                />
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newTagName.trim() || isCreating}
                    className="px-3 py-2 rounded-md text-sm border-none bg-accent text-white cursor-pointer hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? '...' : 'Add'}
                </button>
            </div>
        </div>
    );
}
