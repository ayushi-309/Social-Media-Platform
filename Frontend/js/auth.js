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

  async loginWithDemoUser(username = 'ayushi') {
    try {
      await this.login(username, 'password123');
      return true;
    } catch (e) {
      const demoUsers = {
        'ayushi': { _id: 'demo-ayushi-id', name: 'Ayushi Tiwari', username: 'ayushi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120', followersCount: 1420, followingCount: 310 },
        'alex': { _id: 'demo-alex-id', name: 'Alex Rivera', username: 'alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120', followersCount: 980, followingCount: 240 },
        'sarah_tech': { _id: 'demo-sarah-id', name: 'Sarah Chen', username: 'sarah_tech', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120', followersCount: 2300, followingCount: 412 }
      };
      const user = demoUsers[username] || demoUsers['ayushi'];
      this.currentUser = user;
      api.setToken('demo-token-12345');
      localStorage.setItem('user', JSON.stringify(user));
      this.updateUserUI();
      return true;
    }
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
