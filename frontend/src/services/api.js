// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }
  
  async request(endpoint, options = {}) {
    const headers = {
      ...options.headers,
      ...(this.token && { Authorization: `Bearer ${this.token}` })
    };
    
    // Only add Content-Type if not FormData (browser sets it for FormData)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const config = {
      ...options,
      headers
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
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  }
  
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Save tokens after registration
    this.token = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  }
  
  logout() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  isLoggedIn() {
    return !!localStorage.getItem('accessToken');
  }
  
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  // Listings
  async getListings(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/listings?${query}`);
  }
  
  async createListing(data) {
    const formData = new FormData();
    
    // Add simple fields
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('description', data.description);
    
    // Add type-specific data as JSON string
    if (data.housing) {
      formData.append('housing', JSON.stringify(data.housing));
    }
    if (data.marketplace) {
      formData.append('marketplace', JSON.stringify(data.marketplace));
    }
    if (data.buddy) {
      formData.append('buddy', JSON.stringify(data.buddy));
    }
    
    // Add images
    if (data.images && data.images.length > 0) {
      data.images.forEach(img => formData.append('images', img));
    }
    
    return this.request('/listings', {
      method: 'POST',
      body: formData
    });
  }
}

export default new ApiService();