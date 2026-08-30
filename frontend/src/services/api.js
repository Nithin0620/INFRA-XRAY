import axios from 'axios';

// Resolve API base URL:
// 1. If VITE_API_URL is provided in .env / Cloudflare, use it (e.g., https://infra-xray.onrender.com)
// 2. If running locally in development and no .env is set, fallback to http://localhost:3001/api (or /api via Vite proxy)
const rawBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
const BASE_URL = rawBaseUrl
  ? `${rawBaseUrl.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // 90s timeout to allow Render free tier to spin up
});

// Cold-start / pending request tracker listeners
let activeRequests = 0;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn(activeRequests));
}

export function subscribeToApiActivity(callback) {
  listeners.add(callback);
  callback(activeRequests);
  return () => listeners.delete(callback);
}

// Axios Interceptors for request activity tracking
api.interceptors.request.use(
  (config) => {
    activeRequests += 1;
    notifyListeners();
    return config;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyListeners();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyListeners();
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyListeners();
    return Promise.reject(error);
  }
);

// Projects
export const fetchProjects = () => api.get('/projects').then((r) => r.data);
export const fetchProject = (id) => api.get(`/projects/${id}`).then((r) => r.data);
export const fetchProjectMap = (id) => api.get(`/projects/${id}/map`).then((r) => r.data);

// Evidence
export const fetchEvidence = (projectId) => api.get(`/evidence/${projectId}`).then((r) => r.data);

// Flags
export const fetchFlags = (projectId) => api.get(`/flags/${projectId}`).then((r) => r.data);
export const fetchAllFlags = () => api.get('/flags').then((r) => r.data);

// Copilot
export const generateChecklist = (projectId) =>
  api.post(`/copilot/${projectId}/checklist`).then((r) => r.data);

// Feedback
export const submitFeedback = (projectId, data) =>
  api.post(`/feedback/${projectId}`, data).then((r) => r.data);
export const fetchFeedback = (projectId) => api.get(`/feedback/${projectId}`).then((r) => r.data);

export default api;
