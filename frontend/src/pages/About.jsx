import React from 'react';
import { Info, Sparkles, BookOpen, Database, Search, MessageSquare, Zap, Brain } from 'lucide-react';

export default function About() {
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-fade-in pb-24">
            
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent/20">
                    <Sparkles size={40} className="text-accent" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">MindForge 2.0</h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Your personal AI operating system and knowledge vault.
                </p>
            </div>

            {/* Why MindForge? */}
            <div className="bg-surface-card border border-border p-8 rounded-xl mb-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Info className="text-accent" /> Why MindForge?
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                    Most knowledge bases simply store information. MindForge is designed to let you <strong>interact with your knowledge</strong> — search it, connect it, and ask AI about it. It acts as a second brain that remembers everything you upload, builds daily quizzes to improve your memory, and helps you synthesize new ideas instantly.
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
                        <p className="text-gray-400 text-sm leading-relaxed">Upload PDFs and images. MindForge automatically extracts text and generates vector embeddings.</p>
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
                        <p className="text-gray-400 text-sm leading-relaxed">AI automatically generates daily quizzes from your notes. SM-2 algorithm spaces out reviews to optimize retention.</p>
                    </div>
                </div>
                <div className="bg-surface p-5 rounded-lg border border-border flex items-start gap-4">
                    <Sparkles className="text-[#06D6A0] shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-white font-medium mb-1">Topic Auto-Extraction</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">AI scans uploaded documents to identify core concepts, creating a customized learning path and tracking mastery.</p>
                    </div>
                </div>
            </div>

            {/* What's Coming */}
            <div className="bg-gradient-to-br from-surface-card to-background border border-border p-8 rounded-xl mb-8 relative">
                <h2 className="text-2xl font-semibold text-white mb-6">What's Coming</h2>
                
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-accent mb-2">Phase 5: The Network Effect</h3>
                    <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
                        <li><strong>Interactive Knowledge Graph:</strong> A visual Force-Directed graph mapping connections between topics.</li>
                        <li><strong>Knowledge Compiler:</strong> AI agents that synthesize relationships, prerequisites, and claims across your entire vault.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Future Versions</h3>
                    <p className="text-gray-400 italic">
                        More AI-powered learning, knowledge management and automation features are planned for future versions. Stay tuned. 🚀
                    </p>
                </div>
            </div>

            <div className="text-center text-sm text-gray-600 mt-12">
                MindForge — Current Version: 2.0.0
            </div>

        </div>
    );
}
