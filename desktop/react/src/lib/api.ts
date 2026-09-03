import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import type { AuthUser, ChatMessage } from '../types';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token || localStorage.getItem('codemind-auth-token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 & token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('codemind-refresh-token');

      if (!refreshToken) {
        isRefreshing = false;
        useAuthStore.getState().logout();
        useAuthStore.getState().setCurrentView('login');
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{ accessToken: string }>(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        localStorage.setItem('codemind-auth-token', newAccessToken);

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().login(currentUser, newAccessToken);
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        localStorage.removeItem('codemind-refresh-token');
        useAuthStore.getState().logout();
        useAuthStore.getState().setCurrentView('login');

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed API Endpoints ──────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPreferences {
  theme?: string;
  fontSize?: number;
  aiProvider?: string;
  [key: string]: any;
}

export interface ProjectItem {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIActionResponse {
  result: string;
  explanation?: string;
  code?: string;
}

// 1. Auth API
export const authApi = {
  register: async (data: { email: string; password: string; name: string }): Promise<AuthTokens> => {
    const res = await api.post<AuthTokens>('/auth/register', data);
    if (res.data.refreshToken) {
      localStorage.setItem('codemind-refresh-token', res.data.refreshToken);
    }
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthTokens> => {
    const res = await api.post<AuthTokens>('/auth/login', data);
    if (res.data.refreshToken) {
      localStorage.setItem('codemind-refresh-token', res.data.refreshToken);
    }
    return res.data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const res = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
    return res.data;
  },

  logout: async (refreshToken?: string): Promise<{ message: string }> => {
    const token = refreshToken || localStorage.getItem('codemind-refresh-token') || '';
    try {
      const res = await api.post<{ message: string }>('/auth/logout', { refreshToken: token });
      return res.data;
    } finally {
      localStorage.removeItem('codemind-refresh-token');
    }
  },
};

// 2. Users API
export const usersApi = {
  getMe: async (): Promise<AuthUser> => {
    const res = await api.get<AuthUser>('/users/me');
    return res.data;
  },

  updateMe: async (data: { name?: string }): Promise<AuthUser> => {
    const res = await api.patch<AuthUser>('/users/me', data);
    return res.data;
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const res = await api.get<UserPreferences>('/users/me/preferences');
    return res.data;
  },

  updatePreferences: async (data: UserPreferences): Promise<UserPreferences> => {
    const res = await api.patch<UserPreferences>('/users/me/preferences', data);
    return res.data;
  },
};

// 3. Projects API
export const projectsApi = {
  create: async (data: { name: string; path: string }): Promise<ProjectItem> => {
    const res = await api.post<ProjectItem>('/projects', data);
    return res.data;
  },

  list: async (): Promise<ProjectItem[]> => {
    const res = await api.get<ProjectItem[]>('/projects');
    return res.data;
  },

  get: async (id: string): Promise<ProjectItem> => {
    const res = await api.get<ProjectItem>(`/projects/${id}`);
    return res.data;
  },

  update: async (id: string, data: { name?: string; path?: string }): Promise<ProjectItem> => {
    const res = await api.patch<ProjectItem>(`/projects/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/projects/${id}`);
    return res.data;
  },
};

// 4. Files API
export const filesApi = {
  create: async (data: { name: string; path: string; projectId: string }): Promise<FileItem> => {
    const res = await api.post<FileItem>('/files', data);
    return res.data;
  },

  list: async (projectId: string): Promise<FileItem[]> => {
    const res = await api.get<FileItem[]>('/files', { params: { projectId } });
    return res.data;
  },

  getRecent: async (): Promise<FileItem[]> => {
    const res = await api.get<FileItem[]>('/files/recent');
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/files/${id}`);
    return res.data;
  },
};

// 5. Chat API
export const chatApi = {
  createSession: async (data?: { projectId?: string; title?: string }): Promise<ChatSessionItem> => {
    const res = await api.post<ChatSessionItem>('/chat/sessions', data || {});
    return res.data;
  },

  listSessions: async (): Promise<ChatSessionItem[]> => {
    const res = await api.get<ChatSessionItem[]>('/chat/sessions');
    return res.data;
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
    return res.data;
  },

  sendMessage: async (sessionId: string, content: string): Promise<ChatMessage> => {
    const res = await api.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, { content });
    return res.data;
  },

  deleteSession: async (sessionId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/chat/sessions/${sessionId}`);
    return res.data;
  },
};

// 6. AI API
export const aiApi = {
  chat: async (
    messages: ChatMessage[],
    options?: Record<string, any>,
    provider?: string
  ): Promise<{ response: string; metadata?: any }> => {
    const res = await api.post('/ai/chat', { messages, options, provider });
    return res.data;
  },

  stream: async (
    messages: ChatMessage[],
    options?: Record<string, any>,
    provider?: string
  ): Promise<Response> => {
    const token = useAuthStore.getState().token || localStorage.getItem('codemind-auth-token');
    return fetch(`${baseURL}/ai/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, options, provider }),
    });
  },

  action: async (data: {
    action: string;
    code: string;
    language: string;
    context?: string;
    provider?: string;
  }): Promise<AIActionResponse> => {
    const res = await api.post<AIActionResponse>('/ai/actions', data);
    return res.data;
  },
};

export default api;
