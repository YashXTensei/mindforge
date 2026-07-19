import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export function CategoryPicker({ 
    categories, 
    selectedCategory, 
    onChange, 
    onCreateCategory, 
    onDeleteCategory, 
    isCreating 
}) {
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleCreate = () => {
        if (newCategoryName.trim()) {
            onCreateCategory(newCategoryName.trim());
            setNewCategoryName('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && newCategoryName.trim()) {
            e.preventDefault();
            handleCreate();
        }
    };

    return (
        <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Category</label>
            <div className="flex gap-2.5 items-center">
                <select
                    value={selectedCategory}
                    onChange={(e) => onChange(e.target.value)}
                    className="p-2.5 rounded-md flex-1 border border-gray-700 bg-surface-elevated text-white outline-none focus:border-accent"
                >
                    <option value="">No Category</option>
                    {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                
                {selectedCategory && (
                    <button
                        type="button"
                        onClick={() => {
                            const catName = categories?.find(c => c.id == selectedCategory)?.name;
                            if (window.confirm(`Delete category "${catName}"? It will be removed from all associated notes.`)) {
                                onDeleteCategory(selectedCategory);
                            }
                        }}
                        title="Delete this category"
                        className="bg-transparent border-none text-red-400 cursor-pointer p-1.5 hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Inline Create - New Category */}
            <div className="flex gap-2 mt-2">
                <input
                    type="text"
                    placeholder="+ New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="p-2 rounded-md flex-1 text-sm border border-border bg-surface-card text-gray-300 outline-none focus:border-accent"
                />
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newCategoryName.trim() || isCreating}
                    className="px-3 py-2 rounded-md text-sm border-none bg-accent text-white cursor-pointer hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? '...' : 'Add'}
                </button>
            </div>
        </div>
    );
}
