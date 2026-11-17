// Looply API Client with instant fallback & automatic offline resilience
const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? `http://${window.location.hostname}:5000/api`
  : (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:')
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');

// Curated seed data for offline / demo mode
const INITIAL_MOCK_POSTS = [
  {
    _id: 'post-seed-1',
    author: { _id: 'user-ayushi', name: 'Ayushi Tiwari', username: 'ayushi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
    content: 'Deep work setup for today 💻 Warm coffee, ambient music, and shipping clean Looply features. #desksetup #workspace #coderlife #minimalism',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=80',
    likes: ['user-alex', 'user-sarah'],
    likesCount: 2,
    commentsCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    _id: 'post-seed-2',
    author: { _id: 'user-alex', name: 'Alex Rivera', username: 'alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
    content: 'Tokyo street photography at twilight ⚡ Neon reflections on rain-soaked asphalt. #tokyo #nightphotography #cyberpunk #wanderlust',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80',
    likes: ['user-ayushi'],
    likesCount: 1,
    commentsCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    _id: 'post-seed-3',
    author: { _id: 'user-sarah', name: 'Sarah Chen', username: 'sarah_tech', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
    content: 'Fluid dark gradients and micro-interactions in Looply. Good design is as little design as possible ✨ #ui #ux #design #aesthetic',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
    likes: ['user-ayushi', 'user-alex'],
    likesCount: 2,
    commentsCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const api = {
  getToken() {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    } catch (e) {}
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

  // Mock store manager
  getMockPosts() {
    try {
      const stored = localStorage.getItem('looply_mock_posts');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    localStorage.setItem('looply_mock_posts', JSON.stringify(INITIAL_MOCK_POSTS));
    return INITIAL_MOCK_POSTS;
  },

  saveMockPosts(posts) {
    try {
      localStorage.setItem('looply_mock_posts', JSON.stringify(posts));
    } catch (e) {}
  },

  // Fallback handler when backend is offline
  handleOfflineFallback(endpoint, options) {
    const method = (options.method || 'GET').toUpperCase();

    // 1. GET /posts
    if (endpoint.startsWith('/posts') && method === 'GET') {
      return this.getMockPosts();
    }

    // 2. POST /posts (Create Post)
    if (endpoint === '/posts' && method === 'POST') {
      let body = {};
      try {
        body = JSON.parse(options.body || '{}');
      } catch (e) {}
      const posts = this.getMockPosts();
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null') || {
        _id: 'user-ayushi',
        name: 'Ayushi Tiwari',
        username: 'ayushi',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
      };
      const newPost = {
        _id: 'mock-post-' + Date.now(),
        author: currentUser,
        content: body.content || '',
        image: body.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80',
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString()
      };
      posts.unshift(newPost);
      this.saveMockPosts(posts);
      return newPost;
    }

    // 3. PUT /posts/:id/like
    if (endpoint.includes('/like') && method === 'PUT') {
      const postId = endpoint.split('/')[2];
      const posts = this.getMockPosts();
      const post = posts.find((p) => p._id === postId);
      if (post) {
        post.likesCount = (post.likesCount || 0) + 1;
        this.saveMockPosts(posts);
        return { message: 'Post liked', likesCount: post.likesCount, isLiked: true };
      }
      return { message: 'Post liked', likesCount: 1, isLiked: true };
    }

    // 4. GET /users/suggested
    if (endpoint.includes('/users/suggested')) {
      return [
        { _id: 'u-1', name: 'Ayushi Tiwari', username: 'ayushi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
        { _id: 'u-2', name: 'Alex Rivera', username: 'alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
        { _id: 'u-3', name: 'Sarah Chen', username: 'sarah_tech', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }
      ];
    }

    // 5. GET /users/:id
    if (endpoint.startsWith('/users/')) {
      const uname = endpoint.replace('/users/', '');
      return {
        _id: 'user-' + uname,
        name: uname === 'ayushi' ? 'Ayushi Tiwari' : uname === 'alex' ? 'Alex Rivera' : 'Sarah Chen',
        username: uname,
        avatar: uname === 'ayushi'
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
          : uname === 'alex'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        bio: 'Creator & Developer on Looply ✨ Building future aesthetic web apps.',
        postsCount: 6,
        followersCount: 1420,
        followingCount: 310,
        createdAt: '2026-01-15T00:00:00.000Z'
      };
    }

    // 6. GET /comments/:id
    if (endpoint.startsWith('/comments/')) {
      return [
        { _id: 'c-1', author: { username: 'ayushi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' }, content: 'Love this shot! ✨', createdAt: new Date().toISOString() },
        { _id: 'c-2', author: { username: 'alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' }, content: 'Such clean vibes 🔥', createdAt: new Date().toISOString() }
      ];
    }

    // 7. POST /comments/:id
    if (endpoint.startsWith('/comments/') && method === 'POST') {
      let body = {};
      try {
        body = JSON.parse(options.body || '{}');
      } catch (e) {}
      return {
        _id: 'c-' + Date.now(),
        author: { username: 'ayushi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' },
        content: body.content || 'Great loop!',
        createdAt: new Date().toISOString()
      };
    }

    // Default fallback
    return [];
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    // 2.5-second connection timeout so UI NEVER hangs if backend is offline
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
          this.setToken(null);
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw new Error(data.message || 'Server error');
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[Looply API] ${endpoint} unreachable (${err.message}), using instant local fallback.`);
      return this.handleOfflineFallback(endpoint, options);
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

// Explicit global attachment
if (typeof window !== 'undefined') {
  window.api = api;
}
