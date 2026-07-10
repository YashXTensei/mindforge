import API from './axios';

// =====================
// PDFs API
// =====================

export const fetchPDFs = async (filters = {}) => {
    const response = await API.get('/vault/pdfs/', { params: filters });
    return response.data.results || response.data;
};

export const uploadPDF = async (pdfData) => {
    // pdfData is a FormData object (file upload ke liye zaroori)
    const response = await API.post('/vault/pdfs/', pdfData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updatePDF = async ({ id, pdfData }) => {
    const response = await API.patch(`/vault/pdfs/${id}/`, pdfData);
    return response.data;
};

export const deletePDF = async (id) => {
    const response = await API.delete(`/vault/pdfs/${id}/`);
    return response.data;
};

// =====================
// Resources API
// =====================

export const fetchResources = async (filters = {}) => {
    const response = await API.get('/vault/resources/', { params: filters });
    return response.data.results || response.data;
};

export const createResource = async (resourceData) => {
    const response = await API.post('/vault/resources/', resourceData);
    return response.data;
};

export const updateResource = async ({ id, resourceData }) => {
    const response = await API.patch(`/vault/resources/${id}/`, resourceData);
    return response.data;
};

export const deleteResource = async (id) => {
    const response = await API.delete(`/vault/resources/${id}/`);
    return response.data;
};