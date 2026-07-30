import React from 'react';
import { FileText, Image as ImageIcon, Pencil, Star, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ProcessingStatus } from './ProcessingStatus';

// Helper: bytes → human readable
function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function DocumentCard({ 
  document, 
  onEdit, 
  onToggleFavorite, 
  onDelete,
  onSelect,
  isSelected
}) {
  // Determine if it's an image
  const isImage = document.file?.match(/\.(jpeg|jpg|png|webp)$/i);

  return (
    <div 
      onClick={onSelect}
      className={`relative flex items-center gap-4 p-4 bg-gray-800/50 border rounded-lg hover:bg-gray-800 transition-colors group cursor-pointer ${isSelected ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/20' : 'border-gray-700'}`}
    >
      
      {/* Icon Placeholder or Image Thumbnail */}
      {isImage ? (
        <img 
          src={document.file} 
          alt={document.title} 
          className="h-12 w-12 shrink-0 object-cover rounded-lg border border-gray-700" 
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
          <FileText size={24} />
        </div>
      )}

      {/* Info Section */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-gray-100 truncate">
          {document.is_favorite && <span className="mr-1">⭐</span>}
          <a 
            href={document.file} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-purple-400 transition-colors"
          >
            {document.title}
          </a>
        </h3>
        
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
          <span>{formatFileSize(document.file_size)}</span>
          {document.page_count && <span>{document.page_count} pages</span>}
          {document.category_detail && (
            <span className="text-purple-400">{document.category_detail.name}</span>
          )}
        </div>

        {/* Tags mapping using the new Badge component */}
        {document.tags_detail?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {document.tags_detail.map(tag => (
              <Badge key={tag.id} variant="primary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions (Visible on hover using Tailwind's 'group-hover') — stopPropagation prevents preview from opening */}
      <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(document); }} className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
          <Pencil size={16} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(document); }} className="p-2 text-gray-400 hover:text-yellow-500 rounded-md hover:bg-gray-700">
          <Star size={16} fill={document.is_favorite ? '#EAB308' : 'none'} className={document.is_favorite ? 'text-yellow-500' : ''} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(document.id); }} className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-700">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Processing Status — bottom right corner */}
      <div className="absolute bottom-2 right-3">
        <ProcessingStatus 
          status={document.processing_status}
          createdAt={document.created_at}
          processedAt={document.processed_at}
        />
      </div>

    </div>
  );
}