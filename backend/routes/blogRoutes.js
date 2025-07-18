const express = require('express');
const { createBlog,
    getBlogBySlug,
    getAllBlogs
} = require('../controllers/blogController');

const router = express.Router();

router.post('/', createBlog);
router.get('/:slug', getBlogBySlug);
router.get('/', getAllBlogs);

module.exports = router;
