const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content: content.trim()
    });

    // Increment post commentsCount
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'username name avatar'
    );

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment,
      commentsCount: post.commentsCount
    });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({ message: 'Server error adding comment' });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'username name avatar');

    return res.json(comments);
  } catch (error) {
    console.error('getPostComments error:', error);
    return res.status(500).json({ message: 'Server error retrieving comments' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const post = await Post.findById(comment.post);

    // Only comment author OR post author can delete the comment
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isPostAuthor = post && post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(comment._id);

    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
      await post.save();
    }

    return res.json({
      message: 'Comment deleted successfully',
      commentsCount: post ? post.commentsCount : 0
    });
  } catch (error) {
    console.error('deleteComment error:', error);
    return res.status(500).json({ message: 'Server error deleting comment' });
  }
};

module.exports = {
  addComment,
  getPostComments,
  deleteComment
};

