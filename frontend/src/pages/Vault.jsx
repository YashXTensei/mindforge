import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocuments, uploadDocument, updateDocument, deleteDocument, fetchResources, createResource, updateResource, deleteResource } from '../api/vault';
import { fetchCategories, fetchTags, createCategory, createTag } from '../api/notes';
import { Plus, FileText, Link2 } from 'lucide-react';

import { DocumentCard } from '../components/vault/DocumentCard';
import { ResourceCard } from '../components/vault/ResourceCard';
import { UploadModal } from '../components/vault/UploadModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { DetailPanel } from '../components/ui/DetailPanel';
import { DocumentDetail, ResourceDetail } from '../components/vault/VaultDetail';

import toast from 'react-hot-toast';

export default function Vault() {
    const queryClient = useQueryClient();
    
    // Tab and Modal states
    const [activeTab, setActiveTab] = useState('documents');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Filter states
    const [filterCategory, setFilterCategory] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [filterType, setFilterType] = useState('');
    const [filterFavorite, setFilterFavorite] = useState('');

    // Queries
    const documentFilters = {};
    if (filterCategory) documentFilters.category = filterCategory;
    if (filterTags.length > 0) documentFilters.tags = filterTags.join(',');
    if (filterFavorite) documentFilters.is_favorite = filterFavorite;

    const resourceFilters = { ...documentFilters };
    if (filterType) resourceFilters.type = filterType;

    const { data: documents, isLoading: documentsLoading } = useQuery({
        queryKey: ['documents', documentFilters],
        queryFn: () => fetchDocuments(documentFilters),
        // Auto-poll every 3s while any document is still processing
        refetchInterval: (query) => {
            const docs = query.state.data;
            if (!docs) return false;
            const isProcessing = docs.some(d => 
                d.processing_status && 
                !['completed', 'failed'].includes(d.processing_status)
            );
            return isProcessing ? 3000 : false;
        },
    });

    const { data: resources, isLoading: resourcesLoading } = useQuery({
        queryKey: ['resources', resourceFilters],
        queryFn: () => fetchResources(resourceFilters),
    });

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
    const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags });

    // Mutations
    const uploadMutation = useMutation({
        mutationFn: uploadDocument,
        onSuccess: () => { queryClient.invalidateQueries(['documents']); setIsModalOpen(false); setEditingItem(null); },
    });
    const updateDocumentMutation = useMutation({
        mutationFn: updateDocument,
        onSuccess: () => { queryClient.invalidateQueries(['documents']); setIsModalOpen(false); setEditingItem(null); },
    });
    const deleteDocumentMutation = useMutation({
        mutationFn: deleteDocument,
        onSuccess: () => queryClient.invalidateQueries(['documents']),
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
        <div className="flex h-full gap-0 animate-fade-in">
            {/* Left: Main Vault Area */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">Knowledge Vault</h1>
                    <Button 
                        onClick={handleOpenCreateModal} 
                        icon={<Plus size={18} />}
                    >
                        {activeTab === 'documents' ? 'Upload Document' : 'Add Resource'}
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 mb-6">
                    <button
                        onClick={() => { setActiveTab('documents'); setFilterType(''); setSelectedItem(null); }}
                        className={`flex items-center gap-2 px-6 py-3 text-base font-medium transition-colors border-b-2 ${
                            activeTab === 'documents' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <FileText size={16} /> Documents
                    </button>
                    <button
                        onClick={() => { setActiveTab('resources'); setSelectedItem(null); }}
                        className={`flex items-center gap-2 px-6 py-3 text-base font-medium transition-colors border-b-2 ${
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
                        className="h-10 px-3 rounded-md bg-gray-900 border border-gray-700 text-sm text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                    >
                        <option value="">All Categories</option>
                        {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>

                    {activeTab === 'resources' && (
                        <select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            className="h-10 px-3 rounded-md bg-gray-900 border border-gray-700 text-sm text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
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
                        className="h-10 px-3 rounded-md bg-gray-900 border border-gray-700 text-sm text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
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
                    {activeTab === 'documents' ? (
                        documentsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
                            </div>
                        ) :
                        documents?.length === 0 ? (
                            <EmptyState 
                                icon={<FileText size={32} />} 
                                title="No Documents Uploaded" 
                                description="Upload research papers, assignments, images, or study materials to your vault."
                                action={<Button onClick={handleOpenCreateModal}>Upload Document</Button>}
                            />
                        ) : (
                            <div className={`grid grid-cols-1 ${selectedItem ? 'md:grid-cols-1 lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
                                {documents?.map(doc => (
                                    <DocumentCard 
                                        key={doc.id}
                                        document={doc}
                                        onEdit={handleEditClick}
                                        onToggleFavorite={(d) => updateDocumentMutation.mutate({ id: d.id, documentData: { is_favorite: !d.is_favorite }})}
                                        onDelete={(id) => { 
                                            if (window.confirm('Delete this Document?')) {
                                                toast.promise(
                                                    deleteDocumentMutation.mutateAsync(id),
                                                    { loading: 'Deleting document...', success: 'Document deleted!', error: 'Failed to delete.' }
                                                );
                                            } 
                                        }}
                                        onSelect={() => setSelectedItem(prev => prev?.id === doc.id ? null : { ...doc, _type: 'document' })}
                                        isSelected={selectedItem?.id === doc.id}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        resourcesLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
                            </div>
                        ) :
                        resources?.length === 0 ? (
                            <EmptyState 
                                icon={<Link2 size={32} />} 
                                title="No Resources Added" 
                                description="Save important links, articles, and documentation videos."
                                action={<Button onClick={handleOpenCreateModal}>Add Resource</Button>}
                            />
                        ) : (
                            <div className={`grid grid-cols-1 ${selectedItem ? 'md:grid-cols-1 lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
                                {resources?.map(res => (
                                    <ResourceCard 
                                        key={res.id}
                                        resource={res}
                                        onEdit={handleEditClick}
                                        onToggleFavorite={(r) => updateResourceMutation.mutate({ id: r.id, resourceData: { is_favorite: !r.is_favorite }})}
                                        onDelete={(id) => { 
                                            if (window.confirm('Delete this resource?')) {
                                                toast.promise(
                                                    deleteResourceMutation.mutateAsync(id),
                                                    { loading: 'Deleting resource...', success: 'Resource deleted!', error: 'Failed to delete.' }
                                                );
                                            } 
                                        }}
                                        onSelect={() => setSelectedItem(prev => prev?.id === res.id ? null : { ...res, _type: 'resource' })}
                                        isSelected={selectedItem?.id === res.id}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Right: Detail Panel */}
            <DetailPanel
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={selectedItem?.title || ''}
            >
                {selectedItem?._type === 'document' ? (
                    <DocumentDetail document={selectedItem} />
                ) : (
                    <ResourceDetail resource={selectedItem} />
                )}
            </DetailPanel>

            {/* Centralized Modal */}
            <UploadModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                activeTab={activeTab}
                editingItem={editingItem}
                categories={categories}
                tags={tags}
                isPending={uploadMutation.isPending || updateDocumentMutation.isPending || createResourceMutation.isPending || updateResourceMutation.isPending}
                onSubmitDocument={(formData) => {
                    if (editingItem) {
                        toast.promise(
                            updateDocumentMutation.mutateAsync({ id: editingItem.id, documentData: formData }),
                            { loading: 'Updating document...', success: 'Document updated!', error: 'Failed to update document.' }
                        );
                    } else {
                        toast.promise(
                            uploadMutation.mutateAsync(formData),
                            { loading: 'Uploading document...', success: 'Document uploaded successfully!', error: 'Failed to upload document.' }
                        );
                    }
                }}
                onSubmitResource={(data) => {
                    if (editingItem) {
                        toast.promise(
                            updateResourceMutation.mutateAsync({ id: editingItem.id, resourceData: data }),
                            { loading: 'Updating resource...', success: 'Resource updated!', error: 'Failed to update resource.' }
                        );
                    } else {
                        toast.promise(
                            createResourceMutation.mutateAsync(data),
                            { loading: 'Saving resource...', success: 'Resource saved successfully!', error: 'Failed to save resource.' }
                        );
                    }
                }}
                createCategoryMutation={createCategoryMutation}
                createTagMutation={createTagMutation}
            />
        </div>
    );
}