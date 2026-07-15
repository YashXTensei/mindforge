import React from 'react';
import { Link2, Pencil, Star, Trash2, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function ResourceCard({ 
  resource, 
  onEdit, 
  onToggleFavorite, 
  onDelete 
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors group">
      
      {/* Icon Placeholder */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        <Link2 size={24} />
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-gray-100 truncate">
          {resource.is_favorite && <span className="mr-1">⭐</span>}
          {resource.title}
        </h3>
        
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
          <span className="px-2 py-0.5 rounded-md bg-gray-700 text-gray-300 text-xs">
            {resource.resource_type}
          </span>
          {resource.category_detail && (
            <span className="text-purple-400">{resource.category_detail.name}</span>
          )}
        </div>

        {/* Tags mapping using the new Badge component */}
        {resource.tags_detail?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {resource.tags_detail.map(tag => (
              <Badge key={tag.id} variant="primary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(resource)} className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
          <Pencil size={16} />
        </button>
        <a 
          href={resource.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-purple-400 rounded-md hover:bg-gray-700"
        >
          <ExternalLink size={16} />
        </a>
        <button onClick={() => onToggleFavorite(resource)} className="p-2 text-gray-400 hover:text-yellow-500 rounded-md hover:bg-gray-700">
          <Star size={16} fill={resource.is_favorite ? '#EAB308' : 'none'} className={resource.is_favorite ? 'text-yellow-500' : ''} />
        </button>
        <button onClick={() => onDelete(resource.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-700">
          <Trash2 size={16} />
        </button>
      </div>

    </div>
  );
}