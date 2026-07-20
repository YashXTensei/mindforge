import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, FileText, Link2, StickyNote, ArrowUpRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import { fetchSearchResults } from '../api/search';
import { useNavigate } from 'react-router-dom';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const navigate = useNavigate();

    // Debounce input to avoid spamming the backend
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const { data: results, isLoading } = useQuery({
        queryKey: ['search', debouncedTerm],
        queryFn: () => fetchSearchResults(debouncedTerm),
        enabled: debouncedTerm.trim().length > 0,
    });

    const getIcon = (type, result) => {
        if (type === 'note') return <StickyNote size={20} className="text-blue-400" />;
        if (type === 'document') {
            const isImage = result?.url?.match(/\.(jpeg|jpg|png|webp)$/i);
            return isImage ? <ImageIcon size={20} className="text-pink-400" /> : <FileText size={20} className="text-red-400" />;
        }
        if (type === 'resource') return <Link2 size={20} className="text-emerald-400" />;
        return <SearchIcon size={20} />;
    };

    const getTypeBadgeColor = (type) => {
        if (type === 'note') return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
        if (type === 'document') return 'bg-red-500/15 text-red-400 border-red-500/20';
        if (type === 'resource') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
        return 'bg-gray-700 text-gray-300';
    };

    const handleResultClick = (result) => {
        if (result.type === 'note') {
            navigate(`/notes/${result.id}`);
        } else if (result.type === 'document') {
            if (result.url) {
                const fullUrl = result.url.startsWith('http') ? result.url : `http://127.0.0.1:8000${result.url}`;
                window.open(fullUrl, '_blank');
            }
        } else if (result.type === 'resource') {
            if (result.url) window.open(result.url, '_blank');
        }
    };

    return (
        <div className="max-w-3xl mx-auto text-gray-200 animate-fade-in">
            {/* Header */}
            <h1 className="text-2xl font-bold text-white mb-8">Global Search</h1>
            
            {/* Search Input */}
            <div className="mb-10 flex items-center bg-surface-card rounded-xl px-5 py-4 border border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 transition-all duration-200">
                <SearchIcon size={22} className="text-accent mr-4 shrink-0" />
                <input
                    type="text"
                    placeholder="Search across Notes, Vault, and Resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent border-none text-white text-lg outline-none placeholder:text-gray-500"
                />
                {isLoading && <Loader2 size={20} className="text-accent animate-spin ml-3" />}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center text-accent text-base py-4">
                    Searching database...
                </div>
            )}

            {/* Empty State */}
            {!isLoading && debouncedTerm && (!results || results.length === 0) && (
                <div className="text-center text-gray-500 py-16 bg-surface-card rounded-xl border border-border">
                    <SearchIcon size={40} className="text-gray-700 mx-auto mb-4" />
                    <p className="text-base">No results found for "<span className="text-gray-300">{debouncedTerm}</span>"</p>
                    <p className="text-sm text-gray-600 mt-1">Try different keywords or check your spelling</p>
                </div>
            )}

            {/* Results Count */}
            {!isLoading && results && results.length > 0 && (
                <div className="mb-4 text-sm text-gray-500">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
            )}

            {/* Results List */}
            {!isLoading && results && results.length > 0 && (
                <div className="flex flex-col gap-3">
                    {results.map((result) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="bg-surface-card border border-border rounded-lg p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-surface-hover group"
                        >
                            {/* Top Row: Icon + Title + Type Badge + Arrow */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="shrink-0">{getIcon(result.type, result)}</div>
                                    <h3 className="m-0 text-base font-medium text-white truncate">
                                        {result.title}
                                    </h3>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize border shrink-0 ${getTypeBadgeColor(result.type)}`}>
                                        {result.type}
                                    </span>
                                </div>
                                <ArrowUpRight size={16} className="text-gray-600 group-hover:text-accent transition-colors shrink-0 ml-3" />
                            </div>
                            
                            {/* Preview Text */}
                            {result.preview && (
                                <p className="m-0 mt-2.5 text-gray-400 text-sm leading-relaxed line-clamp-2">
                                    {result.preview}
                                </p>
                            )}

                            {/* Category */}
                            {result.category && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-accent">
                                        📁 {result.category}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Initial State — No search yet */}
            {!debouncedTerm && (
                <div className="text-center py-20 text-gray-600">
                    <SearchIcon size={48} className="mx-auto mb-4 text-gray-700" />
                    <p className="text-base">Start typing to search across all your knowledge</p>
                    <p className="text-sm text-gray-700 mt-1">Notes • Documents • Resources</p>
                </div>
            )}
        </div>
    );
}
