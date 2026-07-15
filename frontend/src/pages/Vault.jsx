import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPDFs, uploadPDF, updatePDF, deletePDF, fetchResources, createResource, updateResource, deleteResource } from '../api/vault';
import { fetchCategories, fetchTags, createCategory, createTag } from '../api/notes';
import { Plus, FileText, Link2 } from 'lucide-react';

import { DocumentCard } from '../components/vault/DocumentCard';
import { ResourceCard } from '../components/vault/ResourceCard';
import { UploadModal } from '../components/vault/UploadModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export default function Vault() {
    const queryClient = useQueryClient();
    
    // Tab and Modal states
    const [activeTab, setActiveTab] = useState('pdfs');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Filter states
    const [filterCategory, setFilterCategory] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [filterType, setFilterType] = useState('');
    const [filterFavorite, setFilterFavorite] = useState('');

    // Queries
    const pdfFilters = {};
    if (filterCategory) pdfFilters.category = filterCategory;
    if (filterTags.length > 0) pdfFilters.tags = filterTags.join(',');
    if (filterFavorite) pdfFilters.is_favorite = filterFavorite;

    const resourceFilters = { ...pdfFilters };
    if (filterType) resourceFilters.type = filterType;

    const { data: pdfs, isLoading: pdfsLoading } = useQuery({
        queryKey: ['pdfs', pdfFilters],
        queryFn: () => fetchPDFs(pdfFilters),
    });

    const { data: resources, isLoading: resourcesLoading } = useQuery({
        queryKey: ['resources', resourceFilters],
        queryFn: () => fetchResources(resourceFilters),
    });

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
    const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags });

    // Mutations
    const uploadMutation = useMutation({
        mutationFn: uploadPDF,
        onSuccess: () => { queryClient.invalidateQueries(['pdfs']); setIsModalOpen(false); setEditingItem(null); },
    });
    const updatePDFMutation = useMutation({
        mutationFn: updatePDF,
        onSuccess: () => { queryClient.invalidateQueries(['pdfs']); setIsModalOpen(false); setEditingItem(null); },
    });
    const deletePDFMutation = useMutation({
        mutationFn: deletePDF,
        onSuccess: () => queryClient.invalidateQueries(['pdfs']),
    });

    const createResourceMutation = useMutation({
        mutationFn: createResource,
        onSuccess: () => { queryClient.invalidateQueries(['resources']); setIsModalOpen(false); setEditingItem(null); },
    });
    const updateResourceMutation = useMutation({
        mutationFn: updateResource,
        onSuccess: () => { queryClient.invalidateQueries(['resources']); setIsModalOpen(false); setEditingItem(null); },
    });
    const deleteResourceMutation = useMutation({
        mutationFn: deleteResource,
        onSuccess: () => queryClient.invalidateQueries(['resources']),
    });

    const createCategoryMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => queryClient.invalidateQueries(['categories']),
    });
    const createTagMutation = useMutation({
        mutationFn: createTag,
        onSuccess: () => queryClient.invalidateQueries(['tags']),
    });

    // Handlers
    const handleEditClick = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Knowledge Vault</h1>
                <Button 
                    onClick={handleOpenCreateModal} 
                    icon={<Plus size={18} />}
                >
                    {activeTab === 'pdfs' ? 'Upload PDF' : 'Add Resource'}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 mb-6">
                <button
                    onClick={() => { setActiveTab('pdfs'); setFilterType(''); }}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'pdfs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <FileText size={16} /> PDFs
                </button>
                <button
                    onClick={() => setActiveTab('resources')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'resources' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <Link2 size={16} /> Resources
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-9 px-3 rounded-md bg-gray-900 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Categories</option>
                    {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>

                {activeTab === 'resources' && (
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-9 px-3 rounded-md bg-gray-900 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
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

                <select 
                    value={filterFavorite} 
                    onChange={(e) => setFilterFavorite(e.target.value)}
                    className="h-9 px-3 rounded-md bg-gray-900 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                >
                    <option value=""> All </option>
                    <option value="true">⭐ Favorites</option>
                    <option value="false">Not Favorites</option>
                </select>

                {tags?.map(tag => {
                    const isActive = filterTags.includes(tag.id);
                    return (
                        <button key={tag.id} onClick={() => {
                            if (isActive) setFilterTags(prev => prev.filter(id => id !== tag.id));
                            else setFilterTags(prev => [...prev, tag.id]);
                        }}>
                            <Badge variant={isActive ? 'primary' : 'outline'}>{tag.name}</Badge>
                        </button>
                    );
                })}

                {(filterCategory || filterTags.length > 0 || filterType || filterFavorite) && (
                    <button 
                        onClick={() => { setFilterCategory(''); setFilterTags([]); setFilterType(''); setFilterFavorite(''); }}
                        className="text-sm text-red-400 hover:text-red-300 ml-auto"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'pdfs' ? (
                    pdfsLoading ? <p className="text-gray-400">Loading PDFs...</p> :
                    pdfs?.length === 0 ? (
                        <EmptyState 
                            icon={<FileText size={32} />} 
                            title="No PDFs Uploaded" 
                            description="Upload research papers, assignments, or study materials to your vault."
                            action={<Button onClick={handleOpenCreateModal}>Upload PDF</Button>}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pdfs?.map(pdf => (
                                <DocumentCard 
                                    key={pdf.id}
                                    document={pdf}
                                    onEdit={handleEditClick}
                                    onToggleFavorite={(doc) => updatePDFMutation.mutate({ id: doc.id, pdfData: { is_favorite: !doc.is_favorite }})}
                                    onDelete={(id) => { if (window.confirm('Delete this PDF?')) deletePDFMutation.mutate(id); }}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    resourcesLoading ? <p className="text-gray-400">Loading Resources...</p> :
                    resources?.length === 0 ? (
                        <EmptyState 
                            icon={<Link2 size={32} />} 
                            title="No Resources Added" 
                            description="Save important links, articles, and documentation videos."
                            action={<Button onClick={handleOpenCreateModal}>Add Resource</Button>}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resources?.map(res => (
                                <ResourceCard 
                                    key={res.id}
                                    resource={res}
                                    onEdit={handleEditClick}
                                    onToggleFavorite={(r) => updateResourceMutation.mutate({ id: r.id, resourceData: { is_favorite: !r.is_favorite }})}
                                    onDelete={(id) => { if (window.confirm('Delete this resource?')) deleteResourceMutation.mutate(id); }}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Centralized Modal */}
            <UploadModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                activeTab={activeTab}
                editingItem={editingItem}
                categories={categories}
                tags={tags}
                isPending={uploadMutation.isPending || updatePDFMutation.isPending || createResourceMutation.isPending || updateResourceMutation.isPending}
                onSubmitPDF={(formData) => {
                    if (editingItem) updatePDFMutation.mutate({ id: editingItem.id, pdfData: formData });
                    else uploadMutation.mutate(formData);
                }}
                onSubmitResource={(data) => {
                    if (editingItem) updateResourceMutation.mutate({ id: editingItem.id, resourceData: data });
                    else createResourceMutation.mutate(data);
                }}
                createCategoryMutation={createCategoryMutation}
                createTagMutation={createTagMutation}
            />
        </div>
    );
}