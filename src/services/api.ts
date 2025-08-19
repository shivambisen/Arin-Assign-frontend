import axios from 'axios';
import type { LoginCredentials, SignupCredentials, AuthResponse, Metric, CreateMetricData, MediaItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', credentials);
    return response.data;
  },
};

// Metrics API
export const metricsAPI = {
  getMetrics: async (campaignName?: string): Promise<Metric[]> => {
    const params = campaignName ? { campaign_name: campaignName } : {};
    const response = await api.get('/metrics', { params });
    return response.data;
  },

  createMetric: async (metricData: CreateMetricData): Promise<Metric> => {
    const response = await api.post('/metrics', metricData);
    return response.data;
  },

  updateMetric: async (id: number, metricData: CreateMetricData): Promise<Metric> => {
    const response = await api.put(`/metrics/${id}`, metricData);
    return response.data;
  },

  deleteMetric: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/metrics/${id}`);
    return response.data;
  },

  uploadMedia: async (
    id: number,
    files: File[] | FileList,
    onProgress?: (percent: number) => void
  ): Promise<{ files: MediaItem[] }> => {
    const formData = new FormData();
    const arr = Array.from(files as FileList);
    arr.forEach((file) => formData.append('files', file));
    const response = await api.post(`/metrics/${id}/media`, formData, {
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          if (onProgress) onProgress(percent);
        }
      }
    });
    return response.data;
  },

  listMedia: async (id: number): Promise<{ files: MediaItem[] }> => {
    const response = await api.get(`/metrics/${id}/media`);
    return response.data;
  }
};

export default api; 