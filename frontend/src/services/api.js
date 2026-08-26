import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// Projects
export const fetchProjects = () => api.get("/projects").then((r) => r.data);
export const fetchProject = (id) => api.get(`/projects/${id}`).then((r) => r.data);
export const fetchProjectMap = (id) => api.get(`/projects/${id}/map`).then((r) => r.data);

// Evidence
export const fetchEvidence = (projectId) => api.get(`/evidence/${projectId}`).then((r) => r.data);

// Flags
export const fetchFlags = (projectId) => api.get(`/flags/${projectId}`).then((r) => r.data);
export const fetchAllFlags = () => api.get("/flags").then((r) => r.data);

// Copilot
export const generateChecklist = (projectId) =>
  api.post(`/copilot/${projectId}/checklist`).then((r) => r.data);

// Feedback
export const submitFeedback = (projectId, data) =>
  api.post(`/feedback/${projectId}`, data).then((r) => r.data);
export const fetchFeedback = (projectId) =>
  api.get(`/feedback/${projectId}`).then((r) => r.data);

export default api;
