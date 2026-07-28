import { Pencil, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Link } from 'react-router-dom';

export function NoteCard({ note, onEdit, onDelete, onNavigate, isDeleting, isSelected }) {
    return (
        <div 
            onClick={() => onNavigate(note.id)}
            className={`bg-surface-card p-5 rounded-lg border flex justify-between items-start cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-accent ${isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border'}`}
        >
            <div className="flex-grow">
                <Link 
                    to={`/notes/${note.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="no-underline group"
                >
                    <h3 className="m-0 mb-2.5 text-white group-hover:text-accent transition-colors">
                        {note.is_pinned && '📌 '} {note.title}
                    </h3>
                </Link>
                <div className="text-gray-400 text-sm mt-3 line-clamp-3 leading-relaxed prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {note.content}
                    </ReactMarkdown>
                </div>
            </div>
            
            {/* Action Buttons Container */}
            <div className="flex gap-2.5 ml-4">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                    className="bg-transparent border-none text-gray-400 cursor-pointer p-1.5 hover:text-white"
                    title="Edit Note"
                >
                    <Pencil size={18} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                    disabled={isDeleting}
                    className="bg-transparent border-none text-red-400 cursor-pointer p-1.5 hover:text-red-500 disabled:opacity-50"
                    title="Delete Note"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
