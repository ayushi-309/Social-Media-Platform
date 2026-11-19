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

    // Direct event listeners for mobile bottom dock
    document.getElementById('bnav-feed')?.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('feed'); });
    document.getElementById('bnav-explore')?.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('explore'); });
    document.getElementById('bnav-create')?.addEventListener('click', (e) => { e.preventDefault(); this.showCreatePostModal(); });
    document.getElementById('bnav-reels')?.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('reels'); });
    document.getElementById('bnav-profile')?.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('profile'); });

    // Direct event listeners for mobile header buttons
    document.getElementById('mobile-nav-notifications')?.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('notifications'); });
    document.getElementById('mobile-nav-messages')?.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('messages'); });
    document.getElementById('mobile-nav-bookmarks')?.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('bookmarks'); });
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

  // In-memory data store for rich interactive features
  reelsData: [
    {
      id: 'reel-1',
      author: 'Ayushi Tiwari',
      username: 'ayushi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      media: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      caption: 'Sunset hues & peaceful coding sessions ✨ Keep building what you love! #aesthetic #sunset #vibes #looply',
      music: 'ayushi_tiwari • Golden Hour Melodies',
      likes: 2450,
      comments: 118,
      isLiked: false,
      isFollowing: true
    },
    {
      id: 'reel-2',
      author: 'Sarah Chen',
      username: 'sarah_tech',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      media: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      caption: 'Late night dark mode workspace setup ⚡ Neon purple glow hits different. #tech #setup #coding #darkmode',
      music: 'sarah_chen • Cyber Lofi Beats Vol. 3',
      likes: 4890,
      comments: 320,
      isLiked: false,
      isFollowing: false
    },
    {
      id: 'reel-3',
      author: 'Alex Rivera',
      username: 'alex',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      media: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
      caption: 'Clear your mind, take a breath, and reset. Nature teaches us flow. 🌊 #mindset #chill #oceanvibes',
      music: 'alex_rivera • Ocean Waves Ambient Flow',
      likes: 1820,
      comments: 84,
      isLiked: false,
      isFollowing: false
    }
  ],

  dmConversations: [
    {
      id: 'ayushi',
      name: 'Ayushi Tiwari',
      username: 'ayushi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      online: true,
      lastMessage: 'Hey! Loved your new loop post 🔥',
      lastTime: '10m ago',
      messages: [
        { sender: 'them', text: 'Hey there! Welcome to Looply ✨', time: '10:30 AM' },
        { sender: 'them', text: 'Checked out your profile, the vibes are great!', time: '10:31 AM' },
        { sender: 'me', text: 'Thank you Ayushi! Loving the smooth UI and loops tray.', time: '10:35 AM' },
        { sender: 'them', text: 'Hey! Loved your new loop post 🔥', time: '10:40 AM' }
      ]
    },
    {
      id: 'alex',
      name: 'Alex Rivera',
      username: 'alex',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      online: true,
      lastMessage: 'Are we doing the photo walk this weekend?',
      lastTime: '1h ago',
      messages: [
        { sender: 'them', text: 'Yo! Golden hour was crazy yesterday.', time: 'Yesterday' },
        { sender: 'me', text: 'I saw your latest reel! Super crisp shots.', time: 'Yesterday' },
        { sender: 'them', text: 'Are we doing the photo walk this weekend?', time: '1h ago' }
      ]
    },
    {
      id: 'sarah_tech',
      name: 'Sarah Chen',
      username: 'sarah_tech',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      online: false,
      lastMessage: 'The new dark theme is so easy on the eyes 💜',
      lastTime: '3h ago',
      messages: [
        { sender: 'them', text: 'Hey! Did you see the new update?', time: '3h ago' },
        { sender: 'them', text: 'The new dark theme is so easy on the eyes 💜', time: '3h ago' }
      ]
    }
  ],
  activeDmUser: 'ayushi',

  notificationsData: [
    {
      id: 'notif-1',
      username: 'ayushi',
      name: 'Ayushi Tiwari',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      action: 'liked your loop: "Neon cyberpunk vibes in Tokyo ⚡"',
      time: '15m ago',
      type: 'like',
      thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'notif-2',
      username: 'alex',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      action: 'started following you.',
      time: '1h ago',
      type: 'follow',
      isFollowing: false
    },
    {
      id: 'notif-3',
      username: 'sarah_tech',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      action: 'commented: "This design aesthetic is immaculate ✨"',
      time: '3h ago',
      type: 'comment',
      thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'notif-4',
      username: 'vibes_daily',
      name: 'Daily Aesthetic',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      action: 'liked your loop: "Sunset coffee moments ☕"',
      time: '1d ago',
      type: 'like',
      thumb: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'notif-5',
      username: 'minimal',
      name: 'Minimal Living',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      action: 'started following you.',
      time: '2d ago',
      type: 'follow',
      isFollowing: true
    }
  ],

  navigateTo(view, param = null) {
    // Aliases
    if (view === 'saved') view = 'bookmarks';
    if (view === 'activity') view = 'notifications';

    this.currentView = view;

    const views = {
      'feed': document.getElementById('feed-view'),
      'explore': document.getElementById('explore-view'),
      'reels': document.getElementById('reels-view'),
      'messages': document.getElementById('messages-view'),
      'notifications': document.getElementById('notifications-view'),
      'bookmarks': document.getElementById('bookmarks-view'),
      'profile': document.getElementById('profile-view')
    };
    const sideBar = document.getElementById('looply-right-sidebar');

    // Remove active state across all nav items and mobile header actions
    document.querySelectorAll('.looply-nav-item, .looply-bnav-btn, .looply-btn-icon').forEach((i) => i.classList.remove('active'));

    // Handle right sidebar visibility
    if (sideBar) {
      sideBar.style.removeProperty('display');
      if (view === 'feed') {
        sideBar.classList.remove('hidden-sidebar');
      } else {
        sideBar.classList.add('hidden-sidebar');
      }
    }

    // Hide all view containers
    Object.values(views).forEach((v) => {
      if (v) v.style.display = 'none';
    });

    // Mark current active nav buttons on desktop, mobile dock, and mobile header
    const activeNav = document.getElementById(`nav-${view}`);
    if (activeNav) activeNav.classList.add('active');
    const mobileBottomNav = document.getElementById(`bnav-${view}`);
    if (mobileBottomNav) mobileBottomNav.classList.add('active');
    const mobileHeaderBtn = document.getElementById(`mobile-nav-${view}`);
    if (mobileHeaderBtn) mobileHeaderBtn.classList.add('active');

    // Route to appropriate view renderer
    if (view === 'feed') {
      if (views.feed) views.feed.style.display = 'flex';
      feed.loadFeed();
    } else if (view === 'explore') {
      if (views.explore) views.explore.style.display = 'block';
      this.loadExplorePage();
    } else if (view === 'reels') {
      if (views.reels) views.reels.style.display = 'flex';
      this.loadReelsPage();
    } else if (view === 'messages') {
      if (views.messages) views.messages.style.display = 'block';
      this.loadMessagesPage();
    } else if (view === 'notifications') {
      if (views.notifications) views.notifications.style.display = 'block';
      this.loadNotificationsPage();
    } else if (view === 'bookmarks') {
      if (views.bookmarks) views.bookmarks.style.display = 'block';
      this.loadBookmarksPage();
    } else if (view === 'profile') {
      const identifier = param || (auth.currentUser ? auth.currentUser.username : 'ayushi');
      if (views.profile) views.profile.style.display = 'block';
      profile.loadProfile(identifier);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ==========================================================================
     EXPLORE PAGE (SEARCH, CATEGORY PILLS, DISCOVERY GRID)
     ========================================================================== */
  async loadExplorePage(selectedCategory = 'all') {
    const container = document.getElementById('explore-view');
    if (!container) return;
    container.innerHTML = '<div class="loader-spinner"></div>';

    const categories = [
      { id: 'all', label: '🔥 All' },
      { id: 'photography', label: '📸 Photography' },
      { id: 'design', label: '🎨 Design' },
      { id: 'tech', label: '💻 Tech' },
      { id: 'aesthetic', label: '✨ Aesthetic' },
      { id: 'music', label: '🎵 Music' }
    ];

    const curatedExplore = [
      { _id: 'ex-1', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', content: 'Cyberpunk nights in Shinjuku #tokyo #tech', likesCount: 1420, commentsCount: 52 },
      { _id: 'ex-2', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', content: 'Modern generative liquid forms #design #art', likesCount: 2890, commentsCount: 94 },
      { _id: 'ex-3', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', content: 'Pour over coffee at sunrise ☕ #aesthetic #vibes', likesCount: 940, commentsCount: 38 },
      { _id: 'ex-4', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80', content: 'Retro synthwave mechanical keyboard #tech #dev', likesCount: 3120, commentsCount: 120 },
      { _id: 'ex-5', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', content: 'Ocean breeze & summer golden hour #nature', likesCount: 1650, commentsCount: 46 },
      { _id: 'ex-6', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80', content: 'Clean code architecture on MacBook Pro #coding', likesCount: 2110, commentsCount: 65 }
    ];

    let displayPosts = curatedExplore;
    try {
      const apiPosts = await api.get('/posts');
      if (apiPosts && apiPosts.length > 0) {
        displayPosts = [...apiPosts, ...curatedExplore];
      }
    } catch (e) {
      // Use fallback curated
    }

    container.innerHTML = `
      <div style="padding: 10px 0;">
        <!-- Explore Search Bar -->
        <div style="margin-bottom: 14px;">
          <div class="looply-search-box" style="padding: 12px 18px; border-radius: var(--radius-full);">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="explore-search-input" class="looply-search-input" placeholder="Search creators, hashtags, or loops..." oninput="app.filterExploreGrid(this.value)" />
          </div>
        </div>

        <!-- Category Pills -->
        <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; -webkit-overflow-scrolling: touch;">
          ${categories.map((c) => `
            <button class="looply-tab ${selectedCategory === c.id ? 'active' : ''}" style="white-space: nowrap; padding: 6px 14px; font-size: 13px; border-radius: var(--radius-full);" onclick="app.loadExplorePage('${c.id}')">
              ${c.label}
            </button>
          `).join('')}
        </div>

        <!-- Discovery Grid -->
        <div id="explore-grid-container" style="margin-top: 8px;">
          ${profile.renderGrid(displayPosts)}
        </div>
      </div>
    `;
  },

  filterExploreGrid(query) {
    const term = (query || '').toLowerCase().trim();
    const items = document.querySelectorAll('#explore-grid-container .looply-grid-item');
    items.forEach((item) => {
      const text = item.getAttribute('title') || '';
      if (!term || text.toLowerCase().includes(term)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  },

  /* ==========================================================================
     REELS PAGE (VERTICAL FULL-BLEED CLIPS WITH AUDIO & ACTIONS)
     ========================================================================== */
  loadReelsPage() {
    const container = document.getElementById('reels-view');
    if (!container) return;

    container.innerHTML = `
      <div class="looply-reels-container" id="reels-scroll-wrapper">
        ${this.reelsData.map((reel, index) => `
          <div class="looply-reel-card" id="reel-card-${reel.id}">
            <!-- Media Photo/Video -->
            <img src="${reel.media}" class="looply-reel-media" alt="Reel media" ondblclick="app.toggleReelLike('${reel.id}')" />

            <!-- Vertical Action Bar (Right) -->
            <div class="looply-reel-actions">
              <!-- Like -->
              <button class="looply-reel-action-btn" onclick="app.toggleReelLike('${reel.id}')" id="reel-like-btn-${reel.id}">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="${reel.isLiked ? 'var(--looply-like)' : 'none'}" stroke="${reel.isLiked ? 'var(--looply-like)' : 'white'}" stroke-width="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span id="reel-like-count-${reel.id}">${reel.likes.toLocaleString()}</span>
              </button>

              <!-- Comment -->
              <button class="looply-reel-action-btn" onclick="app.toast('Opening loop comments...', 'info')">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
                <span>${reel.comments}</span>
              </button>

              <!-- Share -->
              <button class="looply-reel-action-btn" onclick="app.shareReel('${reel.id}')">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>Share</span>
              </button>

              <!-- Bookmark -->
              <button class="looply-reel-action-btn" onclick="app.toast('Reel saved to bookmarks! 🔖', 'success')">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
                <span>Save</span>
              </button>

              <!-- Spinning Music Disc -->
              <div class="looply-reel-music-disc" title="Original Loop Audio">
                <img src="${reel.avatar}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
            </div>

            <!-- Bottom Creator & Caption Info -->
            <div class="looply-reel-info">
              <div class="looply-reel-user-row">
                <img src="${reel.avatar}" class="looply-reel-avatar" onclick="app.navigateTo('profile', '${reel.username}')" />
                <span style="font-family: var(--font-brand); font-weight: 800; font-size: 14px; cursor: pointer;" onclick="app.navigateTo('profile', '${reel.username}')">@${reel.username}</span>
                <button class="btn-looply-reel-follow" onclick="app.toggleReelFollow('${reel.username}', this)">
                  ${reel.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
              <div class="looply-reel-caption">${this.escapeHtml(reel.caption)}</div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; opacity: 0.9;">
                <span>🎵</span>
                <span>${reel.music}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  toggleReelLike(reelId) {
    const reel = this.reelsData.find((r) => r.id === reelId);
    if (!reel) return;
    reel.isLiked = !reel.isLiked;
    reel.likes += reel.isLiked ? 1 : -1;

    const btn = document.getElementById(`reel-like-btn-${reelId}`);
    const count = document.getElementById(`reel-like-count-${reelId}`);
    if (btn && count) {
      btn.querySelector('svg').setAttribute('fill', reel.isLiked ? 'var(--looply-like)' : 'none');
      btn.querySelector('svg').setAttribute('stroke', reel.isLiked ? 'var(--looply-like)' : 'white');
      count.textContent = reel.likes.toLocaleString();
    }
    if (reel.isLiked) this.toast('Liked reel! ❤️', 'success');
  },

  toggleReelFollow(username, btn) {
    const reel = this.reelsData.find((r) => r.username === username);
    if (reel) reel.isFollowing = !reel.isFollowing;
    const isNowFollowing = reel ? reel.isFollowing : true;
    if (btn) {
      btn.textContent = isNowFollowing ? 'Following' : 'Follow';
      btn.style.background = isNowFollowing ? 'white' : 'rgba(255, 255, 255, 0.2)';
      btn.style.color = isNowFollowing ? 'black' : 'white';
    }
    this.toast(isNowFollowing ? `Now following @${username}!` : `Unfollowed @${username}`, 'info');
  },

  shareReel(reelId) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#reel-${reelId}`);
    }
    this.toast('Reel link copied to clipboard! 📋', 'success');
  },

  /* ==========================================================================
     MESSAGES / DIRECT CHAT PAGE
     ========================================================================== */
  loadMessagesPage() {
    const container = document.getElementById('messages-view');
    if (!container) return;

    const currentConv = this.dmConversations.find((c) => c.id === this.activeDmUser) || this.dmConversations[0];

    container.innerHTML = `
      <div class="looply-dm-container">
        <!-- DM Sidebar List -->
        <aside class="looply-dm-sidebar" id="dm-sidebar-pane">
          <div class="looply-dm-sidebar-header">
            <span>Direct Messages</span>
            <button class="looply-btn-icon" title="New Message" onclick="app.toast('Search user to start new chat', 'info')">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div class="looply-dm-list">
            ${this.dmConversations.map((c) => `
              <div class="looply-dm-item ${c.id === currentConv.id ? 'active' : ''}" onclick="app.switchDmConversation('${c.id}')">
                <div style="position: relative;">
                  <img src="${c.avatar}" class="looply-dm-avatar" alt="${c.name}" />
                  ${c.online ? '<span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid var(--surface); border-radius: 50%;"></span>' : ''}
                </div>
                <div class="looply-dm-meta">
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <span class="looply-dm-username">${this.escapeHtml(c.name)}</span>
                    <span style="font-size: 11px; color: var(--text-muted);">${c.lastTime}</span>
                  </div>
                  <span class="looply-dm-preview">${this.escapeHtml(c.lastMessage)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </aside>

        <!-- Active Chat Pane -->
        <div class="looply-dm-chat-pane" id="dm-chat-pane">
          <!-- Chat Header -->
          <div class="looply-dm-chat-header">
            <button class="looply-btn-icon" style="display: none;" id="dm-back-to-list-btn" onclick="app.toggleMobileDmView(false)">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div style="position: relative;">
              <img src="${currentConv.avatar}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" alt="${currentConv.name}" />
              ${currentConv.online ? '<span style="position: absolute; bottom: 0; right: 0; width: 9px; height: 9px; background: #10b981; border: 2px solid var(--surface); border-radius: 50%;"></span>' : ''}
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 800; font-size: 14.5px;">${this.escapeHtml(currentConv.name)}</span>
              <span style="font-size: 11.5px; color: ${currentConv.online ? '#10b981' : 'var(--text-muted)'};">${currentConv.online ? 'Active now' : 'Offline'}</span>
            </div>
          </div>

          <!-- Message Stream -->
          <div class="looply-dm-messages-stream" id="dm-messages-stream">
            ${currentConv.messages.map((m) => `
              <div class="looply-bubble ${m.sender === 'me' ? 'outgoing' : 'incoming'}">
                ${this.escapeHtml(m.text)}
                <div style="font-size: 10px; opacity: 0.7; text-align: right; margin-top: 3px;">${m.time}</div>
              </div>
            `).join('')}
          </div>

          <!-- Bottom Input Bar -->
          <form class="looply-dm-input-bar" onsubmit="event.preventDefault(); app.sendDmMessage();">
            <input type="text" id="dm-message-input" class="looply-dm-input" placeholder="Message ${this.escapeHtml(currentConv.name)}..." autocomplete="off" />
            <button type="submit" class="btn-looply-send-dm">Send</button>
          </form>
        </div>
      </div>
    `;

    // Scroll chat to bottom
    const stream = document.getElementById('dm-messages-stream');
    if (stream) stream.scrollTop = stream.scrollHeight;
  },

  switchDmConversation(userId) {
    this.activeDmUser = userId;
    this.loadMessagesPage();
    this.toggleMobileDmView(true);
  },

  toggleMobileDmView(showChat) {
    const sidebar = document.getElementById('dm-sidebar-pane');
    const chat = document.getElementById('dm-chat-pane');
    const backBtn = document.getElementById('dm-back-to-list-btn');
    if (window.innerWidth <= 768 && sidebar && chat) {
      if (showChat) {
        sidebar.style.display = 'none';
        chat.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'inline-flex';
      } else {
        sidebar.style.display = 'flex';
        chat.style.display = 'none';
      }
    }
  },

  sendDmMessage() {
    const input = document.getElementById('dm-message-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    const currentConv = this.dmConversations.find((c) => c.id === this.activeDmUser);
    if (!currentConv) return;

    // Add outgoing message
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentConv.messages.push({ sender: 'me', text, time: timeStr });
    currentConv.lastMessage = `You: ${text}`;
    currentConv.lastTime = 'Just now';

    this.loadMessagesPage();

    // Auto-reply simulation
    setTimeout(() => {
      const replies = [
        'Awesome, thanks for the message! ✨',
        'Loving your recent loops on the feed! 🔥',
        'Totally agree with you!',
        'See you in the next loop! 🚀'
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      currentConv.messages.push({ sender: 'them', text: randomReply, time: 'Just now' });
      currentConv.lastMessage = randomReply;
      currentConv.lastTime = 'Just now';
      this.loadMessagesPage();
      this.toast(`New message from ${currentConv.name}`, 'info');
    }, 1200);
  },

  /* ==========================================================================
     NOTIFICATIONS / ACTIVITY FEED
     ========================================================================== */
  loadNotificationsPage(filterType = 'all') {
    const container = document.getElementById('notifications-view');
    if (!container) return;

    const filtered = filterType === 'all'
      ? this.notificationsData
      : this.notificationsData.filter((n) => n.type === filterType);

    container.innerHTML = `
      <div class="looply-activity-container">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h2 class="looply-activity-header" style="margin-bottom: 0;">Activity</h2>
          <div style="display: flex; gap: 6px;">
            <button class="looply-tab ${filterType === 'all' ? 'active' : ''}" style="padding: 4px 12px; font-size: 12px; border-radius: var(--radius-full);" onclick="app.loadNotificationsPage('all')">All</button>
            <button class="looply-tab ${filterType === 'like' ? 'active' : ''}" style="padding: 4px 12px; font-size: 12px; border-radius: var(--radius-full);" onclick="app.loadNotificationsPage('like')">Likes</button>
            <button class="looply-tab ${filterType === 'comment' ? 'active' : ''}" style="padding: 4px 12px; font-size: 12px; border-radius: var(--radius-full);" onclick="app.loadNotificationsPage('comment')">Comments</button>
            <button class="looply-tab ${filterType === 'follow' ? 'active' : ''}" style="padding: 4px 12px; font-size: 12px; border-radius: var(--radius-full);" onclick="app.loadNotificationsPage('follow')">Follows</button>
          </div>
        </div>

        <div class="looply-activity-list">
          ${filtered.length === 0 ? '<div class="state-empty"><p>No activity in this category</p></div>' : ''}
          ${filtered.map((item) => `
            <div class="looply-activity-item">
              <img src="${item.avatar}" class="looply-activity-avatar" onclick="app.navigateTo('profile', '${item.username}')" />
              <div class="looply-activity-text">
                <strong onclick="app.navigateTo('profile', '${item.username}')">${this.escapeHtml(item.name)}</strong>
                <span>${this.escapeHtml(item.action)}</span>
                <span style="color: var(--text-muted); font-size: 11.5px; margin-left: 4px;">${item.time}</span>
              </div>
              ${item.type === 'follow' ? `
                <button class="btn-looply-text" style="font-size: 12px; padding: 4px 12px; border: 1px solid var(--border); border-radius: var(--radius-full);" onclick="this.textContent = this.textContent === 'Following' ? 'Follow Back' : 'Following'; app.toast('Updated follow status!', 'success');">
                  ${item.isFollowing ? 'Following' : 'Follow Back'}
                </button>
              ` : ''}
              ${item.thumb ? `<img src="${item.thumb}" class="looply-activity-thumb" />` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /* ==========================================================================
     SAVED / BOOKMARKS PAGE
     ========================================================================== */
  async loadBookmarksPage() {
    const container = document.getElementById('bookmarks-view');
    if (!container) return;
    container.innerHTML = '<div class="loader-spinner"></div>';

    let bookmarkedIds = this.getBookmarks();
    if (!bookmarkedIds || bookmarkedIds.length === 0) {
      container.innerHTML = `
        <div class="state-empty" style="padding: 60px 16px;">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p style="font-family: var(--font-brand); font-size: 18px; font-weight: 700; margin-top: 14px;">No Saved Loops Yet</p>
          <p style="font-size: 13.5px; color: var(--text-muted); margin-top: 6px;">Tap the bookmark ribbon on any loop to add it to your private collection.</p>
          <button class="btn-looply-primary" style="margin: 16px auto;" onclick="app.quickSaveSampleLoops()">✨ Quick-Add 3 Sample Loops</button>
        </div>
      `;
      return;
    }

    try {
      const posts = await api.get('/posts');
      const saved = posts.filter((p) => bookmarkedIds.includes(p._id));
      if (saved.length === 0) {
        this.quickSaveSampleLoops();
        return;
      }
      container.innerHTML = `
        <div style="padding: 10px 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h2 style="font-family: var(--font-brand); font-size: 20px; font-weight: 800;">Saved Collection (${saved.length})</h2>
            <button class="btn-looply-text" style="color: var(--looply-like); font-size: 12px;" onclick="localStorage.removeItem('looply_saved_' + (auth.currentUser ? auth.currentUser._id : 'guest')); app.loadBookmarksPage();">Clear All</button>
          </div>
          ${profile.renderGrid(saved)}
        </div>
      `;
    } catch (err) {
      this.quickSaveSampleLoops();
    }
  },

  quickSaveSampleLoops() {
    const samplePosts = [
      { _id: 'sample-1', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', content: 'Tokyo neon nightlife ⚡', likesCount: 1420, commentsCount: 42 },
      { _id: 'sample-2', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', content: 'Modern gradient art forms ✨', likesCount: 2900, commentsCount: 88 },
      { _id: 'sample-3', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', content: 'Morning espresso aesthetic ☕', likesCount: 940, commentsCount: 29 }
    ];
    const container = document.getElementById('bookmarks-view');
    if (!container) return;
    const userKey = auth.currentUser ? auth.currentUser._id : 'guest';
    localStorage.setItem(`looply_saved_${userKey}`, JSON.stringify(['sample-1', 'sample-2', 'sample-3']));
    this.toast('Saved 3 sample loops! 🔖', 'success');
    container.innerHTML = `
      <div style="padding: 10px 0;">
        <h2 style="font-family: var(--font-brand); font-size: 20px; font-weight: 800; margin-bottom: 16px;">Saved Collection (3)</h2>
        ${profile.renderGrid(samplePosts)}
      </div>
    `;
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
  async showCreatePostModal() {
    if (!auth.isLoggedIn()) {
      await auth.loginWithDemoUser('ayushi');
      this.toast('Signed in as Ayushi to create loops! ⚡', 'info');
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

// Global attachment
if (typeof window !== 'undefined') {
  window.app = app;
}

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
