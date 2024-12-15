const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 分类映射
const CATEGORY_MAP = {
  '要闻': 'news',
  '科技': 'tech',
  '财经': 'finance',
  '体育': 'sports',
  '娱乐': 'ent'
}

exports.main = async (event, context) => {
  try {
    const collection = db.collection('newsnetease-articles')
    let fixed = 0
    let failed = 0
    let total = 0

    // 分批获取和修复
    const batchSize = 100
    let lastId = null

    while (true) {
      // 构建查询条件
      const query = {
        categoryId: db.command.exists(false)
      }
      if (lastId) {
        query._id = db.command.gt(lastId)
      }

      // 获取一批文章
      const { data } = await collection
        .where(query)
        .limit(batchSize)
        .orderBy('_id', 'asc')
        .get()

      if (data.length === 0) break

      total += data.length
      lastId = data[data.length - 1]._id

      // 修复这批文章
      for (const article of data) {
        try {
          const categoryId = CATEGORY_MAP[article.category]
          if (categoryId) {
            await collection.doc(article._id).update({
              data: {
                categoryId: categoryId
              }
            })
            fixed++
            console.log(`修复文章成功: ${article.title}`)
          } else {
            failed++
            console.error(`未知分类: ${article.category}, 文章: ${article.title}`)
          }
        } catch (error) {
          failed++
          console.error(`修复文章失败: ${article.title}`, error)
        }

        // 添加短暂延时，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return {
      code: 0,
      message: '修复完成',
      data: {
        total,
        fixed,
        failed
      }
    }
  } catch (error) {
    console.error('修复失败:', error)
    return {
      code: 500,
      message: '修复失败',
      error: error.message
    }
  }
}