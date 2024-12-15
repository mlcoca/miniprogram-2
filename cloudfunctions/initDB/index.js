const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 检查集合是否存在
async function checkCollectionExists(collectionName) {
  try {
    await db.collection(collectionName).count()
    return true
  } catch (error) {
    return false
  }
}

// 初始化数据库函数
exports.main = async (event, context) => {
  try {
    // 检查并创建文章集合
    const articlesExists = await checkCollectionExists('newsnetease-articles')
    if (!articlesExists) {
      await db.createCollection('newsnetease-articles')
    }

    // 检查并创建分类集合
    const categoriesExists = await checkCollectionExists('newsnetease-categories')
    if (!categoriesExists) {
      await db.createCollection('newsnetease-categories')
    }
    
    // 检查并初始化分类数据
    const { total } = await db.collection('newsnetease-categories').count()
    if (total === 0) {
      await db.collection('newsnetease-categories').add({
        data: [
          { code: 'all', name: '全部', sortOrder: 0, status: 1 },
          { code: 'tech', name: '科技', sortOrder: 1, status: 1 },
          { code: 'finance', name: '财经', sortOrder: 2, status: 1 },
          { code: 'life', name: '生活', sortOrder: 3, status: 1 },
          { code: 'entertainment', name: '娱乐', sortOrder: 4, status: 1 },
          { code: 'sports', name: '体育', sortOrder: 5, status: 1 }
        ]
      })
    }

    // 检查并初始化文章测试数据
    const { total: articleTotal } = await db.collection('newsnetease-articles').count()
    if (articleTotal === 0) {
      const testArticles = [
        {
          title: '最新科技突破：AI技术再创新高',
          coverUrl: 'https://picsum.photos/400/300?random=1',
          content: '人工智能技术在2024年取得重大突破...',
          category: 'tech',
          readCount: 1000,
          accountId: 'test_account_1',
          accountName: '科技前沿',
          accountAvatar: 'https://picsum.photos/100/100?random=1',
          publishTime: new Date(),
          status: 1,
          createTime: new Date(),
          updateTime: new Date()
        },
        {
          title: '全球金融市场最新动态',
          coverUrl: 'https://picsum.photos/400/300?random=2',
          content: '全球股市今日出现显著波动...',
          category: 'finance',
          readCount: 800,
          accountId: 'test_account_2',
          accountName: '财经观察',
          accountAvatar: 'https://picsum.photos/100/100?random=2',
          publishTime: new Date(),
          status: 1,
          createTime: new Date(),
          updateTime: new Date()
        },
        {
          title: '健康生活新方式',
          coverUrl: 'https://picsum.photos/400/300?random=3',
          content: '专家分享最新健康生活方式...',
          category: 'life',
          readCount: 600,
          accountId: 'test_account_3',
          accountName: '生活家',
          accountAvatar: 'https://picsum.photos/100/100?random=3',
          publishTime: new Date(),
          status: 1,
          createTime: new Date(),
          updateTime: new Date()
        }
      ]

      for (const article of testArticles) {
        await db.collection('newsnetease-articles').add({
          data: article
        })
      }
    }
    
    return {
      code: 0,
      message: '数据库初始化成功'
    }
  } catch (error) {
    return {
      code: 500,
      message: '数据库初始化失败',
      error: error
    }
  }
} 