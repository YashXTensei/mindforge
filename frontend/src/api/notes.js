import API from './axios';

// Get all notes
export const fetchNotes = async () => {
    const response = await API.get('/notes/');
    // DRF Cursor pagination usually results in response.data.results me actual data hota hai
    // Par abhi agar pagination nahi bhi chal rahi toh backend array dega.
    // Hum dono handle kar lete hain:
    return response.data.results || response.data;
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