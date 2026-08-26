import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDailyReview, submitAnswer } from '../api/learning';
import { useNavigate } from 'react-router-dom';
import { 
    Brain, CheckCircle, XCircle, ArrowRight, Trophy, 
    Loader2, AlertCircle, Sparkles, MessageSquare, ArrowLeft
} from 'lucide-react';

export default function DailyReview() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [result, setResult] = useState(null); // null = not answered, { is_correct, explanation, correct_answer }

    // Fetch the review session
    const { data: session, isLoading, isError } = useQuery({
        queryKey: ['dailyReview'],
        queryFn: fetchDailyReview,
        refetchOnWindowFocus: false,
    });

    // Resume from where the user left off
    React.useEffect(() => {
        if (session && session.items) {
            const firstUnanswered = session.items.findIndex(item => !item.user_answer);
            if (firstUnanswered !== -1) {
                setCurrentIndex(firstUnanswered);
            }
        }
    }, [session]);

    // Submit answer mutation
    const submitMutation = useMutation({
        mutationFn: ({ itemId, answer }) => submitAnswer(itemId, answer),
        onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries(['topics']); // Refresh mastery levels
        },
    });

    // --- Edge Cases ---
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Loader2 size={40} className="text-accent animate-spin mb-4" />
                <p className="text-gray-400">Generating your review questions...</p>
                <p className="text-gray-600 text-sm mt-2">This may take a moment as AI creates questions from your notes.</p>
            </div>
        );
    }

    if (isError) {
        // Try to get specific error message from the API response
        // error response object from axios might have a message nested in response.data.error
        // React Query passes the axios error object as 'error' variable
        // We need to import 'error' from the useQuery hook above to access this.
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <p className="text-red-400 font-medium mb-2">Failed to generate review session</p>
                <p className="text-gray-400 text-sm mb-6 max-w-md">
                    This usually happens if the AI rate limit is reached. Please try again in a minute.
                </p>
                <button 
                    onClick={() => queryClient.invalidateQueries(['dailyReview'])}
                    className="px-6 py-2 bg-surface-card hover:bg-surface-hover border border-border rounded-lg text-sm transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // No topics due today
    if (session?.message) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <CheckCircle size={40} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">All caught up! 🎉</h2>
                <p className="text-gray-400 max-w-md mb-6">{session.message}</p>
                <button 
                    onClick={() => navigate('/topics')}
                    className="px-6 py-3 bg-surface-card border border-border text-white rounded-xl hover:border-accent transition-colors"
                >
                    View Topics
                </button>
            </div>
        );
    }

    // Session is already complete (user already did today's review)
    if (session?.is_completed && !result) {
        const scorePct = session.total_items > 0 
            ? Math.round((session.correct_items / session.total_items) * 100) 
            : 0;
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <Trophy size={40} className="text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Today's Review Complete!</h2>
                <p className="text-gray-400 mb-6">
                    You scored {session.correct_items}/{session.total_items} ({scorePct}%)
                </p>
                <button 
                    onClick={() => navigate('/topics')}
                    className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium transition-colors"
                >
                    View Topics
                </button>
            </div>
        );
    }

    const items = session?.items || [];
    const currentItem = items[currentIndex];

    if (!currentItem) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <p className="text-gray-400">No questions available.</p>
            </div>
        );
    }

    const handleSubmit = () => {
        if (!selectedAnswer || submitMutation.isPending) return;
        submitMutation.mutate({ itemId: currentItem.id, answer: selectedAnswer });
    };

    const handleNext = () => {
        // If session is complete, let the user see the final Trophy/Results screen.
        // We do this by invalidating the query and clearing the result state, 
        // which will trigger the 'is_completed' early return above.
        if (result?.session_completed) {
            queryClient.setQueryData(['dailyReview'], (old) => old ? { ...old, is_completed: true, correct_items: old.correct_items + (result.is_correct ? 1 : 0) } : old);
            queryClient.invalidateQueries(['dailyReview']);
            queryClient.invalidateQueries(['topics']);
            setResult(null);
            return;
        }
        
        setSelectedAnswer(null);
        setResult(null);
        setCurrentIndex(prev => prev + 1);
    };

    const options = currentItem.options || {};
    const optionKeys = ['A', 'B', 'C', 'D'];

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8 animate-fade-in">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => navigate('/topics')}
                    className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Topics
                </button>
                <span className="text-sm text-gray-500">
                    Question {currentIndex + 1} of {items.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8">
                <div 
                    className="h-1.5 rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${((currentIndex + (result ? 1 : 0)) / items.length) * 100}%` }}
                ></div>
            </div>

            {/* "Why am I reviewing this?" Context */}
            {currentItem.review_context && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <MessageSquare size={18} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-purple-400 font-medium mb-1">Why this topic?</p>
                        <p className="text-sm text-gray-300">{currentItem.review_context}</p>
                    </div>
                </div>
            )}

            {/* Topic Tag */}
            <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-accent" />
                <span className="text-sm text-accent font-medium">{currentItem.topic_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                    currentItem.difficulty_level === 1 ? 'bg-emerald-500/15 text-emerald-400' :
                    currentItem.difficulty_level === 2 ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-red-500/15 text-red-400'
                }`}>
                    {currentItem.difficulty_level === 1 ? 'Easy' : currentItem.difficulty_level === 2 ? 'Medium' : 'Hard'}
                </span>
            </div>

            {/* Question */}
            <div className="bg-surface-card border border-border rounded-xl p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
                    {currentItem.question_text}
                </h2>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 mb-6">
                {optionKeys.map((key) => {
                    if (!options[key]) return null;

                    let optionStyle = 'border-border hover:border-accent/50 hover:bg-accent/5 cursor-pointer';
                    
                    if (result) {
                        // After answering — show correct/incorrect
                        if (key === result.correct_answer) {
                            optionStyle = 'border-emerald-500 bg-emerald-500/10 cursor-default';
                        } else if (key === selectedAnswer && !result.is_correct) {
                            optionStyle = 'border-red-500 bg-red-500/10 cursor-default';
                        } else {
                            optionStyle = 'border-border opacity-50 cursor-default';
                        }
                    } else if (key === selectedAnswer) {
                        optionStyle = 'border-accent bg-accent/10 cursor-pointer';
                    }

                    return (
                        <button
                            key={key}
                            onClick={() => !result && setSelectedAnswer(key)}
                            disabled={!!result}
                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${optionStyle}`}
                        >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                result && key === result.correct_answer
                                    ? 'bg-emerald-500 text-white'
                                    : result && key === selectedAnswer && !result.is_correct
                                        ? 'bg-red-500 text-white'
                                        : key === selectedAnswer
                                            ? 'bg-accent text-white'
                                            : 'bg-gray-800 text-gray-400'
                            }`}>
                                {key}
                            </span>
                            <span className="text-gray-200 text-sm sm:text-base pt-1">{options[key]}</span>
                            {result && key === result.correct_answer && (
                                <CheckCircle size={20} className="text-emerald-400 ml-auto shrink-0 mt-1" />
                            )}
                            {result && key === selectedAnswer && !result.is_correct && (
                                <XCircle size={20} className="text-red-400 ml-auto shrink-0 mt-1" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Result Feedback */}
            {result && (
                <div className={`rounded-xl p-5 mb-6 border ${
                    result.is_correct 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : selectedAnswer === 'S'
                            ? 'bg-orange-500/5 border-orange-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        {result.is_correct 
                            ? <CheckCircle size={20} className="text-emerald-400" />
                            : selectedAnswer === 'S'
                                ? <AlertCircle size={20} className="text-orange-400" />
                                : <XCircle size={20} className="text-red-400" />
                        }
                        <span className={`font-semibold ${
                            result.is_correct ? 'text-emerald-400' 
                            : selectedAnswer === 'S' ? 'text-orange-400'
                            : 'text-red-400'
                        }`}>
                            {result.is_correct ? 'Correct!' : selectedAnswer === 'S' ? 'Skipped' : 'Incorrect'}
                        </span>
                    </div>
                    {selectedAnswer === 'S' && (
                        <p className="text-gray-400 text-sm mb-3">
                            You skipped this question. The correct answer was <strong>Option {result.correct_answer}</strong>.
                        </p>
                    )}
                    <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
                </div>
            )}

            {/* Action Button */}
            <div className="flex justify-end gap-3">
                {!result ? (
                    <>
                        <button
                            onClick={() => {
                                setSelectedAnswer('S');
                                submitMutation.mutate({ itemId: currentItem.id, answer: 'S' });
                            }}
                            disabled={submitMutation.isPending}
                            className="px-6 py-3 bg-surface-card hover:bg-surface-hover text-gray-300 border border-border rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Skip Question
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedAnswer || selectedAnswer === 'S' || submitMutation.isPending}
                            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitMutation.isPending ? (
                                <><Loader2 size={18} className="animate-spin" /> Checking...</>
                            ) : (
                                'Submit Answer'
                            )}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-colors ${
                            result.session_completed 
                                ? 'bg-emerald-600 hover:bg-emerald-700' 
                                : 'bg-accent hover:bg-accent-dark'
                        }`}
                    >
                        {result.session_completed ? (
                            <><CheckCircle size={18} /> Done</>
                        ) : (
                            <>Next Question <ArrowRight size={18} /></>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
