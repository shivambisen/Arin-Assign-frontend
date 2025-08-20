export interface User {
  id: number;
  email: string;
}

export interface Metric {
  id: number;
  campaign_name: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface CreateMetricData {
  campaign_name: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface MediaItem {
  id: number;
  filename: string;
  originalname?: string;
  mimetype: string;
  size?: number;
  url: string;
  created_at?: string;
  metric_id?: number;
  user_id?: number;
} 