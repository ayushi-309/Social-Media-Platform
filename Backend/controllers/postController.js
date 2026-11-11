const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content cannot be empty' });
    }

    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      image = imageUrl.trim();
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      image,
      likes: [],
      commentsCount: 0
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'username name avatar'
    );

    return res.status(201).json({
      message: 'Post created successfully',
      post: {
        ...populatedPost.toObject(),
        isLiked: false,
        likesCount: 0
      }
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({ message: 'Server error creating post' });
  }
};

// @desc    Get feed posts (explore or following)
// @route   GET /api/posts
// @access  Public / Optional Auth
const getFeedPosts = async (req, res) => {
  try {
    const { filter, page = 1, limit = 20 } = req.query;
    let query = {};

    // If filtering by following and user is logged in
    if (filter === 'following' && req.user) {
      const currentUser = await User.findById(req.user._id);
      const followingIds = currentUser.following || [];
      // Include following users AND own posts in the following feed
      query = { author: { $in: [...followingIds, req.user._id] } };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('author', 'username name avatar bio');

    const formattedPosts = posts.map((post) => {
      const isLiked = req.user
        ? post.likes.some((id) => id.toString() === req.user._id.toString())
        : false;

      return {
        _id: post._id,
        content: post.content,
        image: post.image,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        likesCount: post.likes.length,
        commentsCount: post.commentsCount,
        isLiked
      };
    });

    return res.json(formattedPosts);
  } catch (error) {
    console.error('getFeedPosts error:', error);
    return res.status(500).json({ message: 'Server error retrieving feed posts' });
  }
};

// @desc    Get posts by a specific user
// @route   GET /api/posts/user/:identifier
// @access  Public / Optional Auth
const getUserPosts = async (req, res) => {
  try {
    const { identifier } = req.params;

    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    let targetUser;
    if (isObjectId) {
      targetUser = await User.findById(identifier);
    } else {
      targetUser = await User.findOne({ username: identifier.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ author: targetUser._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username name avatar bio');

    const formatted = posts.map((post) => {
      const isLiked = req.user
        ? post.likes.some((id) => id.toString() === req.user._id.toString())
        : false;

      return {
        _id: post._id,
        content: post.content,
        image: post.image,
        author: post.author,
        createdAt: post.createdAt,
        likesCount: post.likes.length,
        commentsCount: post.commentsCount,
        isLiked
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('getUserPosts error:', error);
    return res.status(500).json({ message: 'Server error fetching user posts' });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public / Optional Auth
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'username name avatar bio'
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = req.user
      ? post.likes.some((id) => id.toString() === req.user._id.toString())
      : false;

    return res.json({
      _id: post._id,
      content: post.content,
      image: post.image,
      author: post.author,
      createdAt: post.createdAt,
      likesCount: post.likes.length,
      commentsCount: post.commentsCount,
      isLiked
    });
  } catch (error) {
    console.error('getPostById error:', error);
    return res.status(500).json({ message: 'Server error retrieving post' });
  }
};

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const likeUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const isLiked = post.likes.some((id) => id.toString() === userId.toString());

    let action;
    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      action = 'unliked';
    } else {
      // Like
      post.likes.push(userId);
      action = 'liked';
    }

    await post.save();

    return res.json({
      message: `Post ${action}`,
      action,
      isLiked: action === 'liked',
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('likeUnlikePost error:', error);
    return res.status(500).json({ message: 'Server error processing like' });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only post author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete all comments of this post
    await Comment.deleteMany({ post: post._id });

    // Delete post
    await Post.findByIdAndDelete(post._id);

    return res.json({ message: 'Post and associated comments removed successfully' });
  } catch (error) {
    console.error('deletePost error:', error);
    return res.status(500).json({ message: 'Server error deleting post' });
  }
};

module.exports = {
  createPost,
  getFeedPosts,
  getUserPosts,
  getPostById,
  likeUnlikePost,
  deletePost
};

