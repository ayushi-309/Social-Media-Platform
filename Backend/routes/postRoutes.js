const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeedPosts,
  getUserPosts,
  getPostById,
  likeUnlikePost,
  deletePost
} = require('../controllers/postController');
const {
  addComment,
  getPostComments
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Post endpoints
router.route('/')
  .get(optionalAuth, getFeedPosts)
  .post(protect, upload.single('image'), createPost);

router.get('/user/:identifier', optionalAuth, getUserPosts);

router.route('/:id')
  .get(optionalAuth, getPostById)
  .delete(protect, deletePost);

router.post('/:id/like', protect, likeUnlikePost);

// Nested comments for post
router.route('/:postId/comments')
  .get(getPostComments)
  .post(protect, addComment);

module.exports = router;

