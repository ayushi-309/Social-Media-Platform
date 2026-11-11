const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  followUnfollowUser,
  getSuggestedUsers,
  searchUsers
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.get('/suggested', optionalAuth, getSuggestedUsers);
router.get('/search', searchUsers);
router.get('/:identifier', optionalAuth, getUserProfile);
router.post('/:id/follow', protect, followUnfollowUser);

module.exports = router;

