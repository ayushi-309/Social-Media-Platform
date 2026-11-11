// Looply Comments Manager
const comments = {
  async toggleComments(postId) {
    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;

    if (container.style.display === 'flex') {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = '<div class="loader-spinner" style="margin: 8px auto;"></div>';

    try {
      const list = await api.get(`/posts/${postId}/comments`);
      this.renderCommentsSection(postId, list);
    } catch (err) {
      container.innerHTML = `<p style="color: var(--looply-like); font-size: 12px;">Failed to load comments</p>`;
    }
  },

  renderCommentsSection(postId, list) {
    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); padding: 4px 0;">No comments on this loop yet. Be the first!</p>`;
      return;
    }

    const currentUserId = auth.currentUser ? auth.currentUser._id : null;
    container.innerHTML = list.map((c) => this.renderCommentItem(c, currentUserId)).join('');
  },

  renderCommentItem(c, currentUserId) {
    const isOwner = currentUserId && (c.author._id === currentUserId || c.author === currentUserId);
    const avatar = c.author.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.author.username}`;

    return `
      <div class="looply-comment-item" id="comment-${c._id}">
        <img src="${avatar}" class="looply-comment-avatar" alt="${c.author.username}" onclick="app.navigateTo('profile', '${c.author.username}')" />
        <div class="looply-comment-body">
          <span class="looply-comment-user" onclick="app.navigateTo('profile', '${c.author.username}')">${app.escapeHtml(c.author.name || c.author.username)}</span>
          <span>${app.escapeHtml(c.content)}</span>
          ${
            isOwner
              ? `<button class="looply-btn-icon" style="padding: 2px 4px; font-size: 11px;" title="Delete comment" onclick="comments.deleteComment('${c._id}', '${c.post}')">✕</button>`
              : ''
          }
        </div>
      </div>
    `;
  },

  async submitInlineComment(postId) {
    if (!auth.isLoggedIn()) {
      app.showAuthModal('login');
      return;
    }

    const input = document.getElementById(`inline-comment-${postId}`);
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;

    input.disabled = true;

    try {
      const res = await api.post(`/posts/${postId}/comments`, { content });
      input.value = '';
      input.disabled = false;

      // Update comments counter
      const countEl = document.getElementById(`comment-count-${postId}`);
      if (countEl) countEl.textContent = res.commentsCount;

      // Expand drawer and append comment
      const drawer = document.getElementById(`comments-${postId}`);
      if (drawer) {
        if (drawer.style.display !== 'flex') {
          drawer.style.display = 'flex';
        }
        drawer.insertAdjacentHTML('beforeend', this.renderCommentItem(res.comment, auth.currentUser._id));
      }

      app.toast('Comment added to loop!', 'success');
    } catch (err) {
      input.disabled = false;
      app.toast(err.message, 'error');
    }
  },

  async deleteComment(commentId, postId) {
    if (!confirm('Delete comment?')) return;
    try {
      const res = await api.delete(`/comments/${commentId}`);
      const el = document.getElementById(`comment-${commentId}`);
      if (el) el.remove();

      const countEl = document.getElementById(`comment-count-${postId}`);
      if (countEl) countEl.textContent = res.commentsCount;

      app.toast('Comment deleted', 'info');
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }
};
