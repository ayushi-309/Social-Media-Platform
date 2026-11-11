// Looply Authentication Manager
const auth = {
  currentUser: null,

  init() {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse cached user', e);
    }
  },

  isLoggedIn() {
    return !!api.getToken() && !!this.currentUser;
  },

  async checkAuth() {
    if (!api.getToken()) {
      this.currentUser = null;
      localStorage.removeItem('user');
      this.updateUserUI();
      return null;
    }
    try {
      const data = await api.get('/auth/me');
      this.currentUser = data;
      localStorage.setItem('user', JSON.stringify(data));
      this.updateUserUI();
      return data;
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      this.currentUser = null;
      api.setToken(null);
      localStorage.removeItem('user');
      this.updateUserUI();
      return null;
    }
  },

  async login(identifier, password) {
    const data = await api.post('/auth/login', { identifier, password });
    api.setToken(data.token);
    this.currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    this.updateUserUI();
    return data;
  },

  async register(formData) {
    let data;
    if (formData instanceof FormData) {
      data = await api.upload('/auth/register', formData);
    } else {
      data = await api.post('/auth/register', formData);
    }

    api.setToken(data.token);
    this.currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    this.updateUserUI();
    return data;
  },

  logout() {
    api.setToken(null);
    this.currentUser = null;
    localStorage.removeItem('user');
    this.updateUserUI();
    window.location.reload();
  },

  async updateProfile(formData) {
    let data;
    if (formData instanceof FormData) {
      data = await api.upload('/auth/profile', formData, 'PUT');
    } else {
      data = await api.put('/auth/profile', formData);
    }
    this.currentUser = { ...this.currentUser, ...data.user };
    localStorage.setItem('user', JSON.stringify(this.currentUser));
    this.updateUserUI();
    return data;
  },

  updateUserUI() {
    const user = this.currentUser;
    const navAvatar = document.getElementById('sidebar-user-avatar');
    const sideUserBox = document.getElementById('looply-side-current-user');
    const loginPrompt = document.getElementById('login-prompt-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
      const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`;
      if (navAvatar) navAvatar.src = avatarUrl;

      if (sideUserBox) {
        sideUserBox.style.display = 'flex';
        const sideAvatar = document.getElementById('looply-side-avatar');
        const sideUsername = document.getElementById('looply-side-username');
        const sideName = document.getElementById('looply-side-name');
        if (sideAvatar) sideAvatar.src = avatarUrl;
        if (sideUsername) sideUsername.textContent = `@${user.username}`;
        if (sideName) sideName.textContent = user.name;
      }

      if (loginPrompt) loginPrompt.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'flex';
    } else {
      if (navAvatar) navAvatar.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=guest';
      if (sideUserBox) sideUserBox.style.display = 'none';
      if (loginPrompt) loginPrompt.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }
};
