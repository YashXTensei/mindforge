import { Pencil, Trash2, Sparkles, Clock, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

function AiBadge({ status }) {
    if (status === 'completed') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Sparkles size={10} /> AI Ready
            </span>
        );
    }
    if (status === 'pending' || status === 'extracting' || status === 'chunking' || status === 'embedding') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse">
                <Clock size={10} /> Processing
            </span>
        );
    }
    return null;
}

export function NoteCard({ note, onEdit, onDelete, onNavigate, isDeleting, isSelected }) {
    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div 
            onClick={() => onNavigate(note.id)}
            className={`group bg-surface-card rounded-xl border flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 hover:border-accent/50
                ${isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border'}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-0">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {note.is_pinned && <span className="text-sm">📌</span>}
                        <Link 
                            to={`/notes/${note.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="no-underline group/title"
                        >
                            <h3 className="m-0 text-white text-base font-semibold group-hover/title:text-accent transition-colors truncate">
                                {note.title}
                            </h3>
                        </Link>
                    </div>

                    {/* Meta Row: Category + AI Badge + Time */}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        {note.category_detail && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/20">
                                <FolderOpen size={10} /> {note.category_detail.name}
                            </span>
                        )}
                        <AiBadge status={note.processing_status} />
                        <span className="text-[10px] text-gray-600 ml-auto">
                            {timeAgo(note.updated_at)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                        className="bg-transparent border-none text-gray-500 cursor-pointer p-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit Note"
                    >
                        <Pencil size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                        disabled={isDeleting}
                        className="bg-transparent border-none text-gray-500 cursor-pointer p-1.5 rounded-md hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Delete Note"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content Preview */}
            {note.content && (
                <div className="px-4 pt-2 pb-3">
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 m-0">
                        {note.content.replace(/[#*`>\-\[\]]/g, '').substring(0, 150)}
                    </p>
                </div>
            )}

            {/* Tags Footer */}
            {note.tags_detail?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap px-4 pb-3">
                    {note.tags_detail.map(tag => (
                        <span key={tag.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800 text-gray-400 border border-gray-700/50">
                            #{tag.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
