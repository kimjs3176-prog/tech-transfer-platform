import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "/_/backend/api/v1";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ---- 신청 관리 ----
export const applicationApi = {
  list: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get("/applications", { params }),
  get: (id: number) => api.get(`/applications/${id}`),
  create: (data: object) => api.post("/applications", data),
  update: (id: number, data: object) => api.patch(`/applications/${id}`, data),
  reject: (id: number, reason: string) =>
    api.post(`/applications/${id}/reject`, null, { params: { reason } }),
};

// ---- 계약 관리 ----
export const contractApi = {
  list: (params?: { status?: string }) => api.get("/contracts", { params }),
  get: (id: number) => api.get(`/contracts/${id}`),
  create: (data: object) => api.post("/contracts", data),
  update: (id: number, data: object) => api.patch(`/contracts/${id}`, data),
  download: (id: number) =>
    api.get(`/contracts/${id}/download`, { responseType: "blob" }),
};

// ---- 결재 워크플로 ----
export const approvalApi = {
  getWorkflow: (contractId: number) =>
    api.get(`/approvals/contracts/${contractId}/workflow`),
  startWorkflow: (contractId: number) =>
    api.post(`/approvals/contracts/${contractId}/workflow/start`),
  submitInventorOpinion: (contractId: number, opinion: string) =>
    api.post(`/approvals/contracts/${contractId}/workflow/inventor-opinion`, { opinion }),
  review: (contractId: number, result: "approved" | "rejected", comment?: string) =>
    api.post(`/approvals/contracts/${contractId}/workflow/review`, { result, comment }),
  deptApproval: (contractId: number, result: "approved" | "rejected", comment?: string) =>
    api.post(`/approvals/contracts/${contractId}/workflow/dept-approval`, { result, comment }),
  getHistory: (contractId: number) =>
    api.get(`/approvals/contracts/${contractId}/workflow/history`),
};

// ---- 업체정보관리 ----
export const companyApi = {
  list: (params?: { keyword?: string }) => api.get("/companies/", { params }),
  stats: () => api.get("/companies/stats"),
  get: (id: number) => api.get(`/companies/${id}`),
  create: (data: object) => api.post("/companies/", data),
  update: (id: number, data: object) => api.patch(`/companies/${id}`, data),
  delete: (id: number) => api.delete(`/companies/${id}`),
};

// ---- 사후관리 ----
export const performanceApi = {
  list: (params?: { contract_id?: number; year?: number }) =>
    api.get("/performance-reports/", { params }),
  stats: () => api.get("/performance-reports/stats"),
  create: (data: object) => api.post("/performance-reports/", data),
  get: (id: number) => api.get(`/performance-reports/${id}`),
};

// ---- 대시보드 ----
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};

// ---- 특허 검색 (KIPRIS) ----
export const patentApi = {
  search: (q: string, page = 1, perPage = 10) =>
    api.get("/patents/search", { params: { q, page, per_page: perPage } }),
  get: (patentNo: string) => api.get(`/patents/${encodeURIComponent(patentNo)}`),
};

// ---- 사용자 검색 (발명자 배정용) ----
export const userApi = {
  search: (name: string, role?: string) =>
    api.get("/users/search", { params: { name, role } }),
  searchInventors: (names: string) =>
    api.get("/users/inventors", { params: { names } }),
};
