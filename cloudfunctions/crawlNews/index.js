const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 默认图片配置
const DEFAULT_IMAGES = {
  cover: 'https://inews.gtimg.com/newsapp_bt/0/13263837859/1000',
  avatar: 'https://inews.gtimg.com/newsapp_bt/0/13263837859/1000'
}

// 分类配置
const CATEGORIES = {
  news: {
    id: '24hours',
    name: '要闻',
    channel: 'news',
    icon: DEFAULT_IMAGES.cover
  },
  tech: {
    id: 'tech',
    name: '科技',
    channel: 'tech',
    icon: DEFAULT_IMAGES.cover
  },
  finance: {
    id: 'finance',
    name: '财经',
    channel: 'finance',
    icon: DEFAULT_IMAGES.cover
  },
  sports: {
    id: 'sports',
    name: '体育',
    channel: 'sports',
    icon: DEFAULT_IMAGES.cover
  },
  ent: {
    id: 'ent',
    name: '娱乐',
    channel: 'ent',
    icon: DEFAULT_IMAGES.cover
  }
}

// 获取新闻列表
async function getNewsList(category = 'news') {
  try {
    const channelConfig = CATEGORIES[category] || CATEGORIES.news
    const categoryName = channelConfig.name

    // 添加重试机制
    let retryCount = 3;
    let lastError;

    while (retryCount > 0) {
      try {
        const response = await axios.get('https://i.news.qq.com/trpc.qqnews_web.kv_srv.kv_srv_http_proxy/list', {
          params: {
            sub_srv_id: channelConfig.id,
            srv_id: 'pc',
            offset: 0,
            limit: 20,
            strategy: 1,
            ext: '{"pool":["top","hot"],"is_filter":7,"check_type":true}'
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Origin': 'https://news.qq.com',
            'Referer': 'https://news.qq.com/',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 5000
        })

        const { data } = response
        if (!data || !data.data || !data.data.list) {
          throw new Error('数据格式错误')
        }

        // 提取新闻数据
        const articles = data.data.list
          .filter(news => news.title && news.url) // 过滤无效数据
          .map(news => ({
            title: news.title.trim(),
            coverUrl: news.img || channelConfig.icon || DEFAULT_IMAGES.cover,
            summary: (news.abstract || news.title).trim(),
            url: news.url,
            category: categoryName,
            categoryId: category,
            readCount: Math.floor(Math.random() * 10000),
            accountName: (news.media_name || '腾讯新闻').trim(),
            accountAvatar: news.media_avatar || DEFAULT_IMAGES.avatar,
            publishTime: new Date(news.publish_time || Date.now()),
            status: 1,
            createTime: new Date(),
            updateTime: new Date(),
            content: `
              ${news.title}

              ${news.abstract || ''}

              ${news.content || ''}

              来源：${news.media_name || '腾讯新闻'}
              发布时间：${news.publish_time ? new Date(news.publish_time).toLocaleString() : new Date().toLocaleString()}
              
              原文链接：${news.url}
            `.trim().replace(/\n\s+/g, '\n')
          }))

        return articles
      } catch (error) {
        lastError = error
        retryCount--
        if (retryCount > 0) {
          console.log(`获取${categoryName}新闻失败，剩余重试次数：${retryCount}`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    throw lastError
  } catch (error) {
    console.error(`获取${CATEGORIES[category].name}新闻失败:`, error)
    return []
  }
}

// 批量保存到数据库
async function saveToDatabase(articles) {
  const collection = db.collection('newsnetease-articles')
  let successCount = 0
  let failCount = 0
  
  try {
    // 批量检查文章是否存在
    const titles = articles.map(article => article.title)
    const { data: existingArticles } = await collection
      .where({
        title: db.command.in(titles),
        createTime: db.command.gte(new Date(Date.now() - 24 * 60 * 60 * 1000))
      })
      .get()
    
    const existingTitles = new Set(existingArticles.map(article => article.title))
    const newArticles = articles.filter(article => !existingTitles.has(article.title))
    
    // 分批保存新文章
    const batchSize = 10
    for (let i = 0; i < newArticles.length; i += batchSize) {
      const batch = newArticles.slice(i, i + batchSize)
      const savePromises = batch.map(article => 
        collection.add({
          data: {
            ...article,
            createTime: new Date(),
            updateTime: new Date(),
            categoryId: article.categoryId || article.category
          }
        }).then(() => {
          successCount++
          console.log(`保存文章成功: ${article.title} (${article.categoryId})`)
          return true
        }).catch(error => {
          failCount++
          console.error(`保存文章失败: ${article.title}`, error)
          return false
        })
      )

      try {
        await Promise.all(savePromises)
      } catch (error) {
        console.error('批量保存失败:', error)
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }
  } catch (error) {
    console.error('数据库操作失败:', error)
  }

  return { successCount, failCount }
}

// 清理旧文章
async function cleanOldArticles() {
  const collection = db.collection('newsnetease-articles')
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 改为3天

  try {
    // 分批获取旧文章
    const batchSize = 100
    let lastId = null
    let totalDeleted = 0

    while (true) {
      const query = {
        createTime: db.command.lt(threeDaysAgo)
      }
      if (lastId) {
        query._id = db.command.gt(lastId)
      }

      const { data } = await collection
        .where(query)
        .limit(batchSize)
        .orderBy('_id', 'asc')
        .get()

      if (data.length === 0) break

      // 删除这批文章
      for (const article of data) {
        await collection.doc(article._id).remove()
        totalDeleted++
      }

      lastId = data[data.length - 1]._id

      // 添加短暂延时
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`清理了 ${totalDeleted} 篇旧文章`)
  } catch (error) {
    console.error('清理旧文章失败:', error)
  }
}

// 主函数
exports.main = async (event, context) => {
  try {
    console.log('开始爬取文章...')
    const results = {}

    // 清理旧文章
    await cleanOldArticles()

    // 并行获取各个分类的新闻
    const categories = Object.keys(CATEGORIES)
    const promises = categories.map(async category => {
      const categoryName = CATEGORIES[category].name
      console.log(`开始获取${categoryName}新闻...`)
      const articles = await getNewsList(category)
      console.log(`获取到${categoryName}文章数:`, articles.length)
      
      if (articles.length > 0) {
        const { successCount, failCount } = await saveToDatabase(articles)
        return {
          category,
          result: {
            name: categoryName,
            total: articles.length,
            success: successCount,
            fail: failCount
          }
        }
      }
      return {
        category,
        result: {
          name: categoryName,
          total: 0,
          success: 0,
          fail: 0
        }
      }
    })

    // 等待所有分类爬取完成
    const categoryResults = await Promise.all(promises)
    categoryResults.forEach(({ category, result }) => {
      results[category] = result
    })

    return {
      code: 0,
      message: '爬取成功',
      data: results
    }
  } catch (error) {
    console.error('爬取失败:', error)
    return {
      code: 500,
      message: '爬取失败',
      error: error.message
    }
  }
} 