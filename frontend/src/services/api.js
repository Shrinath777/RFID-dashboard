import axios from 'axios';

// ✅ CORRECT: Backend runs on port 3000
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - NEW (Session-based)
api.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`;
    }
    return config;
  }
);

// Response interceptor - NEW (Session-based)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Bypassing 401 redirect for showcase mode');
    }
    return Promise.reject(error);
  }
);

// ==================== HEALTH CHECK ====================
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error(`Backend not reachable: ${error.message}`);
  }
};

// ==================== AUTHENTICATION APIs ====================
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  
  if (response.data.sessionId) {
    localStorage.setItem('sessionId', response.data.sessionId);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
  } else {
    console.log('❌ No sessionId in response:', response.data);
  }
  
  return response.data;
};

export const logout = async () => {
  localStorage.removeItem('sessionId');
  localStorage.removeItem('user');
  
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    return { success: true, message: 'Logged out locally' };
  }
};

export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/check');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
    }
    throw error;
  }
};

// ==================== USER MANAGEMENT APIs ====================
export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const assignNodeToUser = async (user_id, node_id) => {
  const response = await api.post('/admin/assign-node', { user_id, node_id });
  return response.data;
};

// ✅ FIXED: Consistent axios usage
export const removeNodeFromUser = async (userId, nodeId) => {
  const response = await api.delete(`/admin/user-nodes/${userId}/${nodeId}`);
  return response.data;
};

// ==================== NODE MANAGEMENT APIs ====================
export const getNodes = async () => {
  const response = await api.get('/nodes');
  return response.data;
};

export const createNode = async (nodeData) => {
  const response = await api.post('/admin/nodes', nodeData);
  return response.data;
};

export const updateNode = async (node_id, updates) => {
  const response = await api.put(`/admin/nodes/${node_id}`, updates);
  return response.data;
};

export const deleteNode = async (node_id) => {
  const response = await api.delete(`/admin/nodes/${node_id}`);
  return response.data;
};

// ==================== ACCESS LOGS API ====================
export const getAccessLogs = async (filters = {}) => {
  const response = await api.get('/admin/access-logs', { params: filters });
  return response.data;
};

// ==================== SYSTEM STATS API ====================
export const getSystemStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export default api;