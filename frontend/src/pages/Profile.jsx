import React from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';
import { User, Mail, Calendar, Github, Linkedin, Code2, Heart, Award, FileText, Database, Link as LinkIcon } from 'lucide-react';
import { fetchNotes } from '../api/notes';
import { fetchDocuments, fetchResources } from '../api/vault';

const fetchUserProfile = async () => {
    const response = await API.get('/auth/me/');
    return response.data;
};

export default function Profile() {
    const { data: user, isLoading: loadingUser } = useQuery({
        queryKey: ['userProfile'],
        queryFn: fetchUserProfile,
    });

    const { data: notes } = useQuery({
        queryKey: ['notes', {}],
        queryFn: () => fetchNotes({})
    });

    const { data: documents } = useQuery({
        queryKey: ['documents'],
        queryFn: () => fetchDocuments()
    });

    const { data: resources } = useQuery({
        queryKey: ['resources'],
        queryFn: () => fetchResources()
    });

    if (loadingUser) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-full"></div>
                    Loading profile...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-fade-in pb-24">
            <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: User Info & Stats */}
                <div className="flex flex-col gap-8">
                    {/* Account Information */}
                    <div className="bg-surface-card p-6 rounded-xl border border-border">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <User className="text-accent" size={20} /> Account Information
                        </h2>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                                <span className="text-2xl font-bold text-accent uppercase">
                                    {user?.username?.[0] || 'U'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{user?.username}</h3>
                                <p className="text-gray-400 text-sm">MindForge User</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                <span className="text-gray-400 flex items-center gap-2"><Mail size={16}/> Email</span>
                                <span className="text-gray-200">{user?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                <span className="text-gray-400 flex items-center gap-2"><Calendar size={16}/> Joined on</span>
                                <span className="text-gray-200">
                                    {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* MindForge Stats */}
                    <div className="bg-surface-card p-6 rounded-xl border border-border">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Database className="text-[#4ECDC4]" size={20} /> MindForge Stats
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-background rounded-lg border border-border">
                                <FileText size={20} className="text-[#A076F9] mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{notes?.length || 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Notes</div>
                            </div>
                            <div className="text-center p-3 bg-background rounded-lg border border-border">
                                <Database size={20} className="text-[#4ECDC4] mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{documents?.length || 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Docs</div>
                            </div>
                            <div className="text-center p-3 bg-background rounded-lg border border-border">
                                <LinkIcon size={20} className="text-[#FF6B6B] mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{resources?.length || 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Links</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: About the Creator */}
                <div className="bg-gradient-to-br from-surface-card to-[#A076F9]/10 p-1 rounded-xl">
                    <div className="bg-surface-card h-full p-6 rounded-lg border border-border/50 flex flex-col relative overflow-hidden">
                        
                        {/* Decorative background element */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 blur-3xl rounded-full"></div>

                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 relative z-10">
                            <Code2 className="text-accent" size={20} /> About the Creator
                        </h2>

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-gray-800">
                                {/* Fallback avatar since we don't have an actual image URL. Using a neat gradient placeholder */}
                                <div className="w-full h-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">YM</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">Yash Mittal</h3>
                                <p className="text-accent text-sm font-medium">Creator of MindForge</p>
                            </div>
                        </div>

                        <div className="text-gray-300 space-y-4 text-sm leading-relaxed relative z-10">
                            <p>
                                Computer Science student exploring the intersections of AI systems, competitive programming, and modern software development.
                            </p>
                            <p>
                                MindForge was built as an exploration into Retrieval-Augmented Generation (RAG) and intelligent knowledge management.
                            </p>
                        </div>

                        <div className="mt-8 space-y-3 relative z-10">
                            <div className="flex items-center gap-3 text-sm">
                                <Award size={16} className="text-[#FFD700]" />
                                <span className="text-gray-400 w-24">Codeforces:</span>
                                <span className="text-gray-200 font-medium">1500+ rating</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Github size={16} className="text-gray-400" />
                                <span className="text-gray-400 w-24">GitHub:</span>
                                <a href="https://github.com/YashXTensei" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@YashXTensei</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Linkedin size={16} className="text-[#0A66C2]" />
                                <span className="text-gray-400 w-24">LinkedIn:</span>
                                <a href="#" className="text-accent hover:underline">Yash Mittal</a>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 relative z-10">
                            <div className="p-4 bg-background/50 rounded-lg border border-border/50 text-center">
                                <p className="text-xs text-gray-500 italic flex items-center justify-center gap-1.5">
                                    Built with curiosity, caffeine, and an unreasonable number of commits. <Heart size={12} className="text-[#FF6B6B]" />
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}