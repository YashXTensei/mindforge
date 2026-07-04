import API from './axios';

// Get all notes
export const fetchNotes = async () => {
    const response = await API.get('/notes/');
    // DRF Cursor pagination usually results in response.data.results me actual data hota hai
    // Par abhi agar pagination nahi bhi chal rahi toh backend array dega.
    // Hum dono handle kar lete hain:
    return response.data.results || response.data;
};