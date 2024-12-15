const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const collection = db.collection('newsnetease-articles')
    const stats = {
      total: 0,
      byCategory: {},
      noCategoryId: 0,
      recentArticles: []
    }

    // 获取总数
    const { total } = await collection.count()
    stats.total = total

    // 按分类统计
    const categories = ['news', 'tech', 'finance', 'sports', 'ent']
    for (const category of categories) {
      const { total } = await collection
        .where({
          categoryId: category
        })
        .count()
      stats.byCategory[category] = total
    }

    // 统计没有 categoryId 的文章
    const { total: noCategory } = await collection
      .where({
        categoryId: db.command.exists(false)
      })
      .count()
    stats.noCategoryId = noCategory

    // 获取最近10篇文章的分类信息
    const { data: recent } = await collection
      .orderBy('createTime', 'desc')
      .limit(10)
      .field({
        title: true,
        categoryId: true,
        category: true,
        createTime: true
      })
      .get()
    stats.recentArticles = recent

    return {
      code: 0,
      data: stats
    }
  } catch (error) {
    console.error('检查文章失败:', error)
    return {
      code: 500,
      message: '检查文章失败',
      error: error.message
    }
  }
} 