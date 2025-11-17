// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }
  
  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      }
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Try to refresh token
      await this.refreshToken();
      // Retry request
      return this.request(endpoint, options);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  }
  
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      window.location.href = '/login';
      return;
    }
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      window.location.href = '/login';
      return;
    }
    
    const data = await response.json();
    this.token = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }
  
  // Auth methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    this.token = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data;
  }
  
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
  
  // Listings
  async getListings(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/listings?${query}`);
  }
  
  async createListing(data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images') {
        data.images.forEach(img => formData.append('images', img));
      } else {
        formData.append(key, JSON.stringify(data[key]));
      }
    });
    
    return this.request('/listings', {
      method: 'POST',
      headers: {}, // Let browser set multipart headers
      body: formData
    });
  }
}

export default new ApiService();