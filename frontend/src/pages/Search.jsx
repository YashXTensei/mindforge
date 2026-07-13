import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, FileText, Link2, StickyNote, ArrowUpRight } from 'lucide-react';
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

    const getIcon = (type) => {
        if (type === 'note') return <StickyNote size={20} color="#60A5FA" />;
        if (type === 'pdf') return <FileText size={20} color="#F87171" />;
        if (type === 'resource') return <Link2 size={20} color="#34D399" />;
        return <SearchIcon size={20} />;
    };

    const handleResultClick = (result) => {
        if (result.type === 'note') {
            navigate('/notes');
        } else if (result.type === 'pdf') {
            if (result.url) {
                // If it's a full URL, use it, otherwise prepend backend URL
                const fullUrl = result.url.startsWith('http') ? result.url : `http://127.0.0.1:8000${result.url}`;
                window.open(fullUrl, '_blank');
            }
        } else if (result.type === 'resource') {
            if (result.url) window.open(result.url, '_blank');
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#e0e0e0' }}>
            <h1 style={{ marginBottom: '30px', fontSize: '28px', color: 'white' }}>Global Search</h1>
            
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: '12px', padding: '15px 20px', border: '1px solid #333' }}>
                <SearchIcon size={24} color="#A076F9" style={{ marginRight: '15px' }} />
                <input
                    type="text"
                    placeholder="Search across Notes, Vault, and Resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '18px',
                        outline: 'none',
                    }}
                />
            </div>

            {isLoading && <div style={{ textAlign: 'center', color: '#A076F9', fontSize: '16px' }}>Searching database...</div>}

            {!isLoading && debouncedTerm && (!results || results.length === 0) && (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '40px', backgroundColor: '#111', borderRadius: '8px' }}>
                    <SearchIcon size={40} color="#333" style={{ marginBottom: '15px' }} />
                    <div>No results found for "{debouncedTerm}"</div>
                </div>
            )}

            {!isLoading && results && results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {results.map((result) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            style={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '10px',
                                padding: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A076F9'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = '#1f1f1f'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {getIcon(result.type)}
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '500', color: 'white' }}>
                                        {result.title}
                                    </h3>
                                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#333', color: '#ccc', textTransform: 'capitalize' }}>
                                        {result.type}
                                    </span>
                                </div>
                                <ArrowUpRight size={18} color="#555" />
                            </div>
                            
                            {result.preview && (
                                <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px', lineHeight: '1.6' }}>
                                    {result.preview}
                                </p>
                            )}

                            {(result.category || (result.tags && result.tags.length > 0)) && (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                                    {result.category && (
                                        <span style={{ fontSize: '13px', color: '#A076F9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            Category: {result.category}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
