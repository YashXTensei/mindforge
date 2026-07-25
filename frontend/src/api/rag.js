import API from './axios';

// Chat
export const sendChatMessage = (message, conversationId = null) =>
    API.post('/rag/chat/', { message, conversation_id: conversationId }).then(r => r.data);

export const fetchConversations = () =>
    API.get('/rag/conversations/').then(r => r.data);

export const fetchConversation = (id) =>
    API.get(`/rag/conversations/${id}/`).then(r => r.data);

export const deleteConversation = (id) =>
    API.delete(`/rag/conversations/${id}/`);

// Semantic Search
export const semanticSearch = (query, topK = 10) =>
    API.get('/rag/search/', { params: { q: query, top_k: topK } }).then(r => r.data);

// Processing
export const fetchProcessingStatus = () =>
    API.get('/rag/status/').then(r => r.data);

export const triggerProcessing = (type, id) =>
    API.post('/rag/process/', { type, id }).then(r => r.data);
