const Router = require('koa-router');
const articleController = require('../controllers/articleController');
const auth = require('../middlewares/auth');
const rateLimit = require('../middlewares/rateLimit');

const router = new Router({ prefix: '/api/articles' });

// 获取文章列表
router.get('/list', rateLimit(), articleController.getArticleList);

// 获取文章详情
router.get('/detail/:id', rateLimit(), articleController.getArticleDetail);

module.exports = router; 