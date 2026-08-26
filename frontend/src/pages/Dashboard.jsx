import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNotes } from '../api/notes';
import { fetchDocuments, fetchResources } from '../api/vault';
import { fetchTopics } from '../api/learning';
import { FileText, Files, Link as LinkIcon, Sparkles, Plus, Upload, Clock, AlertCircle, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

// --- Helpers ---
const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const fetchUserProfile = async () => {
    const response = await API.get('/auth/me/');
    return response.data;
};

// --- Skeletons ---
const StatSkeleton = () => (
    <div className="bg-surface-card p-5 rounded-xl border border-border flex flex-col gap-3 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-gray-800 rounded"></div>
            <div className="h-5 w-5 bg-gray-800 rounded-full"></div>
        </div>
        <div className="h-8 w-12 bg-gray-700 rounded mt-2"></div>
    </div>
);

const ListSkeleton = () => (
    <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-[60px] bg-surface-card rounded-lg border border-border animate-pulse"></div>
        ))}
    </div>
);

export default function Dashboard() {
    const navigate = useNavigate();
    const greeting = useMemo(() => getGreeting(), []);

    // --- Parallel Queries ---
    const { data: userProfile } = useQuery({
        queryKey: ['userProfile'],
        queryFn: fetchUserProfile,
    });

    const { data: notes, isLoading: loadingNotes, isError: errNotes } = useQuery({
        queryKey: ['notes', {}],
        queryFn: () => fetchNotes({})
    });

    const { data: documents, isLoading: loadingDocs, isError: errDocs } = useQuery({
        queryKey: ['documents'],
        queryFn: () => fetchDocuments()
    });

    const { data: resources, isLoading: loadingRes, isError: errRes } = useQuery({
        queryKey: ['resources'],
        queryFn: () => fetchResources()
    });

    const { data: topics } = useQuery({
        queryKey: ['topics'],
        queryFn: fetchTopics
    });

    // --- Derived Data ---
    const recentNotes = notes?.slice(0, 5) || [];
    const recentDocs = documents?.slice(0, 5) || [];
    const dueTopicsCount = topics?.filter(topic => topic.is_due)?.length || 0;

    // --- Components ---
    const StatCard = ({ title, value, icon, color, isLoading, isError }) => (
        <div className={`bg-surface-card p-5 rounded-xl border border-border border-t-4 flex flex-col gap-2 transition-transform hover:-translate-y-1 ${color}`}>
            <div className="flex justify-between items-center text-gray-400">
                <span className="text-sm font-medium">{title}</span>
                {icon}
            </div>
            {isLoading ? (
                <div className="h-8 w-12 bg-gray-700 rounded mt-2 animate-pulse"></div>
            ) : isError ? (
                <div className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> Error</div>
            ) : (
                <div className="text-3xl font-bold text-white mt-1">{value?.length || 0}</div>
            )}
        </div>
    );

    const ListItem = ({ title, date, onClick, icon }) => (
        <div 
            onClick={onClick}
            className="group bg-surface-card p-4 rounded-lg border border-border flex justify-between items-center cursor-pointer transition-colors hover:border-accent hover:bg-accent/5"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-gray-500 group-hover:text-accent transition-colors">{icon}</div>
                <span className="text-gray-200 font-medium truncate group-hover:text-white transition-colors">
                    {title}
                </span>
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                <Clock size={12} /> {timeAgo(date)}
            </span>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">{greeting}, {userProfile?.username || 'User'} 👋</h1>
                <p className="text-gray-400 text-lg">
                    {(loadingNotes || loadingDocs || loadingRes) 
                        ? 'Waking up your workspace... please wait a moment ☕' 
                        : "Here's what's in your knowledge base."}
                </p>
            </div>

            {/* Pending Reviews Notification */}
            {dueTopicsCount > 0 && (
                <div className="mb-10 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                            <Brain size={24} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-yellow-400 font-bold text-lg">You have pending reviews</h3>
                            <p className="text-gray-300 text-sm">
                                {dueTopicsCount} {dueTopicsCount === 1 ? 'topic is' : 'topics are'} decaying in your memory. Review them now to keep your knowledge sharp.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/review')}
                        className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                        Start Review
                    </button>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
                <StatCard 
                    title="Notes" 
                    value={notes} 
                    icon={<FileText size={20} className="text-[#A076F9]" />} 
                    color="border-t-[#A076F9]"
                    isLoading={loadingNotes}
                    isError={errNotes}
                />
                <StatCard 
                    title="Documents" 
                    value={documents} 
                    icon={<Files size={20} className="text-[#4ECDC4]" />} 
                    color="border-t-[#4ECDC4]"
                    isLoading={loadingDocs}
                    isError={errDocs}
                />
                <StatCard 
                    title="Resources" 
                    value={resources} 
                    icon={<LinkIcon size={20} className="text-[#FF6B6B]" />} 
                    color="border-t-[#FF6B6B]"
                    isLoading={loadingRes}
                    isError={errRes}
                />
            </div>

            {/* Empty State OR Main Content Grid */}
            {(!loadingNotes && !loadingDocs && !loadingRes && 
              notes?.length === 0 && documents?.length === 0 && resources?.length === 0) ? (
                
                <div className="bg-surface-card border border-border rounded-xl p-8 sm:p-12 mb-12 flex flex-col items-center text-center animate-fade-in relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4ECDC4]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/20">
                        <Sparkles size={32} className="text-accent" />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-4">Welcome to MindForge</h2>
                    <p className="text-gray-400 text-lg max-w-2xl mb-10">
                        Your intelligent personal knowledge base. MindForge doesn't just store your information — it lets you interact with it. Search, connect, and ask AI questions directly against your own documents and notes.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-left">
                        <div className="p-6 rounded-xl bg-background border border-border flex flex-col gap-3 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#A076F9] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <Upload size={24} className="text-[#A076F9]" />
                            <h3 className="text-white font-semibold text-lg">1. Upload Documents</h3>
                            <p className="text-sm text-gray-500">Add PDFs, images, or files. We'll extract the text and generate vector embeddings automatically.</p>
                            <button onClick={() => navigate('/vault?upload=true')} className="mt-auto pt-4 text-[#A076F9] text-sm font-medium hover:underline text-left cursor-pointer bg-transparent border-none p-0 w-max">Go to Vault &rarr;</button>
                        </div>

                        <div className="p-6 rounded-xl bg-background border border-border flex flex-col gap-3 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#4ECDC4] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <FileText size={24} className="text-[#4ECDC4]" />
                            <h3 className="text-white font-semibold text-lg">2. Write Notes</h3>
                            <p className="text-sm text-gray-500">Jot down ideas, thoughts, or summaries. Your notes are fully searchable and available to the AI.</p>
                            <button onClick={() => navigate('/notes?new=true')} className="mt-auto pt-4 text-[#4ECDC4] text-sm font-medium hover:underline text-left cursor-pointer bg-transparent border-none p-0 w-max">Create a Note &rarr;</button>
                        </div>

                        <div className="p-6 rounded-xl bg-background border border-border flex flex-col gap-3 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B6B] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <Sparkles size={24} className="text-[#FF6B6B]" />
                            <h3 className="text-white font-semibold text-lg">3. Ask AI</h3>
                            <p className="text-sm text-gray-500">Chat with your knowledge base. The AI will instantly search your vault to answer your questions.</p>
                            <button onClick={() => navigate('/chat')} className="mt-auto pt-4 text-[#FF6B6B] text-sm font-medium hover:underline text-left cursor-pointer bg-transparent border-none p-0 w-max">Start Chatting &rarr;</button>
                        </div>
                    </div>
                </div>

            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    
                    {/* Recent Notes */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                            <h2 className="text-xl font-semibold text-white m-0">Recent Notes</h2>
                            <Link to="/notes" className="text-sm text-accent hover:text-accent-dark no-underline">View all</Link>
                        </div>
                        {loadingNotes ? <ListSkeleton /> : errNotes ? (
                            <div className="text-red-400 p-4 border border-red-900/50 rounded-lg bg-red-900/10 text-sm">Failed to load notes.</div>
                        ) : recentNotes.length === 0 ? (
                            <div className="text-gray-500 text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg">No notes yet.</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {recentNotes.map(note => (
                                    <ListItem 
                                        key={note.id} 
                                        title={(note.is_pinned ? '📌 ' : '') + note.title} 
                                        date={note.updated_at} 
                                        onClick={() => navigate(`/notes/${note.id}`)}
                                        icon={<FileText size={16} />}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Documents */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                            <h2 className="text-xl font-semibold text-white m-0">Recent Documents</h2>
                            <Link to="/vault" className="text-sm text-accent hover:text-accent-dark no-underline">View vault</Link>
                        </div>
                        {loadingDocs ? <ListSkeleton /> : errDocs ? (
                            <div className="text-red-400 p-4 border border-red-900/50 rounded-lg bg-red-900/10 text-sm">Failed to load documents.</div>
                        ) : recentDocs.length === 0 ? (
                            <div className="text-gray-500 text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg">No documents yet.</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {recentDocs.map(doc => (
                                    <ListItem 
                                        key={doc.id} 
                                        title={doc.title} 
                                        date={doc.created_at} // documents use created_at often, but fallback to updated_at if needed
                                        onClick={() => navigate('/vault')}
                                        icon={<Files size={16} />}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* Quick Actions (Sticky on Mobile, Static on Desktop) */}
            <div className="fixed bottom-0 left-0 right-0 sm:static bg-background/80 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-border sm:border-none p-4 sm:p-0 z-10">
                <h3 className="hidden sm:block text-gray-400 font-medium mb-4 text-sm uppercase tracking-wider">Quick Actions</h3>
                <div className="flex gap-3 sm:gap-4 max-w-6xl mx-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                    <button 
                        onClick={() => navigate('/notes?new=true')}
                        className="flex-1 min-w-[140px] sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-accent text-white font-medium hover:bg-accent-dark transition-colors border-none cursor-pointer"
                    >
                        <Plus size={18} /> Create Note
                    </button>
                    <button 
                        onClick={() => navigate('/vault?upload=true')}
                        className="flex-1 min-w-[140px] sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-surface-card border border-border text-white font-medium hover:border-gray-500 hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <Upload size={18} /> Upload
                    </button>
                    <button 
                        onClick={() => navigate('/chat')}
                        className="flex-1 min-w-[140px] sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/25 transition-colors cursor-pointer"
                    >
                        <Sparkles size={18} /> Ask AI
                    </button>
                </div>
            </div>
            
            {/* CSS for hiding scrollbar on mobile quick actions */}
            <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
