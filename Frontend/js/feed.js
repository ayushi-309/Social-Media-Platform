// Looply Feed & Post Stream Manager
const feed = {
  posts: [],
  currentTab: 'all', // 'all' (For You) or 'following'

  async loadFeed(tab = this.currentTab) {
    this.currentTab = tab;
    const postContainer = document.getElementById('post-list');
    if (!postContainer) return;

    postContainer.innerHTML = '<div class="loader-spinner"></div>';

    // Update active tab buttons
    document.querySelectorAll('.looply-tab').forEach((el) => {
      if (el.dataset.tab === tab) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    try {
      const endpoint = tab === 'following' ? '/posts?filter=following' : '/posts';
      const data = await api.get(endpoint);
      this.posts = data;
      this.renderFeed(data);
    } catch (err) {
      postContainer.innerHTML = `
        <div class="state-empty">
          <p style="color: var(--looply-like);">Failed to load posts: ${err.message}</p>
          <button class="btn-looply-primary" style="margin: 12px auto;" onclick="feed.loadFeed('${tab}')">Try Again</button>
        </div>
      `;
    }
  },

  switchFeedTab(tab) {
    this.loadFeed(tab);
  },

  renderFeed(posts) {
    const postContainer = document.getElementById('post-list');
    if (!postContainer) return;

    if (!posts || posts.length === 0) {
      const msg = this.currentTab === 'following'
        ? "You aren't following anyone with posts yet. Follow creators to see their loops here!"
        : "No loops shared yet. Be the first to start a loop!";

      postContainer.innerHTML = `
        <div class="state-empty" style="padding: 60px 16px;">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 8a4 4 0 1 0 0 8c3 0 5-8 8-8a4 4 0 1 1 0 8c-3 0-5-8-8-8z" />
          </svg>
          <p style="font-size: 16px; font-weight: 700; margin-top: 14px;">Stay in the Loop</p>
          <p style="font-size: 13.5px; color: var(--text-muted); max-width: 320px; margin: 6px auto;">${msg}</p>
          <button class="btn-looply-primary" style="margin: 14px auto;" onclick="app.showCreatePostModal()">Share a Loop</button>
        </div>
      `;
      return;
    }

    postContainer.innerHTML = posts.map((post) => this.renderPostCard(post)).join('');
  },

  formatPostContent(text) {
    if (!text) return '';
    const escaped = app.escapeHtml(text);
    return escaped.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="hashtag" onclick="app.filterByHashtag(\'$1\')">$1</span>');
  },

  renderPostCard(post) {
    const author = post.author || {};
    const avatar = author.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${author.username || 'user'}`;
    const timeAgo = app.formatTimeAgo(post.createdAt);
    const isOwner = auth.currentUser && author._id === auth.currentUser._id;
    const isLiked = !!post.isLiked;
    const isBookmarked = app.isBookmarked(post._id);
    const likesCount = post.likesCount || 0;
    const commentsCount = post.commentsCount || 0;

    const formattedContent = this.formatPostContent(post.content);

    let imageHtml = '';
    if (post.image) {
      imageHtml = `
        <div class="looply-post-media-box" ondblclick="feed.handleDoubleTapLike('${post._id}')">
          <img src="${post.image}" class="looply-post-media" alt="Post photo" />
          <svg class="looply-heart-pop" id="heart-pop-${post._id}" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      `;
    }

    return `
      <article class="looply-post" id="post-${post._id}">
        <!-- Header -->
        <div class="looply-post-header">
          <div class="looply-post-user" onclick="app.navigateTo('profile', '${author.username}')">
            <div class="looply-user-ring">
              <img src="${avatar}" class="looply-user-avatar" alt="${author.name}" />
            </div>
            <div class="looply-post-meta">
              <span class="looply-post-author-name">
                ${app.escapeHtml(author.name || 'Anonymous')}
                <span class="looply-badge" title="Verified Creator">✓</span>
              </span>
              <span class="looply-post-time">@${author.username || 'user'} · ${timeAgo}</span>
            </div>
          </div>
          ${
            isOwner
              ? `<button class="looply-btn-icon" title="Delete loop" onclick="feed.deletePost('${post._id}')">✕</button>`
              : `<button class="looply-btn-icon" title="Share" onclick="app.sharePost('${post._id}')">•••</button>`
          }
        </div>

        ${imageHtml}

        <!-- Actions Bar -->
        <div class="looply-post-actions">
          <div class="looply-actions-left">
            <!-- Heart Like -->
            <button class="looply-action-btn ${isLiked ? 'liked' : ''}" id="like-btn-${post._id}" onclick="feed.toggleLike('${post._id}')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </button>

            <!-- Comments Bubble -->
            <button class="looply-action-btn" onclick="comments.toggleComments('${post._id}')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </button>

            <!-- Share Paper Airplane -->
            <button class="looply-action-btn" onclick="app.sharePost('${post._id}')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          <!-- Save / Bookmark Ribbon -->
          <button class="looply-action-btn ${isBookmarked ? 'bookmarked' : ''}" id="bookmark-btn-${post._id}" onclick="app.toggleBookmark('${post._id}')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>

        <!-- Likes Counter -->
        <div class="looply-likes-row">
          <span id="like-count-${post._id}">${likesCount}</span> likes
        </div>

        <!-- Caption Row -->
        <div class="looply-caption-row">
          <span class="looply-caption-author" onclick="app.navigateTo('profile', '${author.username}')">${app.escapeHtml(author.username || 'user')}</span>
          <span class="looply-caption-text">${formattedContent}</span>
        </div>

        <!-- View Comments Link -->
        <button class="looply-comments-toggle" onclick="comments.toggleComments('${post._id}')">
          View all <span id="comment-count-${post._id}">${commentsCount}</span> comments
        </button>

        <!-- Inline Comments Drawer -->
        <div class="looply-comments-box" id="comments-${post._id}" style="display: none;"></div>

        <!-- Bottom Inline Comment Bar -->
        <div class="looply-add-comment-bar">
          <input type="text" id="inline-comment-${post._id}" class="looply-add-comment-input" placeholder="Add a comment to this loop..." onkeydown="if(event.key==='Enter') comments.submitInlineComment('${post._id}')" />
          <button class="btn-looply-post-comment" onclick="comments.submitInlineComment('${post._id}')">Post</button>
        </div>
      </article>
    `;
  },

  handleDoubleTapLike(postId) {
    const heart = document.getElementById(`heart-pop-${postId}`);
    if (heart) {
      heart.classList.remove('animate');
      void heart.offsetWidth;
      heart.classList.add('animate');
      setTimeout(() => heart.classList.remove('animate'), 700);
    }
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    if (likeBtn && !likeBtn.classList.contains('liked')) {
      this.toggleLike(postId);
    }
  },

  async toggleLike(postId) {
    if (!auth.isLoggedIn()) {
      app.showAuthModal('login');
      return;
    }

    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeCountSpan = document.getElementById(`like-count-${postId}`);
    if (!likeBtn || !likeCountSpan) return;

    const currentlyLiked = likeBtn.classList.contains('liked');
    let count = parseInt(likeCountSpan.textContent, 10) || 0;

    if (currentlyLiked) {
      likeBtn.classList.remove('liked');
      count = Math.max(0, count - 1);
    } else {
      likeBtn.classList.add('liked');
      count += 1;
    }
    likeCountSpan.textContent = count;

    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.isLiked) {
        likeBtn.classList.add('liked');
      } else {
        likeBtn.classList.remove('liked');
      }
      likeCountSpan.textContent = res.likesCount;
    } catch (err) {
      app.toast(err.message, 'error');
    }
  },

  async deletePost(postId) {
    if (!confirm('Are you sure you want to delete this loop?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      const el = document.getElementById(`post-${postId}`);
      if (el) el.remove();
      app.toast('Loop deleted', 'info');
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }
};
