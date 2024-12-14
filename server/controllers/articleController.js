const pool = require('../config/database');
const redis = require('../config/redis');

class ArticleController {
  // 获取文章列表
  async getArticleList(ctx) {
    const { category = 'all', page = 1, size = 10 } = ctx.query;
    
    try {
      const cacheKey = `articles:${category}:${page}`;
      let articles = await redis.get(cacheKey);
      
      if (articles) {
        ctx.body = {
          code: 0,
          data: JSON.parse(articles)
        };
        return;
      }

      const offset = (page - 1) * size;
      const categoryCondition = category === 'all' ? '' : 'WHERE a.category = ?';
      
      const [rows] = await pool.execute(`
        SELECT 
          a.id, a.title, a.cover_url, a.read_count,
          a.publish_time, acc.name as account_name,
          acc.avatar_url as account_avatar
        FROM articles a
        LEFT JOIN accounts acc ON a.account_id = acc.id
        ${categoryCondition}
        ORDER BY a.publish_time DESC
        LIMIT ?, ?
      `, category === 'all' ? [offset, size] : [category, offset, size]);

      // 设置缓存，有效期5分钟
      await redis.setex(cacheKey, 300, JSON.stringify(rows));

      ctx.body = {
        code: 0,
        data: rows
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        message: '服务器错误'
      };
    }
  }

  // 获取文章详情
  async getArticleDetail(ctx) {
    const { id } = ctx.params;
    
    try {
      const [article] = await pool.execute(`
        SELECT 
          a.*, acc.name as account_name,
          acc.avatar_url as account_avatar
        FROM articles a
        LEFT JOIN accounts acc ON a.account_id = acc.id
        WHERE a.id = ?
      `, [id]);

      if (!article.length) {
        ctx.body = {
          code: 404,
          message: '文章不存在'
        };
        return;
      }

      // 更新阅读数
      this.incrementReadCount(id);

      ctx.body = {
        code: 0,
        data: article[0]
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        message: '服务器错误'
      };
    }
  }

  // 增加阅读数
  async incrementReadCount(articleId) {
    const readCountKey = `article:readcount:${articleId}`;
    const count = await redis.hincrby('article:readcount', articleId, 1);
    
    // 每累计100次阅读，同步到数据库
    if (count % 100 === 0) {
      await pool.execute(
        'UPDATE articles SET read_count = ? WHERE id = ?',
        [count, articleId]
      );
    }
  }
}

module.exports = new ArticleController(); 