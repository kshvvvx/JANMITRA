import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

export interface UserInfo {
  id: string;
  citizen_id?: string;
  staff_id?: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'citizen' | 'staff' | 'supervisor';
  department?: string;
}

// Get stored auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get stored user info
export const getUserInfo = async (): Promise<UserInfo | null> => {
  try {
    const userInfoString = await AsyncStorage.getItem('userInfo');
    return userInfoString ? JSON.parse(userInfoString) : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// Clear authentication data (logout)
export const clearAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['authToken', 'userInfo']);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Create authenticated API request headers
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Authenticated fetch wrapper
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = await getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
};

// API base URL is imported from config

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  CITIZEN_SEND_OTP: `${API_BASE_URL}/auth/citizen/send-otp`,
  CITIZEN_VERIFY_OTP: `${API_BASE_URL}/auth/citizen/verify-otp`,
  STAFF_LOGIN: `${API_BASE_URL}/auth/staff/login`,
  GET_PROFILE: `${API_BASE_URL}/auth/me`,
  UPDATE_PROFILE: `${API_BASE_URL}/auth/me`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  
  // Complaint endpoints
  COMPLAINTS: `${API_BASE_URL}/complaints`,
  COMPLAINT_BY_ID: (id: string) => `${API_BASE_URL}/complaints/${id}`,
  NEARBY_COMPLAINTS: (lat: number, lng: number, radius?: number) => 
    `${API_BASE_URL}/complaints/nearby/${lat}/${lng}${radius ? `?radius=${radius}` : ''}`,
  UPVOTE_COMPLAINT: (id: string) => `${API_BASE_URL}/complaints/${id}/upvote`,
  UPDATE_COMPLAINT_STATUS: (id: string) => `${API_BASE_URL}/complaints/${id}/status`,
  REFILE_COMPLAINT: (id: string) => `${API_BASE_URL}/complaints/${id}/refile`,
  CONFIRM_RESOLUTION: (id: string) => `${API_BASE_URL}/complaints/${id}/confirm_resolution`,
  
  // Push notification endpoints
  SAVE_PUSH_TOKEN: `${API_BASE_URL}/auth/push-token`,
};
