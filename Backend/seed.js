require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

async function seedDatabase() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  console.log('Clearing existing records...');
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});

  console.log('Creating demo users...');

  const user1 = await User.create({
    username: 'ayushi',
    name: 'Ayushi Tiwari',
    email: 'ayushi@example.com',
    password: 'password123',
    bio: 'Software Engineer & Creator ⚡ Building clean apps & aesthetic systems. New Delhi, India 📍',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'
  });

  const user2 = await User.create({
    username: 'alex',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    password: 'password123',
    bio: 'UI/UX enthusiast & coffee addict ☕ Let’s make the web beautiful. San Francisco, CA 🌉',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'
  });

  const user3 = await User.create({
    username: 'sarah_tech',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    password: 'password123',
    bio: 'Full-stack developer 💻 Exploring AI, Cloud & Open Source. Tokyo, Japan 🌸',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80'
  });

  // Follow relationships
  user2.following.push(user1._id);
  user1.followers.push(user2._id);

  user3.following.push(user1._id);
  user1.followers.push(user3._id);

  user3.following.push(user2._id);
  user2.followers.push(user3._id);

  await user1.save();
  await user2.save();
  await user3.save();

  console.log('Creating demo posts & comments...');

  // Post 1 by Ayushi
  const post1 = await Post.create({
    author: user1._id,
    content: 'Sunset strolls and golden hour magic ✨ There is nothing quite like this view after a productive week. #sunset #goldenhour #vibes #aesthetic',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
    likes: [user2._id, user3._id],
    commentsCount: 2
  });

  await Comment.create({
    post: post1._id,
    author: user2._id,
    content: 'Incredible shot! Love the colors in this sunset 🔥'
  });

  await Comment.create({
    post: post1._id,
    author: user3._id,
    content: 'Pure serenity! Which beach was this? 😍'
  });

  // Post 2 by Ayushi
  const post2 = await Post.create({
    author: user1._id,
    content: 'Deep work setup for today 💻 Warm coffee, ambient music, and shipping clean features. #desksetup #workspace #coderlife #minimalism',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1080&auto=format&fit=crop&q=80',
    likes: [user2._id],
    commentsCount: 1
  });

  await Comment.create({
    post: post2._id,
    author: user2._id,
    content: 'That keyboard and lighting setup is goals 👏'
  });

  // Post 3 by Alex
  const post3 = await Post.create({
    author: user2._id,
    content: 'Good design is like a refrigerator—when it works, no one notices, but when it doesn’t, it sure stinks. Exploring clean typography & fluid transitions today! #design #ui #ux #creativity',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1080&auto=format&fit=crop&q=80',
    likes: [user1._id, user3._id],
    commentsCount: 1
  });

  await Comment.create({
    post: post3._id,
    author: user1._id,
    content: 'Clean aesthetics always win. Keep inspiring!'
  });

  // Post 4 by Sarah
  const post4 = await Post.create({
    author: user3._id,
    content: 'Weekend escape to the mountains ⛰️ Fresh air, clear mind, and endless horizons. Reminder to step away from screens and recharge! #nature #hiking #mountains #wanderlust',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&auto=format&fit=crop&q=80',
    likes: [user1._id, user2._id],
    commentsCount: 1
  });

  await Comment.create({
    post: post4._id,
    author: user1._id,
    content: 'Breathtaking view Sarah! Have an amazing hike 🏔️'
  });

  // Post 5 by Ayushi
  await Post.create({
    author: user1._id,
    content: 'Tokyo neon dreams at night 🏮 Every alley tells a story. #tokyo #citylights #cyberpunk #travelphotography',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&auto=format&fit=crop&q=80',
    likes: [user3._id],
    commentsCount: 0
  });

  console.log('✅ Seeding completed successfully!');
  console.log('Created: 3 Users, 5 High-Res Instagram Posts, and 5 Comments.');
  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
