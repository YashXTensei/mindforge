import API from './axios';

// Get all notes (with optional filters)
export const fetchNotes = async (filters = {}) => {
    const response = await API.get('/notes/', { params: filters });
    return response.data.results || response.data;
};

// Fetch single note by ID
export const fetchNote = async (id) => {
    const response = await API.get(`/notes/${id}/`);
    return response.data;
};

// Naya note banaye
export const createNote = async (noteData) => {
    // noteData me { title: '...', content: '...' } aayega
    const response = await API.post('/notes/', noteData);
    return response.data;
};

// Update existing note
export const updateNote = async ({ id, noteData }) => {
    // PATCH request sirf unhi fields ko update karti hai jo hum bhejte hain
    const response = await API.patch(`/notes/${id}/`, noteData);
    return response.data;
};

// Delete note
export const deleteNote = async (id) => {
    const response = await API.delete(`/notes/${id}/`);
    return response.data;
};

// =====================
// Categories API
// =====================

// Sabhi categories fetch karo
export const fetchCategories = async () => {
    const response = await API.get('/categories/');
    return response.data.results || response.data;
};

// Nayi category banao
export const createCategory = async (categoryData) => {
    const response = await API.post('/categories/', categoryData);
    return response.data;
};

// Category delete karo
export const deleteCategory = async (id) => {
    const response = await API.delete(`/categories/${id}/`);
    return response.data;
};

// =====================
// Tags API
// =====================

// Sabhi tags fetch karo
export const fetchTags = async () => {
    const response = await API.get('/tags/');
    return response.data.results || response.data;
};

// Naya tag banao
export const createTag = async (tagData) => {
    const response = await API.post('/tags/', tagData);
    return response.data;
};

// Tag delete karo
export const deleteTag = async (id) => {
    const response = await API.delete(`/tags/${id}/`);
    return response.data;
};