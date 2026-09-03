import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export function UploadModal({ 
  isOpen, 
  onClose, 
  activeTab, 
  editingItem, 
  categories, 
  tags,
  onSubmitDocument,
  onSubmitResource,
  isPending,
  createCategoryMutation,
  createTagMutation
}) {
  // Shared
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Document specific
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractTopics, setExtractTopics] = useState(true);
  
  // Resource specific
  const [url, setUrl] = useState('');
  const [resourceType, setResourceType] = useState('other');

  // Inline creation
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setTitle(editingItem.title || '');
        setDescription(editingItem.description || '');
        setCategory(editingItem.category || '');
        setSelectedTags(editingItem.tags_detail?.map(t => t.id) || []);
        
        if (activeTab === 'documents') {
          setSelectedFile(null); // Force re-upload if they want to change file
          setExtractTopics(editingItem.extract_topics ?? true);
        } else {
          setUrl(editingItem.url || '');
          setResourceType(editingItem.resource_type || 'other');
        }
      } else {
        // Reset everything
        setTitle('');
        setDescription('');
        setCategory('');
        setSelectedTags([]);
        setSelectedFile(null);
        setExtractTopics(true);
        setUrl('');
        setResourceType('other');
      }
    }
  }, [isOpen, editingItem, activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'documents') {
      const formData = new FormData();
      formData.append('title', title);
      if (selectedFile) formData.append('file', selectedFile);
      if (description) formData.append('description', description);
      if (category) formData.append('category', category);
      formData.append('extract_topics', extractTopics);
      selectedTags.forEach(tagId => formData.append('tags', tagId));
      onSubmitDocument(formData); 
    } else {
      const data = { 
        title, 
        url, 
        resource_type: resourceType, 
        description, 
        category: category || null, 
        tags: selectedTags 
      };
      onSubmitResource(data);
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate({ name: newCategoryName.trim() }, {
        onSuccess: (data) => {
          setCategory(data.id);
          setNewCategoryName('');
        }
      });
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate({ name: newTagName.trim() }, {
        onSuccess: (data) => {
          setSelectedTags(prev => [...prev, data.id]);
          setNewTagName('');
        }
      });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingItem ? `Edit ${activeTab === 'documents' ? 'Document' : 'Resource'}` : `Add ${activeTab === 'documents' ? 'Document' : 'Resource'}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <Input 
          label="Title" 
          placeholder="Enter title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
        />
        
        {activeTab === 'resources' && (
           <Input 
             type="url" 
             label="URL" 
             placeholder="https://..." 
             value={url}
             onChange={(e) => setUrl(e.target.value)}
             required
           />
        )}

        {/* Description */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium text-gray-300">Description</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* File Input for Document */}
        {activeTab === 'documents' && (
          <>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-gray-300">File</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                required={!editingItem}
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600/10 file:text-purple-400 hover:file:bg-purple-600/20"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="extractTopics" 
                checked={extractTopics}
                onChange={(e) => setExtractTopics(e.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
              />
              <label htmlFor="extractTopics" className="text-sm text-gray-300">
                Extract topics for Spaced Repetition (Study Material)
              </label>
            </div>
          </>
        )}

        {/* Resource Type */}
        {activeTab === 'resources' && (
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-gray-300">Type</label>
            <select 
              value={resourceType} 
              onChange={(e) => setResourceType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="documentation">Documentation</option>
              <option value="repository">Repository</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Category */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium text-gray-300">Category</label>
          <div className="flex gap-2">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            >
              <option value="">No Category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-1">
             <Input 
               placeholder="+ New category name..." 
               value={newCategoryName}
               onChange={(e) => setNewCategoryName(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
             />
             <Button type="button" variant="secondary" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>Add</Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium text-gray-300">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags?.map(tag => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) setSelectedTags(prev => prev.filter(id => id !== tag.id));
                    else setSelectedTags(prev => [...prev, tag.id]);
                  }}
                >
                  <Badge variant={isSelected ? 'primary' : 'outline'}>
                    {tag.name} {isSelected && '✓'}
                  </Badge>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
             <Input 
               placeholder="+ New tag name..." 
               value={newTagName}
               onChange={(e) => setNewTagName(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }}
             />
             <Button type="button" variant="secondary" onClick={handleCreateTag} disabled={!newTagName.trim()}>Add</Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isPending} icon={!isPending && <Upload size={16} />}>
            {editingItem ? 'Save Changes' : 'Upload'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}