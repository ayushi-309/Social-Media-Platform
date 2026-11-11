// Looply Profile Manager
const profile = {
  currentProfileUser: null,
  userPosts: [],
  activeTab: 'grid', // 'grid' or 'feed'

  async loadProfile(identifier) {
    const profileView = document.getElementById('profile-view');
    const feedView = document.getElementById('feed-view');
    const exploreView = document.getElementById('explore-view');
    const bookmarksView = document.getElementById('bookmarks-view');
    const sideBar = document.getElementById('looply-right-sidebar');

    if (feedView) feedView.style.display = 'none';
    if (exploreView) exploreView.style.display = 'none';
    if (bookmarksView) bookmarksView.style.display = 'none';
    if (sideBar) sideBar.style.display = 'none';

    if (profileView) {
      profileView.style.display = 'block';
      profileView.innerHTML = '<div class="loader-spinner"></div>';
    }

    try {
      const user = await api.get(`/users/${identifier}`);
      this.currentProfileUser = user;
      const posts = await api.get(`/posts/user/${user._id}`);
      this.userPosts = posts || [];
      this.renderProfile(user, posts);
    } catch (err) {
      if (profileView) {
        profileView.innerHTML = `
          <div class="state-empty">
            <p style="color: var(--looply-like);">User not found: ${err.message}</p>
            <button class="btn-looply-primary" style="margin: 12px auto;" onclick="app.navigateTo('feed')">Back to Feed</button>
          </div>
        `;
      }
    }
  },

  renderProfile(user, posts) {
    const profileView = document.getElementById('profile-view');
    if (!profileView) return;

    const isSelf = auth.currentUser && auth.currentUser._id === user._id;
    const isFollowing = !!user.isFollowing;
    const avatar = user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`;
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Nov 2026';

    let actionBtnHtml = '';
    if (isSelf) {
      actionBtnHtml = `
        <button class="looply-btn-profile" onclick="app.showEditProfileModal()">Edit Profile</button>
        <button class="looply-btn-profile" onclick="auth.logout()">Sign Out</button>
      `;
    } else {
      actionBtnHtml = `
        <button 
          id="btn-follow-profile" 
          class="looply-btn-profile ${isFollowing ? '' : 'btn-follow'}" 
          onclick="profile.toggleFollow('${user._id}')"
        >
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    }

    profileView.innerHTML = `
      <div style="padding-top: 8px;">
        <!-- Header -->
        <div class="looply-profile-header">
          <div class="looply-profile-avatar-ring">
            <img src="${avatar}" class="looply-profile-avatar" alt="${user.name}" />
          </div>

          <div class="looply-profile-info">
            <div class="looply-profile-top-row">
              <span class="looply-profile-username">${app.escapeHtml(user.username)}</span>
              ${actionBtnHtml}
            </div>

            <div class="looply-profile-stats">
              <div><span class="looply-profile-stat-count">${user.postCount || posts.length || 0}</span> Loops</div>
              <div style="cursor: pointer;" onclick="profile.showUserListModal('Followers', '${user._id}')">
                <span class="looply-profile-stat-count" id="profile-followers-count">${user.followersCount || 0}</span> Followers
              </div>
              <div style="cursor: pointer;" onclick="profile.showUserListModal('Following', '${user._id}')">
                <span class="looply-profile-stat-count" id="profile-following-count">${user.followingCount || 0}</span> Following
              </div>
            </div>

            <div class="looply-profile-bio-box">
              <span class="looply-profile-fullname">${app.escapeHtml(user.name)}</span>
              <span style="color: var(--text-secondary); margin-top: 2px;">${app.escapeHtml(user.bio || 'Creator on Looply')}</span>
              <span style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">Joined ${joined}</span>
            </div>
          </div>
        </div>

        <!-- View Switch Tabs -->
        <div class="looply-profile-view-tabs">
          <div class="looply-profile-tab-btn active" id="tab-profile-grid" onclick="profile.switchViewTab('grid')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            GRID
          </div>
          <div class="looply-profile-tab-btn" id="tab-profile-feed" onclick="profile.switchViewTab('feed')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            TIMELINE
          </div>
        </div>

        <!-- Profile Content Stream -->
        <div id="profile-content-stream">
          ${this.renderGrid(posts)}
        </div>
      </div>
    `;
  },

  renderGrid(posts) {
    if (!posts || posts.length === 0) {
      return `
        <div class="state-empty">
          <p>No loops shared yet</p>
        </div>
      `;
    }

    return `
      <div class="looply-grid-container">
        ${posts.map((post) => {
          const img = post.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
          return `
            <div class="looply-grid-item" onclick="app.openLightbox('${img}')">
              <img src="${img}" alt="Loop" />
              <div class="looply-grid-overlay">
                <div>❤️ ${post.likesCount || 0}</div>
                <div>💬 ${post.commentsCount || 0}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderFeedTimeline(posts) {
    if (!posts || posts.length === 0) {
      return `<div class="state-empty"><p>No loops published yet</p></div>`;
    }
    return `
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 630px; margin: 16px auto;">
        ${posts.map((p) => feed.renderPostCard(p)).join('')}
      </div>
    `;
  },

  switchViewTab(tab) {
    this.activeTab = tab;
    const tabGrid = document.getElementById('tab-profile-grid');
    const tabFeed = document.getElementById('tab-profile-feed');
    const stream = document.getElementById('profile-content-stream');
    if (!stream) return;

    if (tab === 'feed') {
      if (tabFeed) tabFeed.classList.add('active');
      if (tabGrid) tabGrid.classList.remove('active');
      stream.innerHTML = this.renderFeedTimeline(this.userPosts);
    } else {
      if (tabGrid) tabGrid.classList.add('active');
      if (tabFeed) tabFeed.classList.remove('active');
      stream.innerHTML = this.renderGrid(this.userPosts);
    }
  },

  async toggleFollow(targetUserId) {
    if (!auth.isLoggedIn()) {
      app.showAuthModal('login');
      return;
    }

    const btn = document.getElementById('btn-follow-profile');
    const followerCountSpan = document.getElementById('profile-followers-count');

    try {
      const res = await api.post(`/users/${targetUserId}/follow`);
      if (btn) {
        if (res.isFollowing) {
          btn.textContent = 'Following';
          btn.classList.remove('btn-follow');
        } else {
          btn.textContent = 'Follow';
          btn.classList.add('btn-follow');
        }
      }

      if (followerCountSpan) {
        followerCountSpan.textContent = res.followersCount;
      }

      app.toast(res.message, 'success');
      app.loadSuggestedUsers();
    } catch (err) {
      app.toast(err.message, 'error');
    }
  },

  async showUserListModal(title, userId) {
    try {
      const user = await api.get(`/users/${userId}`);
      const list = title === 'Followers' ? user.followers : user.following;

      let html = `
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close-btn" onclick="app.closeModal('general-modal')">✕</button>
          </div>
          <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
      `;

      if (!list || list.length === 0) {
        html += `<p style="color: var(--text-muted); text-align: center; padding: 20px;">No ${title.toLowerCase()} found.</p>`;
      } else {
        list.forEach((u) => {
          const avatar = u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`;
          html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0;">
              <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="app.closeModal('general-modal'); app.navigateTo('profile', '${u.username}')">
                <img src="${avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                <div>
                  <div style="font-weight: 700; font-size: 14px;">${app.escapeHtml(u.name)}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">@${app.escapeHtml(u.username)}</div>
                </div>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;

      const modalEl = document.getElementById('general-modal');
      modalEl.innerHTML = html;
      modalEl.classList.add('active');
    } catch (err) {
      app.toast('Failed to load user list', 'error');
    }
  }
};
