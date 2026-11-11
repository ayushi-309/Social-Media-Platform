const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get user profile by username or id
// @route   GET /api/users/:identifier
// @access  Public / Optional Auth
const getUserProfile = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is MongoDB ObjectId or username
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { username: identifier.toLowerCase() };

    const user = await User.findOne(query)
      .select('-password')
      .populate('followers', 'username name avatar bio')
      .populate('following', 'username name avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ author: user._id });

    // Determine if current logged-in user is following this profile
    let isFollowing = false;
    let isSelf = false;
    if (req.user) {
      isSelf = req.user._id.toString() === user._id.toString();
      isFollowing = user.followers.some(
        (follower) => follower._id.toString() === req.user._id.toString()
      );
    }

    return res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      postCount,
      followers: user.followers,
      following: user.following,
      isFollowing,
      isSelf
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    return res.status(500).json({ message: 'Server error retrieving user profile' });
  }
};

// @desc    Follow or Unfollow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUnfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isAlreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString()
    );

    let action;
    if (isAlreadyFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
      action = 'unfollowed';
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
      action = 'followed';
    }

    await targetUser.save();
    await currentUser.save();

    return res.json({
      message: `Successfully ${action} @${targetUser.username}`,
      action,
      isFollowing: action === 'followed',
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length
    });
  } catch (error) {
    console.error('followUnfollow error:', error);
    return res.status(500).json({ message: 'Server error processing follow/unfollow' });
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/users/suggested
// @access  Public / Optional Auth
const getSuggestedUsers = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      // Exclude current user and already followed users
      const excludeIds = [req.user._id, ...(req.user.following || [])];
      query = { _id: { $nin: excludeIds } };
    }

    const suggestions = await User.find(query)
      .select('username name avatar bio followers')
      .limit(6);

    const formatted = suggestions.map((u) => ({
      _id: u._id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: u.followers ? u.followers.length : 0
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('getSuggestedUsers error:', error);
    return res.status(500).json({ message: 'Server error fetching suggestions' });
  }
};

// @desc    Search users by name or username
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      $or: [{ username: regex }, { name: regex }]
    })
      .select('username name avatar bio followers')
      .limit(10);

    return res.json(users);
  } catch (error) {
    console.error('searchUsers error:', error);
    return res.status(500).json({ message: 'Server error searching users' });
  }
};

module.exports = {
  getUserProfile,
  followUnfollowUser,
  getSuggestedUsers,
  searchUsers
};

