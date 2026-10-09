
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) headers.set('Authorization', 'Bearer ' + token);
  if (!options.body || typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(API_URL + endpoint, { ...options, headers });
  const data = await response.json();
  
  if (!response.ok) throw new Error(data.message || 'API Error');
  return data;
};
