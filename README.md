# ∞ Looply — Stay in the Loop

**Looply** is a modern, high-performance social media web platform inspired by the cleanest aspects of modern visual networks (Instagram & Threads), reimagined with a distinct identity, electric gradient styling, and a fluid user experience.

Built with **Node.js & Express.js**, **MongoDB Atlas (Mongoose)**, and **Vanilla HTML5, CSS3, and JavaScript**.

---

## ✨ Key Features

### 1. 🌀 Active Loops (Stories)
- Stories tray at the top of the feed with Looply's dual-loop gradient rings.
- **Story Viewer Modal**: View moments full-screen with auto-advancing progress timers.

### 2. ⚡ The Loop Feed
- **Double-Tap to Like**: Double-click or double-tap on any photo to trigger a glowing animated heart.
- **Tabbed Stream**: Seamlessly switch between **"For You"** (explore community loops) and **"Following"** (curated posts from people you follow).
- **Interactive Action Bar**:
  - ❤️ Heart like with counter
  - 💬 Expandable inline comments drawer
  - ✈️ Share direct loop link
  - 🔖 Save to personal collection
- **Inline Comment Bar**: Instant comment submission with the blue **"Post"** button.

### 3. 👤 Looply Profiles (Grid & Timeline Views)
- Custom avatar, username, display name, bio, and member join date.
- Real-time stats: **Loops count**, **Followers count**, and **Following count**.
- **Interactive Modals**: Click on Followers or Following to view member lists.
- **View Switcher Tabs**:
  - **GRID**: 3-column square photo grid with hover stats (❤️ likes & 💬 comments).
  - **TIMELINE**: Full-card chronological stream.
- **Edit Profile**: Update name, bio, and avatar.

### 4. 🔍 Search & Discover
- **Live Search**: Instant debounced search for creators by username or name.
- **Trending Loops**: Clickable `#hashtags` to filter the timeline by trending topics.
- **Creators to Follow**: Recommended creators sidebar with one-click follow.

### 5. ☀️🌙 Dark & Light Themes
- Deep obsidian dark mode as default, with a crisp clean light mode toggle that remembers your choice in `localStorage`.

### 6. ⚡ 1-Click Instant Demo Login
- Instantly switch or test between demo creators without typing passwords:
  - 👩‍💻 **@ayushi** (Platform Creator)
  - 🎨 **@alex** (UI/UX Designer)
  - 💻 **@sarah_tech** (Developer)

---

## 🛠️ Architecture

```
Social Media Platform/
├── package.json               # Root scripts (start, dev, seed)
├── README.md                  # Complete documentation
├── Backend/
│   ├── .env                   # MongoDB Atlas connection & JWT secret
│   ├── package.json           # Express 5, Mongoose, Multer, Bcryptjs, JWT, Cors
│   ├── server.js              # REST API & static file server
│   ├── seed.js                # Database seeder (5 rich photo posts, 3 users, comments)
│   ├── models/                # User.js, Post.js, Comment.js
│   ├── middleware/            # authMiddleware.js, uploadMiddleware.js
│   ├── controllers/           # authController, userController, postController, commentController
│   └── routes/                # authRoutes, userRoutes, postRoutes, commentRoutes
└── Frontend/
    ├── index.html             # Looply SPA markup (Logo, Feed, Profile, Loops Tray)
    ├── css/style.css          # Looply design system (Obsidian dark & light themes, Gradients, Cards)
    └── js/
        ├── api.js             # Central API fetch wrapper
        ├── auth.js            # Authentication & session management
        ├── feed.js            # Loop cards, double-tap heart, inline comments, tabs
        ├── comments.js        # Expandable comments drawer & reply submission
        ├── profile.js         # Looply profile page with Grid & Timeline views
        └── app.js             # Routing, loops viewer, search, bookmarks, toasts
```

---

## 🚀 Running Looply

1. In your terminal at the project root:
   ```powershell
   npm start
   ```

2. Open your browser:
   👉 **[http://localhost:5000](http://localhost:5000)**

3. To reset or re-seed sample loops at any time:
   ```powershell
   npm run seed
   ```
