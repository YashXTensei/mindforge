import API from './axios';

// Fetch all contradictions (supports ?status=unresolved or ?status=resolved)
export const fetchContradictions = (status = null) => {
    const url = status ? `/intelligence/contradictions/?status=${status}` : '/intelligence/contradictions/';
    return API.get(url).then(r => r.data);
};

// Resolve a contradiction with an optional user note
export const resolveContradiction = (id, resolvedNote = '') =>
    API.patch(`/intelligence/contradictions/${id}/resolve/`, { resolved_note: resolvedNote }).then(r => r.data);

// Fetch quick intelligence stats (unresolved count, high severity count)
export const fetchIntelligenceStats = () =>
    API.get('/intelligence/stats/').then(r => r.data);
