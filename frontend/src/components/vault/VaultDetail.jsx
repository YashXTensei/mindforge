import { Calendar, Folder, Tag, FileText, ExternalLink, Clock, HardDrive } from 'lucide-react';
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

function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function DocumentDetail({ document: doc }) {
    if (!doc) return null;

    const isImage = doc.file?.match(/\.(jpeg|jpg|png|webp)$/i);

    return (
        <div className="space-y-4">
            {/* Image Thumbnail Preview */}
            {isImage && (
                <div className="rounded-lg overflow-hidden border border-border">
                    <img 
                        src={doc.file} 
                        alt={doc.title} 
                        className="w-full h-48 object-cover"
                    />
                </div>
            )}

            {/* Favorite indicator */}
            {doc.is_favorite && (
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium bg-amber-400/10 px-3 py-2 rounded-lg">
                    ⭐ <span>Favorite Document</span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
                <a
                    href={doc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                    <ExternalLink size={14} /> Open File
                </a>
            </div>

            {/* File Size + Category — same line */}
            <div className="flex items-center gap-3 text-sm py-2 border-b border-border">
                <HardDrive size={14} className="text-gray-500 shrink-0" />
                <span className="text-gray-200">{formatFileSize(doc.file_size)}</span>
                {doc.page_count && (
                    <>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-300">{doc.page_count} pages</span>
                    </>
                )}
                {doc.category_detail && (
                    <>
                        <span className="text-gray-600">·</span>
                        <Folder size={14} className="text-gray-500 shrink-0" />
                        <span className="text-accent">{doc.category_detail.name}</span>
                    </>
                )}
            </div>

            {/* Tags */}
            {doc.tags_detail?.length > 0 && (
                <InfoRow icon={Tag} label="Tags">
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {doc.tags_detail.map(tag => (
                            <Badge key={tag.id} variant="primary">{tag.name}</Badge>
                        ))}
                    </div>
                </InfoRow>
            )}

            {/* Description */}
            {doc.description && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Description</span>
                    </div>
                    <div className="bg-surface-card rounded-lg p-4 border border-border text-gray-300 text-sm leading-relaxed">
                        {doc.description}
                    </div>
                </div>
            )}

            {/* Dates */}
            <div className="divide-y divide-border">
                <InfoRow icon={Calendar} label="Uploaded">
                    {new Date(doc.created_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                </InfoRow>

                <InfoRow icon={Clock} label="Updated">
                    {new Date(doc.updated_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                </InfoRow>
            </div>
        </div>
    );
}

export function ResourceDetail({ resource: res }) {
    if (!res) return null;

    return (
        <div className="space-y-4">
            {/* Favorite indicator */}
            {res.is_favorite && (
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium bg-amber-400/10 px-3 py-2 rounded-lg">
                    ⭐ <span>Favorite Resource</span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
                <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                    <ExternalLink size={14} /> Open Link
                </a>
            </div>

            {/* URL Display */}
            <div className="bg-surface-card rounded-lg px-3 py-2 border border-border">
                <span className="text-xs text-gray-500 block mb-1">URL</span>
                <span className="text-gray-300 text-sm break-all">{res.url}</span>
            </div>

            {/* Type + Category — same line */}
            <div className="flex items-center gap-3 text-sm py-2 border-b border-border">
                <FileText size={14} className="text-gray-500 shrink-0" />
                <span className="px-2 py-0.5 rounded-md bg-gray-700 text-gray-300 text-xs capitalize">
                    {res.resource_type}
                </span>
                {res.category_detail && (
                    <>
                        <span className="text-gray-600">·</span>
                        <Folder size={14} className="text-gray-500 shrink-0" />
                        <span className="text-accent">{res.category_detail.name}</span>
                    </>
                )}
            </div>

            {/* Tags */}
            {res.tags_detail?.length > 0 && (
                <InfoRow icon={Tag} label="Tags">
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {res.tags_detail.map(tag => (
                            <Badge key={tag.id} variant="primary">{tag.name}</Badge>
                        ))}
                    </div>
                </InfoRow>
            )}

            {/* Description */}
            {res.description && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Description</span>
                    </div>
                    <div className="bg-surface-card rounded-lg p-4 border border-border text-gray-300 text-sm leading-relaxed">
                        {res.description}
                    </div>
                </div>
            )}

            {/* Dates */}
            <div className="divide-y divide-border">
                <InfoRow icon={Calendar} label="Added">
                    {new Date(res.created_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                </InfoRow>

                <InfoRow icon={Clock} label="Updated">
                    {new Date(res.updated_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                </InfoRow>
            </div>
        </div>
    );
}
