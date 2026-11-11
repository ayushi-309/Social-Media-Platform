// Looply Application Controller & Router
const app = {
  currentView: 'feed',
  currentTheme: 'dark',
  selectedImageFile: null,
  storyTimer: null,

  async init() {
    this.initTheme();
    auth.init();
    this.setupEventListeners();
    await auth.checkAuth();

    this.renderLoopsTray();
    this.navigateTo('feed');
    this.loadSuggestedUsers();
  },

  initTheme() {
    const saved = localStorage.getItem('looply_theme') || 'dark';
    this.applyTheme(saved);
  },

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('looply_theme', theme);
    const label = document.getElementById('theme-label');
    if (label) label.textContent = theme === 'light' ? 'Light Mode' : 'Dark Mode';
    const mobileIcon = document.getElementById('mobile-theme-icon');
    if (mobileIcon) mobileIcon.textContent = theme === 'light' ? '☀️' : '🌙';
  },

  toggleTheme() {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    this.toast(`Switched to ${next === 'light' ? 'Light' : 'Dark'} mode`, 'info');
  },

  setupEventListeners() {
    // Post image file selector
    const fileInput = document.getElementById('composer-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.selectedImageFile = file;
          const reader = new FileReader();
          reader.onload = (event) => {
            const previewImg = document.getElementById('composer-image-preview');
            const previewWrap = document.getElementById('composer-image-preview-wrapper');
            if (previewImg && previewWrap) {
              previewImg.src = event.target.result;
              previewWrap.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Image URL input listener
    const urlInput = document.getElementById('composer-url-input');
    if (urlInput) {
      urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          const previewImg = document.getElementById('composer-image-preview');
          const previewWrap = document.getElementById('composer-image-preview-wrapper');
          if (previewImg && previewWrap) {
            previewImg.src = url;
            previewWrap.style.display = 'block';
          }
        }
      });
    }

    // Search bar listener with debouncing
    const searchInput = document.getElementById('search-users-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });
    }
  },

  renderLoopsTray() {
    const tray = document.getElementById('stories-tray');
    if (!tray) return;

    const loops = [
      { name: 'Your Loop', avatar: auth.currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800' },
      { name: 'ayushi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800' },
      { name: 'alex', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800' },
      { name: 'sarah_tech', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800' },
      { name: 'vibes_daily', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' },
      { name: 'minimal', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' }
    ];

    tray.innerHTML = loops.map((l) => `
      <div class="loop-story-item" onclick="app.openStoryViewer('${l.name}', '${l.image}', '${l.avatar}')">
        <div class="loop-ring">
          <img src="${l.avatar}" class="loop-story-avatar" alt="${l.name}" />
        </div>
        <span class="loop-story-username">${l.name}</span>
      </div>
    `).join('');
  },

  openStoryViewer(name, image, avatar) {
    const modal = document.getElementById('story-viewer-modal');
    if (!modal) return;

    document.getElementById('story-frame-name').textContent = name;
    document.getElementById('story-frame-avatar').src = avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + name;
    document.getElementById('story-image').src = image;
    document.getElementById('story-caption-overlay').textContent = `Loop moment from @${name} ✨`;

    const fill = document.getElementById('story-progress-fill');
    if (fill) fill.style.width = '0%';

    modal.classList.add('active');

    let progress = 0;
    clearInterval(this.storyTimer);
    this.storyTimer = setInterval(() => {
      progress += 2;
      if (fill) fill.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(this.storyTimer);
        this.closeStoryViewer();
      }
    }, 80);
  },

  closeStoryViewer() {
    clearInterval(this.storyTimer);
    const modal = document.getElementById('story-viewer-modal');
    if (modal) modal.classList.remove('active');
  },

  navigateTo(view, param = null) {
    this.currentView = view;

    const feedView = document.getElementById('feed-view');
    const profileView = document.getElementById('profile-view');
    const exploreView = document.getElementById('explore-view');
    const bookmarksView = document.getElementById('bookmarks-view');
    const sideBar = document.getElementById('looply-right-sidebar');

    document.querySelectorAll('.looply-nav-item').forEach((i) => i.classList.remove('active'));

    // Toggle right sidebar only via class, never inline display
    if (sideBar) {
      if (view === 'feed') {
        sideBar.classList.remove('hidden-sidebar');
      } else {
        sideBar.classList.add('hidden-sidebar');
      }
    }

    if (view === 'feed') {
      const nav = document.getElementById('nav-feed');
      if (nav) nav.classList.add('active');
      if (feedView) feedView.style.display = 'flex';
      if (profileView) profileView.style.display = 'none';
      if (exploreView) exploreView.style.display = 'none';
      if (bookmarksView) bookmarksView.style.display = 'none';
      feed.loadFeed();
    } else if (view === 'profile') {
      const nav = document.getElementById('nav-profile');
      if (nav) nav.classList.add('active');
      const identifier = param || (auth.currentUser ? auth.currentUser.username : null);
      if (!identifier) {
        this.showAuthModal('login');
        return;
      }
      if (feedView) feedView.style.display = 'none';
      if (exploreView) exploreView.style.display = 'none';
      if (bookmarksView) bookmarksView.style.display = 'none';
      if (profileView) profileView.style.display = 'block';
      profile.loadProfile(identifier);
    } else if (view === 'explore') {
      const nav = document.getElementById('nav-explore');
      if (nav) nav.classList.add('active');
      if (feedView) feedView.style.display = 'none';
      if (profileView) profileView.style.display = 'none';
      if (bookmarksView) bookmarksView.style.display = 'none';
      if (exploreView) exploreView.style.display = 'block';
      this.loadExplorePage();
    } else if (view === 'bookmarks') {
      const nav = document.getElementById('nav-bookmarks');
      if (nav) nav.classList.add('active');
      if (feedView) feedView.style.display = 'none';
      if (profileView) profileView.style.display = 'none';
      if (exploreView) exploreView.style.display = 'none';
      if (bookmarksView) bookmarksView.style.display = 'block';
      this.loadBookmarksPage();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async loadExplorePage() {
    const container = document.getElementById('explore-view');
    if (!container) return;
    container.innerHTML = '<div class="loader-spinner"></div>';

    try {
      const posts = await api.get('/posts');
      container.innerHTML = `
        <div style="padding: 10px 0;">
          <h2 style="font-family: var(--font-brand); font-size: 20px; font-weight: 800; margin-bottom: 16px;">Explore Loops</h2>
          ${profile.renderGrid(posts)}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="state-empty"><p>${err.message}</p></div>`;
    }
  },

  async loadBookmarksPage() {
    const container = document.getElementById('bookmarks-view');
    if (!container) return;
    container.innerHTML = '<div class="loader-spinner"></div>';

    const bookmarkedIds = this.getBookmarks();
    if (!bookmarkedIds || bookmarkedIds.length === 0) {
      container.innerHTML = `
        <div class="state-empty" style="padding: 60px 16px;">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p style="font-family: var(--font-brand); font-size: 18px; font-weight: 700; margin-top: 14px;">No Saved Loops</p>
          <p style="font-size: 13.5px; color: var(--text-muted); margin-top: 6px;">Save loops you want to revisit. Only you can view your saved collection.</p>
          <button class="btn-looply-primary" style="margin: 16px auto;" onclick="app.navigateTo('feed')">Explore Loops</button>
        </div>
      `;
      return;
    }

    try {
      const posts = await api.get('/posts');
      const saved = posts.filter((p) => bookmarkedIds.includes(p._id));
      container.innerHTML = `
        <div style="padding: 10px 0;">
          <h2 style="font-family: var(--font-brand); font-size: 20px; font-weight: 800; margin-bottom: 16px;">Saved Collection (${saved.length})</h2>
          ${profile.renderGrid(saved)}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="state-empty"><p>${err.message}</p></div>`;
    }
  },

  async loadSuggestedUsers() {
    const container = document.getElementById('suggested-users-list');
    if (!container) return;

    try {
      const list = await api.get('/users/suggested');
      if (!list || list.length === 0) {
        container.innerHTML = '<p style="font-size: 12px; color: var(--text-muted);">No new recommendations</p>';
        return;
      }

      container.innerHTML = list.map((u) => {
        const avatar = u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`;
        return `
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="app.navigateTo('profile', '${u.username}')">
              <img src="${avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 13px; font-weight: 700;">${this.escapeHtml(u.name)}</span>
                <span style="font-size: 11.5px; color: var(--text-muted);">@${this.escapeHtml(u.username)}</span>
              </div>
            </div>
            <button class="btn-looply-text" onclick="profile.toggleFollow('${u._id}'); this.textContent='Following';">Follow</button>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = '';
    }
  },

  async handleSearch(query) {
    if (!query || !query.trim()) {
      if (this.currentView === 'explore') this.loadExplorePage();
      return;
    }

    try {
      const results = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      if (this.currentView !== 'explore') this.navigateTo('explore');
      const container = document.getElementById('explore-view');
      if (!container) return;

      if (!results || results.length === 0) {
        container.innerHTML = `
          <div class="state-empty" style="padding: 60px 16px;">
            <p>No creators found matching "${this.escapeHtml(query)}"</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="padding: 10px 0;">
          <h2 style="font-family: var(--font-brand); font-size: 18px; font-weight: 800; margin-bottom: 16px;">Search Results for "${this.escapeHtml(query)}"</h2>
          <div style="display: flex; flex-direction: column; gap: 10px; max-width: 600px;">
            ${results.map((u) => {
              const avatar = u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`;
              return `
                <div class="looply-widget-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;">
                  <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="app.navigateTo('profile', '${u.username}')">
                    <img src="${avatar}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
                    <div>
                      <div style="font-weight: 700; font-size: 14px;">${this.escapeHtml(u.name)}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">@${this.escapeHtml(u.username)}</div>
                    </div>
                  </div>
                  <button class="btn-looply-outline" style="padding: 6px 14px; font-size: 12px;" onclick="profile.toggleFollow('${u._id}'); this.textContent='Following';">Follow</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  },

  filterByHashtag(tag) {
    this.navigateTo('feed');
    const filtered = feed.posts.filter((p) => p.content.toLowerCase().includes(tag.toLowerCase()));
    feed.renderFeed(filtered);
    this.toast(`Showing loops tagged with ${tag}`, 'info');
  },

  // Create Post
  showCreatePostModal() {
    if (!auth.isLoggedIn()) {
      this.showAuthModal('login');
      return;
    }
    const modal = document.getElementById('create-post-modal');
    if (modal) modal.classList.add('active');
  },

  insertEmoji(char) {
    const textarea = document.getElementById('composer-textarea');
    if (!textarea) return;
    textarea.value += char;
    textarea.focus();
  },

  removePostImagePreview() {
    this.selectedImageFile = null;
    const file = document.getElementById('composer-file-input');
    const url = document.getElementById('composer-url-input');
    const wrap = document.getElementById('composer-image-preview-wrapper');
    if (file) file.value = '';
    if (url) url.value = '';
    if (wrap) wrap.style.display = 'none';
  },

  async handlePublishPost() {
    const textarea = document.getElementById('composer-textarea');
    const urlInput = document.getElementById('composer-url-input');
    const content = textarea ? textarea.value.trim() : '';
    const imageUrl = urlInput ? urlInput.value.trim() : '';

    if (!content && !this.selectedImageFile && !imageUrl) {
      this.toast('Please write a caption or attach a photo', 'error');
      return;
    }

    const btn = document.getElementById('btn-publish-post');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Posting...';
    }

    try {
      let data;
      if (this.selectedImageFile) {
        const formData = new FormData();
        formData.append('content', content || '⚡ Looply moment');
        formData.append('image', this.selectedImageFile);
        data = await api.upload('/posts', formData);
      } else {
        data = await api.post('/posts', {
          content: content || '⚡ Looply moment',
          imageUrl: imageUrl || ''
        });
      }

      this.closeModal('create-post-modal');
      this.removePostImagePreview();
      if (textarea) textarea.value = '';

      this.toast('Loop published successfully! 🚀', 'success');
      this.navigateTo('feed');
    } catch (err) {
      this.toast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Post to Looply';
      }
    }
  },

  // Bookmarks
  getBookmarks() {
    const userKey = auth.currentUser ? auth.currentUser._id : 'guest';
    try {
      const data = localStorage.getItem(`looply_saved_${userKey}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isBookmarked(postId) {
    return this.getBookmarks().includes(postId);
  },

  toggleBookmark(postId) {
    const userKey = auth.currentUser ? auth.currentUser._id : 'guest';
    let list = this.getBookmarks();
    const btn = document.getElementById(`bookmark-btn-${postId}`);
    if (list.includes(postId)) {
      list = list.filter((id) => id !== postId);
      if (btn) btn.classList.remove('bookmarked');
      this.toast('Removed from Saved Loops', 'info');
    } else {
      list.push(postId);
      if (btn) btn.classList.add('bookmarked');
      this.toast('Saved to your collection! 🔖', 'success');
    }
    localStorage.setItem(`looply_saved_${userKey}`, JSON.stringify(list));
  },

  sharePost(postId) {
    const url = `${window.location.origin}/#loop-${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.toast('Loop link copied to clipboard! 📋', 'success');
      });
    } else {
      this.toast('Link: ' + url, 'info');
    }
  },

  openLightbox(img) {
    this.openStoryViewer('Loop Photo', img, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100');
  },

  // Auth Modals
  showAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.switchAuthTab(tab);
    modal.classList.add('active');
  },

  switchAuthTab(tab) {
    const loginForm = document.getElementById('auth-login-form');
    const registerForm = document.getElementById('auth-register-form');
    const title = document.getElementById('auth-modal-title');
    if (tab === 'login') {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      if (title) title.textContent = 'Welcome to Looply';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      if (title) title.textContent = 'Join Looply';
    }
  },

  async quickLogin(username, password) {
    try {
      this.closeModal('auth-modal');
      await auth.login(username, password);
      this.toast(`Welcome back, @${auth.currentUser.username}! ⚡`, 'success');
      this.navigateTo('feed');
      this.loadSuggestedUsers();
    } catch (err) {
      this.toast(err.message, 'error');
    }
  },

  async handleLoginForm(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-submit-login');
    btn.disabled = true;

    try {
      await auth.login(identifier, password);
      this.closeModal('auth-modal');
      this.toast('Signed in successfully!', 'success');
      this.navigateTo('feed');
      this.loadSuggestedUsers();
    } catch (err) {
      this.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  },

  async handleRegisterForm(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const bio = document.getElementById('reg-bio').value.trim();
    const btn = document.getElementById('btn-submit-register');
    btn.disabled = true;

    try {
      await auth.register({ username, name, email, password, bio });
      this.closeModal('auth-modal');
      this.toast('Welcome to Looply! Your account is ready.', 'success');
      this.navigateTo('feed');
    } catch (err) {
      this.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  },

  showEditProfileModal() {
    if (!auth.currentUser) return;
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;
    document.getElementById('edit-name').value = auth.currentUser.name || '';
    document.getElementById('edit-bio').value = auth.currentUser.bio || '';
    modal.classList.add('active');
  },

  async handleEditProfileForm(e) {
    e.preventDefault();
    const name = document.getElementById('edit-name').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const avatarUrl = document.getElementById('edit-avatar-url').value.trim();
    const avatarFile = document.getElementById('edit-avatar-file').files[0];

    try {
      let payload;
      if (avatarFile) {
        payload = new FormData();
        payload.append('name', name);
        payload.append('bio', bio);
        payload.append('avatar', avatarFile);
      } else {
        payload = { name, bio, avatarUrl };
      }
      await auth.updateProfile(payload);
      this.closeModal('edit-profile-modal');
      this.toast('Profile updated!', 'success');
      if (this.currentView === 'profile') {
        profile.loadProfile(auth.currentUser.username);
      }
    } catch (err) {
      this.toast(err.message, 'error');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, 3000);
  },

  formatTimeAgo(dateString) {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
