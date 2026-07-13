import API from './axios';

export const fetchSearchResults = async (query) => {
    if (!query) return [];
    const response = await API.get('/search/', { params: { q: query } });
    return response.data;
};
