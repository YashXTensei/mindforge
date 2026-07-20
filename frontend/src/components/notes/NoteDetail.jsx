import { Calendar, Folder, Tag, FileText, Pin, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Badge } from '../ui/Badge';

function InfoRow({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-3 py-2.5">
            <Icon size={15} className="text-gray-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
                <div className="text-gray-200 text-sm mt-0.5">{children}</div>
            </div>
        </div>
    );
}

export function NoteDetail({ note }) {
    if (!note) return null;

    return (
        <div className="space-y-4">
            {/* Pin indicator */}
            {note.is_pinned && (
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium bg-amber-400/10 px-3 py-2 rounded-lg">
                    <Pin size={14} />
                    <span>Pinned Note</span>
                </div>
            )}

            {/* Metadata Section */}
            <div className="divide-y divide-border">
                {note.category_detail && (
                    <InfoRow icon={Folder} label="Category">
                        <span className="text-accent">{note.category_detail.name}</span>
                    </InfoRow>
                )}

                {note.tags_detail?.length > 0 && (
                    <InfoRow icon={Tag} label="Tags">
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {note.tags_detail.map(tag => (
                                <Badge key={tag.id} variant="primary">{tag.name}</Badge>
                            ))}
                        </div>
                    </InfoRow>
                )}

                <InfoRow icon={Calendar} label="Created">
                    {new Date(note.created_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                </InfoRow>

                <InfoRow icon={Clock} label="Updated">
                    {new Date(note.updated_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                </InfoRow>
            </div>

            {/* Content Preview */}
            <div>
                <div className="flex items-center gap-2 mb-3 mt-2">
                    <FileText size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Preview</span>
                </div>
                <div className="bg-surface-card rounded-lg p-4 border border-border text-gray-300 text-sm leading-relaxed max-h-[400px] overflow-y-auto prose prose-invert prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {note.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
