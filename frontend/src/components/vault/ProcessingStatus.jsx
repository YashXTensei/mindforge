import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

const DEBUG_PIPELINE = import.meta.env.VITE_DEBUG_PIPELINE === 'true';

const STATUS_MAP = {
    pending:    { label: 'Queued',        emoji: '📄' },
    extracting: { label: 'Extracting',    emoji: '⚙️' },
    chunking:   { label: 'Chunking',      emoji: '🧩' },
    embedding:  { label: 'Embedding',     emoji: '🧠' },
};

function formatDuration(uploadedAt, completedAt) {
    if (!uploadedAt || !completedAt) return null;
    const diff = (new Date(completedAt) - new Date(uploadedAt)) / 1000;
    if (diff < 60) return `${diff.toFixed(1)}s`;
    return `${Math.floor(diff / 60)}m ${Math.round(diff % 60)}s`;
}

export function ProcessingStatus({ status, createdAt, processedAt }) {
    // Completed
    if (status === 'completed' && processedAt) {
        const duration = formatDuration(createdAt, processedAt);
        return (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <Check size={11} />
                Ready {duration && `(${duration})`}
            </span>
        );
    }

    // Failed
    if (status === 'failed') {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
                <AlertCircle size={11} />
                Failed
            </span>
        );
    }

    // Processing states
    const step = STATUS_MAP[status];
    if (!step) return null;

    // Production: simple
    if (!DEBUG_PIPELINE) {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] text-purple-300 font-medium">
                <Loader2 size={11} className="animate-spin" />
                Processing...
            </span>
        );
    }

    // Dev: show current step name
    return (
        <span className="inline-flex items-center gap-1 text-[11px] text-purple-300 font-medium">
            <Loader2 size={11} className="animate-spin" />
            {step.emoji} {step.label}...
        </span>
    );
}
