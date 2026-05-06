import api from "./client";

export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }).then((response) => response.data),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }).then((response) => response.data),
  logout: () => api.post("/auth/logout").then((response) => response.data),
  me: () => api.get("/auth/me").then((response) => response.data),
  changePassword: (currentPassword, newPassword) =>
    api.post("/auth/change-password", { currentPassword, newPassword }).then((response) => response.data),
};

export const childrenAPI = {
  list: (params = {}) => api.get("/children", { params }).then((response) => response.data),
  get: (id) => api.get(`/children/${id}`).then((response) => response.data),
  summary: (id) => api.get(`/children/${id}/summary`).then((response) => response.data),
  create: (data) => api.post("/children", data).then((response) => response.data),
  update: (id, data) => api.put(`/children/${id}`, data).then((response) => response.data),
  delete: (id) => api.delete(`/children/${id}`).then((response) => response.data),
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api
      .post(`/children/${id}/photo`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((response) => response.data);
  },
};

export const iepAPI = {
  list: (childId) => api.get("/iep", { params: { childId } }).then((response) => response.data),
  create: (data) => api.post("/iep", data).then((response) => response.data),
  update: (id, data) => api.put(`/iep/${id}`, data).then((response) => response.data),
  getGoals: (iepId) => api.get(`/iep/${iepId}/goals`).then((response) => response.data),
  addGoal: (iepId, data) => api.post(`/iep/${iepId}/goals`, data).then((response) => response.data),
  updateGoal: (goalId, data) => api.put(`/iep/goals/${goalId}`, data).then((response) => response.data),
  updateProgress: (goalId, pct, note, status) =>
    api.patch(`/iep/goals/${goalId}/progress`, { pct, note, status }).then((response) => response.data),
  deleteGoal: (goalId) => api.delete(`/iep/goals/${goalId}`).then((response) => response.data),
  addService: (iepId, data) => api.post(`/iep/${iepId}/services`, data).then((response) => response.data),
  deleteService: (serviceId) => api.delete(`/iep/services/${serviceId}`).then((response) => response.data),
};

export const assessmentsAPI = {
  list: (params = {}) => api.get("/assessments", { params }).then((response) => response.data),
  create: (data) => api.post("/assessments", data).then((response) => response.data),
  update: (id, data) => api.put(`/assessments/${id}`, data).then((response) => response.data),
  gap: (childId) => api.get(`/assessments/gap/${childId}`).then((response) => response.data),
  delete: (id) => api.delete(`/assessments/${id}`).then((response) => response.data),
};

export const interventionsAPI = {
  list: (params = {}) => api.get("/interventions", { params }).then((response) => response.data),
  create: (data) => api.post("/interventions", data).then((response) => response.data),
  update: (id, data) => api.put(`/interventions/${id}`, data).then((response) => response.data),
  delete: (id) => api.delete(`/interventions/${id}`).then((response) => response.data),
  summary: (params = {}) => api.get("/interventions/summary", { params }).then((response) => response.data),
};

export const devicesAPI = {
  catalog: (disability) =>
    api.get("/devices/catalog", { params: disability ? { disability } : {} }).then((response) => response.data),
  list: (params = {}) => api.get("/devices", { params }).then((response) => response.data),
  create: (data) => api.post("/devices", data).then((response) => response.data),
  update: (id, data) => api.put(`/devices/${id}`, data).then((response) => response.data),
  stats: () => api.get("/devices/stats").then((response) => response.data),
};

export const reportsAPI = {
  generate: (params) => api.post("/reports/generate", params).then((response) => response.data),
  get: (jobId) => api.get(`/reports/${jobId}`).then((response) => response.data),
  list: () => api.get("/reports").then((response) => response.data),
};

export const aiAPI = {
  generateGoals: (data) => api.post("/ai/goals", data, { timeout: 60000 }).then((response) => response.data),
  interventionSuggest: (data) =>
    api.post("/ai/intervention-suggestions", data, { timeout: 30000 }).then((response) => response.data),
  progressSummary: (data) =>
    api.post("/ai/progress-summary", data, { timeout: 30000 }).then((response) => response.data),
};

export const dashboardAPI = {
  get: () => api.get("/dashboard").then((response) => response.data),
};

export const adminAPI = {
  listUsers: (params = {}) => api.get("/admin/users", { params }).then((response) => response.data),
  createUser: (data) => api.post("/admin/users", data).then((response) => response.data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data).then((response) => response.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((response) => response.data),
  getFields: (module) => api.get(`/admin/form-fields/${module}`).then((response) => response.data),
  createField: (data) => api.post("/admin/form-fields", data).then((response) => response.data),
  updateField: (id, data) => api.put(`/admin/form-fields/${id}`, data).then((response) => response.data),
  deleteField: (id) => api.delete(`/admin/form-fields/${id}`).then((response) => response.data),
  auditLog: (params = {}) => api.get("/admin/audit-log", { params }).then((response) => response.data),
  health: () => api.get("/admin/health").then((response) => response.data),
};

export const locationsAPI = {
  tree: () => api.get("/locations").then((response) => response.data),
  blocks: (districtId) => api.get("/locations/blocks", { params: { districtId } }).then((response) => response.data),
  create: (data) => api.post("/locations", data).then((response) => response.data),
  update: (id, data) => api.put(`/locations/${id}`, data).then((response) => response.data),
};

export const notificationsAPI = {
  list: (params = {}) => api.get("/notifications", { params }).then((response) => response.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((response) => response.data),
  markAllRead: () => api.patch("/notifications/mark-all-read").then((response) => response.data),
};

export { default as apiClient } from "./client";
