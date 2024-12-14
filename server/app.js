const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const articles = require('./routes/articles');
const categories = require('./routes/categories');
const accounts = require('./routes/accounts');

const app = new Koa();

// 中间件
app.use(cors());
app.use(bodyParser());

// 路由
app.use(articles.routes());
app.use(categories.routes());
app.use(accounts.routes());

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 