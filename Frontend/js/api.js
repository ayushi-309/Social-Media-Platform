// API Client with automatic token attachment and base URL detection
const API_BASE = window.location.origin.includes('5000')
  ? `${window.location.origin}/api`
  : 'https://social-media-platform-fcg2.onrender.com/api';

const api = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, could clear token
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
          this.setToken(null);
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
      headers: this.getHeaders()
    });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
  },

  upload(endpoint, formData, method = 'POST') {
    return this.request(endpoint, {
      method,
      headers: this.getHeaders(true),
      body: formData
    });
  }
};

