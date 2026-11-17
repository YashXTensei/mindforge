import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContradictions, resolveContradiction } from '../api/intelligence';
import { 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    FileText, 
    Sparkles, 
    Scale, 
    Loader2, 
    ArrowRight, 
    ChevronDown, 
    ChevronUp,
    ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const getSeverityBadge = (severity) => {
    switch (severity) {
        case 'high':
            return (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                    <ShieldAlert size={12} /> High Severity
                </span>
            );
        case 'medium':
            return (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <AlertTriangle size={12} /> Medium
                </span>
            );
        default:
            return (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Sparkles size={12} /> Minor
                </span>
            );
    }
};

export default function Contradictions() {
    const [filter, setFilter] = useState('unresolved'); // 'all', 'unresolved', 'resolved'
    const [resolvingId, setResolvingId] = useState(null);
    const [resolveNotes, setResolveNotes] = useState({});
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['contradictions', filter],
        queryFn: () => fetchContradictions(filter === 'all' ? null : filter),
    });

    const contradictions = Array.isArray(data) ? data : data?.results || [];

    const resolveMutation = useMutation({
        mutationFn: ({ id, note }) => resolveContradiction(id, note),
        onSuccess: () => {
            toast.success("Conflict marked as resolved!");
            setResolvingId(null);
            queryClient.invalidateQueries({ queryKey: ['contradictions'] });
            queryClient.invalidateQueries({ queryKey: ['intelligenceStats'] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.error || "Failed to resolve conflict");
        }
    });

    const handleResolveSubmit = (id) => {
        const note = resolveNotes[id] || '';
        resolveMutation.mutate({ id, note });
    };

    const unresolvedCount = contradictions.filter(c => !c.is_resolved).length;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fade-in text-white">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
                        <Scale size={28} className="text-purple-400" />
                        Contradiction Radar
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base">
                        MindForge AI automatically detects factual conflicts across your study documents and notes.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-gray-800 self-start sm:self-auto">
                    <button
                        onClick={() => setFilter('unresolved')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            filter === 'unresolved'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Unresolved {unresolvedCount > 0 && `(${unresolvedCount})`}
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            filter === 'resolved'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Resolved
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            filter === 'all'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {/* Content States */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 size={36} className="animate-spin text-purple-400 mb-3" />
                    <p className="text-sm">Scanning knowledge vault for contradictions...</p>
                </div>
            ) : isError ? (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <p className="font-medium">Failed to load contradictions</p>
                    <p className="text-xs text-red-300 mt-1">{error?.message || "Please try again later"}</p>
                </div>
            ) : contradictions.length === 0 ? (
                <div className="text-center py-16 px-4 bg-gray-900/40 rounded-2xl border border-gray-800">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                        {filter === 'resolved' ? 'No Resolved Conflicts Yet' : 'No Contradictions Detected!'}
                    </h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto">
                        {filter === 'resolved'
                            ? 'Resolved contradictions will appear here once you reconcile them.'
                            : 'All facts across your uploaded documents and notes are currently consistent and coherent.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {contradictions.map((item) => {
                        const isExpanded = resolvingId === item.id;
                        return (
                            <div
                                key={item.id}
                                className={`rounded-2xl border transition-all ${
                                    item.is_resolved
                                        ? 'bg-gray-900/30 border-gray-800/80 opacity-80'
                                        : 'bg-gray-900/60 border-purple-900/30 shadow-lg shadow-purple-950/10'
                                } p-5 sm:p-6`}
                            >
                                {/* Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-800">
                                    <div className="flex items-center gap-2">
                                        {getSeverityBadge(item.severity)}
                                        {item.is_resolved && (
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Resolved
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500 flex items-center gap-1 ml-1">
                                            <Clock size={12} />
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {!item.is_resolved && (
                                        <button
                                            onClick={() => setResolvingId(isExpanded ? null : item.id)}
                                            className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                                        >
                                            {isExpanded ? (
                                                <>Cancel <ChevronUp size={14} /></>
                                            ) : (
                                                <>Resolve Conflict <ChevronDown size={14} /></>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Comparison Grid: Claim A vs Claim B */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Claim A */}
                                    <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800/80 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText size={14} className="text-purple-400 shrink-0" />
                                                <span className="text-xs font-semibold text-purple-300 truncate">
                                                    {item.claim_a_detail?.source_name || 'Source A'}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 ml-auto truncate">
                                                    {item.claim_a_detail?.topic_name || 'Topic'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-100 mb-2">
                                                "{item.claim_a_detail?.claim_text}"
                                            </p>
                                        </div>
                                        {item.claim_a_detail?.evidence_text && (
                                            <div className="mt-2 pt-2 border-t border-gray-800/60">
                                                <p className="text-[11px] text-gray-400 italic line-clamp-3">
                                                    Evidence: "{item.claim_a_detail.evidence_text}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Claim B */}
                                    <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800/80 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText size={14} className="text-indigo-400 shrink-0" />
                                                <span className="text-xs font-semibold text-indigo-300 truncate">
                                                    {item.claim_b_detail?.source_name || 'Source B'}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 ml-auto truncate">
                                                    {item.claim_b_detail?.topic_name || 'Topic'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-100 mb-2">
                                                "{item.claim_b_detail?.claim_text}"
                                            </p>
                                        </div>
                                        {item.claim_b_detail?.evidence_text && (
                                            <div className="mt-2 pt-2 border-t border-gray-800/60">
                                                <p className="text-[11px] text-gray-400 italic line-clamp-3">
                                                    Evidence: "{item.claim_b_detail.evidence_text}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* AI Explanation */}
                                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 flex items-start gap-3">
                                    <Sparkles size={16} className="text-purple-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-semibold text-purple-300 mb-0.5">
                                            AI Intelligence Analysis
                                        </h4>
                                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                                            {item.explanation}
                                        </p>
                                    </div>
                                </div>

                                {/* Resolved Note Display (if resolved) */}
                                {item.is_resolved && item.resolved_note && (
                                    <div className="mt-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300">
                                        <span className="font-semibold">Resolution Note:</span> {item.resolved_note}
                                    </div>
                                )}

                                {/* Resolve Accordion / Action */}
                                {isExpanded && !item.is_resolved && (
                                    <div className="mt-4 pt-4 border-t border-gray-800 animate-fade-in">
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                            How would you like to reconcile this conflict? (Optional note)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={resolveNotes[item.id] || ''}
                                            onChange={(e) => setResolveNotes({
                                                ...resolveNotes,
                                                [item.id]: e.target.value
                                            })}
                                            placeholder="e.g. Source A refers to Python 2, Source B is the modern standard in Python 3."
                                            className="w-full text-xs p-3 rounded-xl bg-gray-950 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-3"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setResolvingId(null)}
                                                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                disabled={resolveMutation.isPending}
                                                onClick={() => handleResolveSubmit(item.id)}
                                                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {resolveMutation.isPending ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle2 size={12} />
                                                )}
                                                Mark as Reconciled
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
