import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage, fetchConversations, fetchConversation, deleteConversation } from '../api/rag';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
    Send, Plus, MessageSquare, Trash2, Loader2, Bot, User,
    FileText, StickyNote, ExternalLink, ChevronRight, Sparkles
} from 'lucide-react';

export default function Chat() {
    const [message, setMessage] = useState('');
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const queryClient = useQueryClient();

    // Fetch conversation list
    const { data: conversations = [] } = useQuery({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
    });

    // Fetch active conversation messages
    const { data: conversationData } = useQuery({
        queryKey: ['conversation', activeConversationId],
        queryFn: () => fetchConversation(activeConversationId),
        enabled: !!activeConversationId,
    });

    useEffect(() => {
        if (conversationData?.messages) {
            setMessages(conversationData.messages);
        }
    }, [conversationData]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message mutation
    const chatMutation = useMutation({
        mutationFn: ({ msg, convId }) => sendChatMessage(msg, convId),
        onSuccess: (data) => {
            setActiveConversationId(data.conversation_id);
            setMessages(prev => [
                ...prev,
                { ...data.user_message, role: 'user' },
                { ...data.assistant_message, role: 'assistant' },
            ]);
            queryClient.invalidateQueries(['conversations']);
        },
    });

    // Delete conversation
    const deleteMutation = useMutation({
        mutationFn: deleteConversation,
        onSuccess: () => {
            queryClient.invalidateQueries(['conversations']);
            if (activeConversationId) {
                setActiveConversationId(null);
                setMessages([]);
            }
        },
    });

    const handleSend = () => {
        if (!message.trim() || chatMutation.isPending) return;

        // Optimistically add user message to UI
        setMessages(prev => [...prev, { role: 'user', content: message, id: Date.now() }]);

        chatMutation.mutate({
            msg: message,
            convId: activeConversationId,
        });
        setMessage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
        inputRef.current?.focus();
    };

    const getSourceIcon = (type) => {
        if (type === 'note') return <StickyNote size={12} />;
        return <FileText size={12} />;
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-full gap-0 animate-fade-in relative">
            {/* Sidebar Toggle Button (Mobile/Collapsed view) */}
            {!isSidebarOpen && (
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-4 left-4 z-10 p-2 bg-surface-card border border-border rounded-lg text-gray-400 hover:text-white hover:border-accent transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            )}

            {/* Sidebar — Conversation List */}
            <div className={`shrink-0 border-r border-border bg-surface flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-none'}`}>
                <div className="p-4 border-b border-border flex gap-2">
                    <button
                        onClick={handleNewChat}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                    >
                        <Plus size={16} />
                        New Chat
                    </button>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2.5 bg-surface-card hover:bg-surface-hover text-gray-400 hover:text-white rounded-lg transition-colors shrink-0"
                        title="Close Sidebar"
                    >
                        <ChevronRight size={16} className="rotate-180" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="text-center text-gray-600 text-sm py-8 px-4">
                            No conversations yet. Start chatting!
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => {
                                    setActiveConversationId(conv.id);
                                    setMessages([]);
                                }}
                                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-1
                                    ${activeConversationId === conv.id
                                        ? 'bg-accent/10 text-accent border border-accent/20'
                                        : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200 border border-transparent'
                                    }`}
                            >
                                <MessageSquare size={14} className="shrink-0" />
                                <span className="text-sm truncate flex-1">{conv.title}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Delete this conversation?')) {
                                            deleteMutation.mutate(conv.id);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6">
                    {messages.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                                <Sparkles size={32} className="text-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Chat with your Knowledge</h2>
                            <p className="text-gray-500 max-w-md mb-8">
                                Ask questions about your notes and documents. MindForge AI will find
                                relevant content and answer with source citations.
                            </p>
                            <div className="flex flex-wrap gap-2 max-w-lg justify-center">
                                {['What topics have I studied?', 'Summarize my React notes', 'What are the key concepts in my PDFs?'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setMessage(suggestion)}
                                        className="px-4 py-2 bg-surface-card border border-border rounded-full text-sm text-gray-400 hover:text-white hover:border-accent transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Message List */
                        <div className="max-w-3xl mx-auto space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className="flex gap-3 animate-fade-in">
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                                        ${msg.role === 'user'
                                            ? 'bg-accent/15 text-accent'
                                            : 'bg-emerald-500/15 text-emerald-400'
                                        }`}
                                    >
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {msg.role === 'user' ? 'You' : 'MindForge AI'}
                                        </span>
                                        <div className="mt-1 text-gray-200 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Source Citations */}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-3 flex flex-col gap-1.5">
                                                <span className="text-xs text-gray-600 font-medium">Sources:</span>
                                                {msg.sources.map((src, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-border rounded-md text-xs text-gray-400 hover:border-accent/30 transition-colors"
                                                    >
                                                        {getSourceIcon(src.source_type)}
                                                        <span className="text-gray-300">{src.source_title}</span>
                                                        {src.page_num && (
                                                            <span className="text-gray-600">p.{src.page_num}</span>
                                                        )}
                                                        <span className="ml-auto text-accent text-[10px]">
                                                            {Math.round(src.score * 100)}% match
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {chatMutation.isPending && (
                                <div className="flex gap-3 animate-fade-in">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                                        <Bot size={16} />
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Loader2 size={14} className="animate-spin" />
                                        Searching your knowledge base...
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-border p-4 bg-surface">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <textarea
                            ref={inputRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your knowledge..."
                            rows={1}
                            className="flex-1 bg-surface-card border border-border rounded-xl px-4 py-3 text-white text-sm resize-none outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all placeholder:text-gray-600"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || chatMutation.isPending}
                            className="px-4 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
