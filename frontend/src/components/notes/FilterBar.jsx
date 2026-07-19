import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export function FilterBar({ 
    categories, 
    tags, 
    selectedCategory, 
    selectedTags, 
    onCategoryChange, 
    onTagsChange, 
    onClear, 
    isFetching 
}) {
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

    const handleTagToggle = (tagId) => {
        if (selectedTags.includes(tagId)) {
            onTagsChange(selectedTags.filter(id => id !== tagId));
        } else {
            onTagsChange([...selectedTags, tagId]);
        }
    };

    return (
        <div className="flex gap-4 mb-5 items-center flex-wrap">
            <Filter size={18} className="text-gray-400" />

            {/* Category Dropdown */}
            <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-700 bg-surface-elevated text-white cursor-pointer text-sm"
            >
                <option value="">All Categories</option>
                {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>

            {/* Collapsible Tag Selector */}
            <div ref={tagDropdownRef} className="relative">
                {/* Collapsed View — selected tags + arrow */}
                <button
                    onClick={() => setShowTagDropdown(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 bg-surface-elevated text-white cursor-pointer text-sm min-w-[120px]"
                >
                    <span className="flex gap-1.5 flex-wrap flex-1">
                        {selectedTags.length === 0 ? (
                            <span className="text-gray-400">Select Tags</span>
                        ) : (
                            selectedTags.map(tagId => {
                                const tag = tags?.find(t => t.id === tagId);
                                return tag ? (
                                    <span key={tagId} className="px-2 py-0.5 rounded-xl text-xs bg-accent-muted text-accent border border-accent">
                                        {tag.name}
                                    </span>
                                ) : null;
                            })
                        )}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${showTagDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded View — all tag chips */}
                {showTagDropdown && (
                    <div className="absolute top-full left-0 z-10 mt-1.5 p-3 rounded-lg border border-gray-700 bg-surface-elevated flex flex-wrap gap-2 max-h-[150px] overflow-y-auto min-w-[250px] shadow-2xl">
                        {tags?.length === 0 && (
                            <span className="text-gray-500 text-sm">No tags yet</span>
                        )}
                        {tags?.map((tag) => {
                            const isActive = selectedTags.includes(tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => handleTagToggle(tag.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer border ${isActive ? 'border-accent bg-accent-muted text-accent' : 'border-gray-700 bg-transparent text-gray-400'}`}
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
                    onClick={onClear}
                    className="px-3 py-2 rounded-md border border-gray-600 bg-transparent text-red-400 cursor-pointer text-sm hover:bg-surface-elevated"
                >
                    Clear Filters ✕
                </button>
            )}

            {/* Subtle loading indicator for background fetch */}
            {isFetching && (
                <span className="text-accent text-xs">Updating...</span>
            )}
        </div>
    );
}
