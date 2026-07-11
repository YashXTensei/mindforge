import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPDFs, uploadPDF, updatePDF, deletePDF, fetchResources, createResource, updateResource, deleteResource } from '../api/vault';
import { fetchCategories, fetchTags, createCategory, createTag } from '../api/notes';
import { Plus, X, Trash2, FileText, Link2, Upload, Star, ExternalLink, Pencil } from 'lucide-react';

// Helper: bytes → human readable
function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Vault() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('pdfs');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // ========== PDF Form States ==========
    const [pdfTitle, setPdfTitle] = useState('');
    const [pdfDescription, setPdfDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [pdfCategory, setPdfCategory] = useState('');
    const [pdfTags, setPdfTags] = useState([]);
    const fileInputRef = useRef(null);

    // ========== Resource Form States ==========
    const [resTitle, setResTitle] = useState('');
    const [resDescription, setResDescription] = useState('');
    const [resUrl, setResUrl] = useState('');
    const [resType, setResType] = useState('other');
    const [resCategory, setResCategory] = useState('');
    const [resTags, setResTags] = useState([]);

    // ========== Filter States ==========
    const [filterCategory, setFilterCategory] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [filterType, setFilterType] = useState('');       // Resources ke liye
    const [filterFavorite, setFilterFavorite] = useState(''); // '', 'true', 'false'

    // ========== Inline Create States ==========
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newTagName, setNewTagName] = useState('');

    // ========== Queries ==========

    // Build filter objects
    const pdfFilters = {};
    if (filterCategory) pdfFilters.category = filterCategory;
    if (filterTags.length > 0) pdfFilters.tags = filterTags.join(',');
    if (filterFavorite) pdfFilters.is_favorite = filterFavorite;

    const resourceFilters = { ...pdfFilters };
    if (filterType) resourceFilters.type = filterType;

    const { data: pdfs, isLoading: pdfsLoading } = useQuery({
        queryKey: ['pdfs', pdfFilters],  // filters change = refetch!
        queryFn: () => fetchPDFs(pdfFilters),
    });

    const { data: resources, isLoading: resourcesLoading } = useQuery({
        queryKey: ['resources', resourceFilters],
        queryFn: () => fetchResources(resourceFilters),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });

    const { data: tags } = useQuery({
        queryKey: ['tags'],
        queryFn: fetchTags,
    });

    // ========== Mutations ==========
    const uploadMutation = useMutation({
        mutationFn: uploadPDF,
        onSuccess: () => {
            queryClient.invalidateQueries(['pdfs']);
            resetForm();
        },
    });

    const deletePDFMutation = useMutation({
        mutationFn: deletePDF,
        onSuccess: () => queryClient.invalidateQueries(['pdfs']),
    });

    const createResourceMutation = useMutation({
        mutationFn: createResource,
        onSuccess: () => {
            queryClient.invalidateQueries(['resources']);
            resetForm();
        },
    });

    const deleteResourceMutation = useMutation({
        mutationFn: deleteResource,
        onSuccess: () => queryClient.invalidateQueries(['resources']),
    });

    const updatePDFMutation = useMutation({
        mutationFn: updatePDF,
        onSuccess: () => {
            queryClient.invalidateQueries(['pdfs']);
            resetForm();
        },
    });

    const updateResourceMutation = useMutation({
        mutationFn: updateResource,
        onSuccess: () => {
            queryClient.invalidateQueries(['resources']);
            resetForm();
        },
    });

    const createCategoryMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['categories']);
            setPdfCategory(data.id);
            setResCategory(data.id);
            setNewCategoryName('');
        },
    });

    const createTagMutation = useMutation({
        mutationFn: createTag,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['tags']);
            setPdfTags(prev => [...prev, data.id]);
            setResTags(prev => [...prev, data.id]);
            setNewTagName('');
        },
    });

    // ========== Helpers ==========
    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        // PDF
        setPdfTitle('');
        setPdfDescription('');
        setSelectedFile(null);
        setPdfCategory('');
        setPdfTags([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        // Resource
        setResTitle('');
        setResDescription('');
        setResUrl('');
        setResType('other');
        setResCategory('');
        setResTags([]);
        
        setNewCategoryName('');
        setNewTagName('');
    };

    const handleEditPDFClick = (pdf) => {
        setEditingId(pdf.id);
        setPdfTitle(pdf.title);
        setPdfDescription(pdf.description || '');
        setPdfCategory(pdf.category || '');
        setPdfTags(pdf.tags_detail?.map(t => t.id) || []);
        setSelectedFile(null); // Optional to re-upload file
        setActiveTab('pdfs');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditResourceClick = (res) => {
        setEditingId(res.id);
        setResTitle(res.title);
        setResUrl(res.url);
        setResDescription(res.description || '');
        setResType(res.resource_type || 'other');
        setResCategory(res.category || '');
        setResTags(res.tags_detail?.map(t => t.id) || []);
        setActiveTab('resources');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePDFSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', pdfTitle);
        if (selectedFile) formData.append('file', selectedFile);
        if (pdfDescription) formData.append('description', pdfDescription);
        if (pdfCategory) formData.append('category', pdfCategory);
        pdfTags.forEach(tagId => formData.append('tags', tagId));
        
        if (editingId) {
            updatePDFMutation.mutate({ id: editingId, pdfData: formData });
        } else {
            uploadMutation.mutate(formData);
        }
    };

    const handleResourceSubmit = (e) => {
        e.preventDefault();
        const resourceData = {
            title: resTitle,
            url: resUrl,
            resource_type: resType,
            description: resDescription,
            category: resCategory || null,
            tags: resTags,
        };
        if (editingId) {
            updateResourceMutation.mutate({ id: editingId, resourceData });
        } else {
            createResourceMutation.mutate(resourceData);
        }
    };

    // Tab button style helper
    const tabStyle = (tab) => ({
        padding: '10px 24px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: activeTab === tab ? '600' : '400',
        color: activeTab === tab ? '#A076F9' : '#888',
        backgroundColor: 'transparent',
        borderBottom: activeTab === tab ? '2px solid #A076F9' : '2px solid transparent',
        transition: 'all 0.2s',
    });

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: 'white', margin: 0 }}>Knowledge Vault</h1>
                <button
                    onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
                    style={{
                        backgroundColor: showForm ? '#333' : '#A076F9',
                        color: 'white', border: 'none', padding: '10px 15px',
                        borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancel' : activeTab === 'pdfs' ? 'Upload PDF' : 'Add Resource'}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #333', marginBottom: '25px' }}>
                <button // Tabs ke onClick mein filter reset add karo
                    onClick={() => { 
                        setActiveTab('pdfs'); 
                        resetForm(); 
                        setFilterCategory(''); setFilterTags([]); setFilterType(''); setFilterFavorite('');
                    }} style={tabStyle('pdfs')}>
                    <FileText size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    PDFs
                </button>
                <button onClick={() => { setActiveTab('resources'); resetForm(); }} style={tabStyle('resources')}>
                    <Link2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Resources
                </button>
            </div>

            {/* Filter Bar */}
            <div style={{
                display: 'flex', gap: '12px', marginBottom: '20px',
                alignItems: 'center', flexWrap: 'wrap'
            }}>
                {/* Category Filter */}
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                    style={{
                        padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
                        border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white', cursor: 'pointer'
                    }}
                >
                    <option value="">All Categories</option>
                    {categories?.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                {/* Resource Type Filter — sirf Resources tab pe */}
                {activeTab === 'resources' && (
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                        style={{
                            padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
                            border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white', cursor: 'pointer'
                        }}
                    >
                        <option value="">All Types</option>
                        <option value="article">Article</option>
                        <option value="video">Video</option>
                        <option value="documentation">Documentation</option>
                        <option value="repository">Repository</option>
                        <option value="website">Website</option>
                        <option value="other">Other</option>
                    </select>
                )}

                {/* Favorite Filter */}
                <select value={filterFavorite} onChange={(e) => setFilterFavorite(e.target.value)}
                    style={{
                        padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
                        border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white', cursor: 'pointer'
                    }}
                >
                    <option value="">All</option>
                    <option value="true">⭐ Favorites</option>
                    <option value="false">Not Favorites</option>
                </select>

                {/* Tag Chips */}
                {tags?.map(tag => {
                    const isActive = filterTags.includes(tag.id);
                    return (
                        <button key={tag.id}
                            onClick={() => {
                                if (isActive) setFilterTags(prev => prev.filter(id => id !== tag.id));
                                else setFilterTags(prev => [...prev, tag.id]);
                            }}
                            style={{
                                padding: '5px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                                border: isActive ? '1px solid #A076F9' : '1px solid #444',
                                backgroundColor: isActive ? 'rgba(160, 118, 249, 0.2)' : 'transparent',
                                color: isActive ? '#A076F9' : '#aaa',
                            }}
                        >
                            {tag.name} {isActive && '✓'}
                        </button>
                    );
                })}

                {/* Clear Filters */}
                {(filterCategory || filterTags.length > 0 || filterType || filterFavorite) && (
                    <button
                        onClick={() => { setFilterCategory(''); setFilterTags([]); setFilterType(''); setFilterFavorite(''); }}
                        style={{
                            padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                            border: '1px solid #555', backgroundColor: 'transparent',
                            color: '#ff6b6b', cursor: 'pointer'
                        }}
                    >
                        Clear Filters ✕
                    </button>
                )}
            </div>

            {/* ==================== PDFs TAB ==================== */}
            {activeTab === 'pdfs' && (
                <>
                    {/* Upload Form */}
                    {showForm && (
                        <form onSubmit={handlePDFSubmit} style={{
                            backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px',
                            marginBottom: '25px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px'
                        }}>
                            <h3 style={{ margin: 0, color: '#A076F9' }}>{editingId ? 'Edit PDF' : 'Upload PDF'}</h3>

                            <input
                                type="text" placeholder="PDF Title" value={pdfTitle} required
                                onChange={(e) => setPdfTitle(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white' }}
                            />

                            <textarea
                                placeholder="Description (optional)" value={pdfDescription} rows={3}
                                onChange={(e) => setPdfDescription(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white', fontFamily: 'inherit' }}
                            />

                            {/* File Input */}
                            <div>
                                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '5px' }}>
                                    PDF File
                                </label>
                                <input
                                    type="file" accept=".pdf" ref={fileInputRef} required={!editingId}
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    style={{ color: '#ccc', fontSize: '14px' }}
                                />
                                {selectedFile && (
                                    <span style={{ color: '#888', fontSize: '12px', marginLeft: '10px' }}>
                                        {formatFileSize(selectedFile.size)}
                                    </span>
                                )}
                            </div>

                            {/* Category */}
                            <select value={pdfCategory} onChange={(e) => setPdfCategory(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white' }}
                            >
                                <option value="">No Category</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

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
                                    disabled={!newCategoryName.trim()}
                                    style={{
                                        padding: '8px 12px', borderRadius: '4px', fontSize: '13px',
                                        border: 'none', backgroundColor: '#A076F9', color: 'white',
                                        cursor: 'pointer', opacity: !newCategoryName.trim() ? 0.5 : 1
                                    }}
                                >
                                    Add
                                </button>
                            </div>

                            {/* Tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {tags?.map(tag => {
                                    const isSelected = pdfTags.includes(tag.id);
                                    return (
                                        <button key={tag.id} type="button"
                                            onClick={() => {
                                                if (isSelected) setPdfTags(prev => prev.filter(id => id !== tag.id));
                                                else setPdfTags(prev => [...prev, tag.id]);
                                            }}
                                            style={{
                                                padding: '5px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                                                border: isSelected ? '1px solid #A076F9' : '1px solid #444',
                                                backgroundColor: isSelected ? 'rgba(160, 118, 249, 0.2)' : 'transparent',
                                                color: isSelected ? '#A076F9' : '#aaa',
                                            }}
                                        >
                                            {tag.name} {isSelected && '✓'}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Inline Create - New Tag */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
                                        if (newTagName.trim()) createTagMutation.mutate({ name: newTagName.trim() });
                                    }}
                                    disabled={!newTagName.trim()}
                                    style={{
                                        padding: '8px 12px', borderRadius: '4px', fontSize: '13px',
                                        border: 'none', backgroundColor: '#A076F9', color: 'white',
                                        cursor: 'pointer', opacity: !newTagName.trim() ? 0.5 : 1
                                    }}
                                >
                                    Add
                                </button>
                            </div>

                            <button type="submit" disabled={uploadMutation.isPending || updatePDFMutation.isPending}
                                style={{
                                    backgroundColor: '#A076F9', color: 'white', border: 'none', padding: '10px 20px',
                                    borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: (uploadMutation.isPending || updatePDFMutation.isPending) ? 0.6 : 1
                                }}
                            >
                                <Upload size={16} />
                                {(uploadMutation.isPending || updatePDFMutation.isPending) ? 'Saving...' : (editingId ? 'Save Changes' : 'Upload PDF')}
                            </button>

                            {(uploadMutation.isError || updatePDFMutation.isError) && (
                                <p style={{ color: '#ff4d4d', margin: 0, fontSize: '14px' }}>
                                    Error: {JSON.stringify(
                                        uploadMutation.error?.response?.data || updatePDFMutation.error?.response?.data || 'Something went wrong'
                                    )}
                                </p>
                            )}
                        </form>
                    )}

                    {/* PDF List */}
                    {pdfsLoading ? (
                        <p style={{ color: '#aaa' }}>Loading PDFs... ⏳</p>
                    ) : pdfs?.length === 0 ? (
                        <p style={{ color: '#aaa' }}>No PDFs uploaded yet. Upload your first PDF! 📄</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pdfs?.map(pdf => (
                                <div key={pdf.id} style={{
                                    backgroundColor: '#2A2A2A', padding: '18px', borderRadius: '8px',
                                    border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '15px'
                                }}>
                                    {/* PDF Icon */}
                                    <div style={{
                                        width: '45px', height: '45px', borderRadius: '8px',
                                        backgroundColor: 'rgba(160, 118, 249, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <FileText size={22} style={{ color: '#A076F9' }} />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flexGrow: 1 }}>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                                            {pdf.is_favorite && '⭐ '}
                                            <a href={pdf.file} target="_blank" rel="noopener noreferrer"
                                                style={{ color: 'white', textDecoration: 'none' }}
                                                onMouseEnter={(e) => e.target.style.color = '#A076F9'}
                                                onMouseLeave={(e) => e.target.style.color = 'white'}
                                            >
                                                {pdf.title}
                                            </a>
                                        </h3>
                                        <div style={{ display: 'flex', gap: '15px', color: '#888', fontSize: '13px' }}>
                                            <span>{formatFileSize(pdf.file_size)}</span>
                                            {pdf.page_count && <span>{pdf.page_count} pages</span>}
                                            {pdf.category_detail && (
                                                <span style={{ color: '#A076F9' }}>{pdf.category_detail.name}</span>
                                            )}
                                        </div>
                                        {pdf.tags_detail?.length > 0 && (
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                {pdf.tags_detail.map(tag => (
                                                    <span key={tag.id} style={{
                                                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                                                        backgroundColor: 'rgba(160, 118, 249, 0.1)', color: '#A076F9',
                                                        border: '1px solid rgba(160, 118, 249, 0.3)'
                                                    }}>
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEditPDFClick(pdf)}
                                            style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: '5px' }}
                                            title="Edit PDF"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => updatePDFMutation.mutate({ 
                                                id: pdf.id, 
                                                pdfData: { is_favorite: !pdf.is_favorite } 
                                            })}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}
                                            title={pdf.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <Star size={18} fill={pdf.is_favorite ? '#FFD700' : 'none'} 
                                                style={{ color: pdf.is_favorite ? '#FFD700' : '#888' }} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this PDF?')) deletePDFMutation.mutate(pdf.id);
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}
                                            title="Delete PDF"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ==================== RESOURCES TAB ==================== */}
            {activeTab === 'resources' && (
                <>
                    {/* Create Form */}
                    {showForm && (
                        <form onSubmit={handleResourceSubmit} style={{
                            backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px',
                            marginBottom: '25px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px'
                        }}>
                            <h3 style={{ margin: 0, color: '#A076F9' }}>{editingId ? 'Edit Resource' : 'Add Resource'}</h3>

                            <input
                                type="text" placeholder="Resource Title" value={resTitle} required
                                onChange={(e) => setResTitle(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white' }}
                            />

                            <input
                                type="url" placeholder="https://..." value={resUrl} required
                                onChange={(e) => setResUrl(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white' }}
                            />

                            <textarea
                                placeholder="Description (optional)" value={resDescription} rows={3}
                                onChange={(e) => setResDescription(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white', fontFamily: 'inherit' }}
                            />

                            {/* Resource Type */}
                            <select value={resType} onChange={(e) => setResType(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white' }}
                            >
                                <option value="article">Article</option>
                                <option value="video">Video</option>
                                <option value="documentation">Documentation</option>
                                <option value="repository">Repository</option>
                                <option value="website">Website</option>
                                <option value="other">Other</option>
                            </select>

                            {/* Category */}
                            <select value={resCategory} onChange={(e) => setResCategory(e.target.value)}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2A2A2A', color: 'white' }}
                            >
                                <option value="">No Category</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

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
                                    disabled={!newCategoryName.trim()}
                                    style={{
                                        padding: '8px 12px', borderRadius: '4px', fontSize: '13px',
                                        border: 'none', backgroundColor: '#A076F9', color: 'white',
                                        cursor: 'pointer', opacity: !newCategoryName.trim() ? 0.5 : 1
                                    }}
                                >
                                    Add
                                </button>
                            </div>

                            {/* Tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {tags?.map(tag => {
                                    const isSelected = resTags.includes(tag.id);
                                    return (
                                        <button key={tag.id} type="button"
                                            onClick={() => {
                                                if (isSelected) setResTags(prev => prev.filter(id => id !== tag.id));
                                                else setResTags(prev => [...prev, tag.id]);
                                            }}
                                            style={{
                                                padding: '5px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                                                border: isSelected ? '1px solid #A076F9' : '1px solid #444',
                                                backgroundColor: isSelected ? 'rgba(160, 118, 249, 0.2)' : 'transparent',
                                                color: isSelected ? '#A076F9' : '#aaa',
                                            }}
                                        >
                                            {tag.name} {isSelected && '✓'}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Inline Create - New Tag */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
                                        if (newTagName.trim()) createTagMutation.mutate({ name: newTagName.trim() });
                                    }}
                                    disabled={!newTagName.trim()}
                                    style={{
                                        padding: '8px 12px', borderRadius: '4px', fontSize: '13px',
                                        border: 'none', backgroundColor: '#A076F9', color: 'white',
                                        cursor: 'pointer', opacity: !newTagName.trim() ? 0.5 : 1
                                    }}
                                >
                                    Add
                                </button>
                            </div>

                            <button type="submit" disabled={createResourceMutation.isPending || updateResourceMutation.isPending}
                                style={{
                                    backgroundColor: '#A076F9', color: 'white', border: 'none', padding: '10px 20px',
                                    borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start',
                                    opacity: (createResourceMutation.isPending || updateResourceMutation.isPending) ? 0.6 : 1
                                }}
                            >
                                {(createResourceMutation.isPending || updateResourceMutation.isPending) ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Resource')}
                            </button>
                            
                            {(createResourceMutation.isError || updateResourceMutation.isError) && (
                                <p style={{ color: '#ff4d4d', margin: 0, fontSize: '14px' }}>
                                    Error: {JSON.stringify(
                                        createResourceMutation.error?.response?.data || updateResourceMutation.error?.response?.data || 'Something went wrong'
                                    )}
                                </p>
                            )}
                        </form>
                    )}

                    {/* Resources List */}
                    {resourcesLoading ? (
                        <p style={{ color: '#aaa' }}>Loading resources... ⏳</p>
                    ) : resources?.length === 0 ? (
                        <p style={{ color: '#aaa' }}>No resources saved yet. Add your first resource! 🔗</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {resources?.map(res => (
                                <div key={res.id} style={{
                                    backgroundColor: '#2A2A2A', padding: '18px', borderRadius: '8px',
                                    border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '15px'
                                }}>
                                    {/* Type Icon */}
                                    <div style={{
                                        width: '45px', height: '45px', borderRadius: '8px',
                                        backgroundColor: 'rgba(160, 118, 249, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Link2 size={22} style={{ color: '#A076F9' }} />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flexGrow: 1 }}>
                                        <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '16px' }}>
                                            {res.is_favorite && '⭐ '}{res.title}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '15px', color: '#888', fontSize: '13px' }}>
                                            <span style={{
                                                padding: '1px 8px', borderRadius: '4px', fontSize: '12px',
                                                backgroundColor: '#333', color: '#ccc'
                                            }}>
                                                {res.resource_type}
                                            </span>
                                            {res.category_detail && (
                                                <span style={{ color: '#A076F9' }}>{res.category_detail.name}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEditResourceClick(res)}
                                            style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: '5px' }}
                                            title="Edit Resource"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <a href={res.url} target="_blank" rel="noopener noreferrer"
                                            style={{ color: '#A076F9', padding: '5px' }} title="Open Link"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                        <button
                                            onClick={() => updateResourceMutation.mutate({ 
                                                id: res.id, 
                                                resourceData: { is_favorite: !res.is_favorite } 
                                            })}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}
                                            title={res.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <Star size={18} fill={res.is_favorite ? '#FFD700' : 'none'} 
                                                style={{ color: res.is_favorite ? '#FFD700' : '#888' }} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this resource?')) deleteResourceMutation.mutate(res.id);
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}
                                            title="Delete Resource"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}