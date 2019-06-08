const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const authRoute = require('./../../middleware/authRoute');
const Post = require('./../../models/Post');
const User = require('./../../models/User');
const Profile = require('./../../models/Profile');
const config = require('config');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [
    authRoute,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private

router.get('/', authRoute, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error({ msg: err.message });
    res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/:post_id
// @desc    Get a post by id
// @access  Private

router.get('/:post_id', authRoute, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error({ msg: err.message });
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invalid post id' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/posts/:post_id
// @desc    Get all posts
// @access  Private

router.delete('/:post_id', authRoute, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.post_id });

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    // check on user
    //note post.user is an object, req.user.id is a string, so post.user must be converted to a string
    if (post.user.toString() !== req.user.id) {
      return res.status(401).res({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error({ msg: err.message });
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invalid post id' });
    }

    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Like a post
// @access  Private

router.put('/like/:post_id', authRoute, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    // check if post has already be liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (err) {}
});

// @route   PUT api/posts/unlike/:post_id
// @desc    Unlike a post
// @access  Private

router.put('/unlike/:post_id', authRoute, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    // check if post has already be liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (err) {}
});

// @route   POST api/posts/comment/:post_id
// @desc    Create a comment
// @access  Private
router.post(
  '/comment/:post_id',
  [
    authRoute,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.post_id);

      const newComment = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete('/comment/:post_id/:comment_id', authRoute, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );
    // make sure comment exists

    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    //check user

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
