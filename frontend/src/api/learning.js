import API from './axios';

// Topics
export const fetchTopics = () =>
    API.get('/learning/topics/').then(r => r.data);

// Daily Review
export const fetchDailyReview = () =>
    API.get('/learning/daily-review/').then(r => r.data);

// Submit Answer
export const submitAnswer = (itemId, answer) =>
    API.post(`/learning/daily-review/items/${itemId}/submit/`, { answer }).then(r => r.data);
