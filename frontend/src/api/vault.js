import API from './axios';

// =====================
// Documents API
// =====================

export const fetchDocuments = async (filters = {}) => {
    const response = await API.get('/vault/documents/', { params: filters });
    return response.data.results || response.data;
};

export const uploadDocument = async (documentData) => {
    // documentData is a FormData object (file upload ke liye zaroori)
    const response = await API.post('/vault/documents/', documentData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateDocument = async ({ id, documentData }) => {
    const response = await API.patch(`/vault/documents/${id}/`, documentData);
    return response.data;
};

export const deleteDocument = async (id) => {
    const response = await API.delete(`/vault/documents/${id}/`);
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