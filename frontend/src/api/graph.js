import API from './axios';

// Full graph data (nodes + links) for visualization
export const fetchGraphData = () =>
    API.get('/graph/network/').then(r => r.data);

// Claims for a specific topic (side panel)
export const fetchTopicClaims = (topicId) =>
    API.get(`/graph/topics/${topicId}/claims/`).then(r => r.data);

// Gap analysis — "What am I missing to understand X?"
export const analyzeGap = (topicId) =>
    API.get(`/graph/analyze-gap/?target=${topicId}`).then(r => r.data);
