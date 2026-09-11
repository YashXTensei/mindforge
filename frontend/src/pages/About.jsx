import React from 'react';
import { Info, Sparkles, BookOpen, Database, Search, MessageSquare, Zap, Brain, Share2, Target, BarChart3 } from 'lucide-react';

export default function About() {
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-fade-in pb-24">
            
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent/20">
                    <Sparkles size={40} className="text-accent" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">MindForge 3.0</h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Don't just store knowledge — talk to it, learn from it, and let AI manage it.
                </p>
            </div>

            {/* Why MindForge? */}
            <div className="bg-surface-card border border-border p-8 rounded-xl mb-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Info className="text-accent" /> Why MindForge?
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                    Most knowledge bases simply store information. MindForge is designed to let you <strong>interact with your knowledge</strong> — search it semantically, discover hidden connections between concepts, and let AI build you a personalized learning path. It acts as a second brain that remembers everything you upload, maps relationships between topics, identifies knowledge gaps, and helps you retain information long-term through spaced repetition.
                </p>
            </div>

            {/* Current Features */}
            <h2 className="text-2xl font-semibold text-white mb-6 mt-12 flex items-center gap-2">
                <Zap className="text-[#4ECDC4]" /> Current Features
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <BookOpen className="text-[#A076F9] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Smart Notes</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Write, format, and organize your thoughts. Fully searchable and instantly available to the AI.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <Database className="text-[#4ECDC4] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Document Vault</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Upload PDFs and images. MindForge automatically extracts text and generates vector embeddings for semantic search.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <Search className="text-[#FF6B6B] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Global Semantic Search</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Find what you're looking for by meaning, not just exact keywords, across all notes and documents.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <MessageSquare className="text-accent shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">RAG-Powered AI Chat</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Converse naturally with your vault. The AI cites exact sources when retrieving your data.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <Brain className="text-[#FFD166] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Active Recall & SM-2</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">AI automatically generates daily quizzes from your notes. SM-2 algorithm spaces out reviews to optimize long-term retention.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <Sparkles className="text-[#06D6A0] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Topic Auto-Extraction</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">AI scans uploaded documents to identify core concepts, creating a customized learning path and tracking mastery.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <Share2 className="text-[#A076F9] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Interactive Knowledge Graph</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">AI discovers prerequisite and related connections between your topics. Visualized as an interactive force-directed graph with claims and evidence.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <Target className="text-[#FF6B6B] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Gap Analysis</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Click any topic to analyze its prerequisites. AI identifies missing and weak foundational concepts, giving you a clear learning path.</p>
                    </div>
                </div>
            </div>

            {/* What's Coming */}
            <div className="bg-gradient-to-br from-surface-card to-background border border-border p-8 rounded-xl mb-8 relative">
                <h2 className="text-2xl font-semibold text-white mb-6">What's Coming</h2>
                
                <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Future Versions</h3>
                    <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
                        <li><strong>Advanced Analytics Dashboard:</strong> Visualize your learning progress, study streaks, and topic mastery over time.</li>
                        <li><strong>Collaborative Knowledge Bases:</strong> Share your vault and learn together with friends or study groups.</li>
                        <li><strong>Mobile App:</strong> Access your second brain on the go with a native mobile experience.</li>
                    </ul>
                </div>
            </div>

            <div className="text-center text-sm text-gray-600 mt-12">
                MindForge — Current Version: 3.0.0
            </div>

        </div>
    );
}
