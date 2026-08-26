import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopics } from '../api/learning';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Clock, Sparkles, Loader2 } from 'lucide-react';

// --- Helpers ---
const getMasteryColor = (level) => {
    if (level >= 0.7) return 'text-emerald-400';
    if (level >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
};

const getMasteryBg = (level) => {
    if (level >= 0.7) return 'bg-emerald-500';
    if (level >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
};

const getMasteryLabel = (level) => {
    if (level >= 0.7) return 'Strong';
    if (level >= 0.4) return 'Learning';
    return 'Weak';
};

// --- Skeleton ---
const TopicSkeleton = () => (
    <div className="bg-surface-card p-5 rounded-xl border border-border animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="h-5 w-32 bg-gray-800 rounded"></div>
            <div className="h-5 w-16 bg-gray-800 rounded-full"></div>
        </div>
        <div className="h-2 w-full bg-gray-800 rounded-full mb-3"></div>
        <div className="h-4 w-24 bg-gray-800 rounded"></div>
    </div>
);

export default function Topics() {
    const navigate = useNavigate();

    const { data: topics, isLoading, isError } = useQuery({
        queryKey: ['topics'],
        queryFn: fetchTopics,
    });

    const dueTopics = topics?.filter(t => t.is_due) || [];
    const totalTopics = topics?.length || 0;
    const avgMastery = totalTopics > 0
        ? Math.round((topics.reduce((sum, t) => sum + (t.confidence_level || 0), 0) / totalTopics) * 100)
        : 0;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                        <Brain size={28} className="text-purple-400" />
                        Your Knowledge Map
                    </h1>
                    <p className="text-gray-400">
                        {isLoading 
                            ? 'Loading your topics...' 
                            : `${totalTopics} topics tracked across your vault`}
                    </p>
                </div>
                {dueTopics.length > 0 && (
                    <button
                        onClick={() => navigate('/review')}
                        className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium transition-colors"
                    >
                        <Sparkles size={18} />
                        Start Review ({dueTopics.length} due)
                    </button>
                )}
            </div>

            {/* Stats Row */}
            {!isLoading && !isError && totalTopics > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-surface-card p-4 rounded-xl border border-border flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                            <Brain size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Topics</p>
                            <p className="text-xl font-bold text-white">{totalTopics}</p>
                        </div>
                    </div>
                    <div className="bg-surface-card p-4 rounded-xl border border-border flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <TrendingUp size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Avg. Mastery</p>
                            <p className="text-xl font-bold text-white">{avgMastery}%</p>
                        </div>
                    </div>
                    <div className="bg-surface-card p-4 rounded-xl border border-border flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                            <Clock size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Due Today</p>
                            <p className="text-xl font-bold text-white">{dueTopics.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Topics Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <TopicSkeleton key={i} />)}
                </div>
            ) : isError ? (
                <div className="text-center py-16">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <p className="text-red-400">Failed to load topics. Please try again.</p>
                </div>
            ) : totalTopics === 0 ? (
                /* Empty State */
                <div className="bg-surface-card border border-border rounded-xl p-8 sm:p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                        <Brain size={32} className="text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">No topics yet</h2>
                    <p className="text-gray-400 max-w-md mb-6">
                        Upload PDFs or create notes in your Vault. MindForge will automatically extract learning topics and start tracking your mastery.
                    </p>
                    <button
                        onClick={() => navigate('/vault?upload=true')}
                        className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium transition-colors"
                    >
                        Go to Vault
                    </button>
                </div>
            ) : (
                /* Topic Cards */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topics.map((topic) => (
                        <div
                            key={topic.id}
                            className={`bg-surface-card p-5 rounded-xl border transition-all hover:-translate-y-1 ${
                                topic.is_due 
                                    ? 'border-yellow-500/30 hover:border-yellow-500/50' 
                                    : 'border-border hover:border-accent/30'
                            }`}
                        >
                            {/* Topic Header */}
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-white font-semibold text-lg truncate pr-2">{topic.topic_name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                                    topic.confidence_level >= 0.7 
                                        ? 'bg-emerald-500/15 text-emerald-400' 
                                        : topic.confidence_level >= 0.4 
                                            ? 'bg-yellow-500/15 text-yellow-400' 
                                            : 'bg-red-500/15 text-red-400'
                                }`}>
                                    {getMasteryLabel(topic.confidence_level)}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                                <div 
                                    className={`h-2 rounded-full transition-all duration-500 ${getMasteryBg(topic.confidence_level)}`}
                                    style={{ width: `${Math.round((topic.confidence_level || 0) * 100)}%` }}
                                ></div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{Math.round((topic.confidence_level || 0) * 100)}% mastery</span>
                                <span>{topic.total_reviews} reviews</span>
                            </div>

                            {/* Due / Next Review Badge */}
                            {topic.is_due ? (
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-yellow-400">
                                    <Clock size={12} />
                                    <span>Due for review</span>
                                </div>
                            ) : (
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock size={12} />
                                    <span>Next review: {
                                        new Date(topic.next_review_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                    }</span>
                                </div>
                            )}

                            {/* Weak Areas */}
                            {topic.weak_sub_concepts && topic.weak_sub_concepts.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {topic.weak_sub_concepts.slice(0, 3).map((sub, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full">
                                            {sub}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
