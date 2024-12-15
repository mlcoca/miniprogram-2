const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 获取文章列表
exports.main = async (event, context) => {
  const { category = 'all', page = 1, size = 10 } = event
  const skip = (page - 1) * size
  
  try {
    let query = {}
    
    // 添加分类过滤
    if (category !== 'all') {
      query.categoryId = category
    }

    console.log('查询条件:', query)

    // 获取总数
    const countResult = await db.collection('newsnetease-articles')
      .where(query)
      .count()

    console.log('文章总数:', countResult.total)

    // 获取列表
    const { data } = await db.collection('newsnetease-articles')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(size)
      .get()

    console.log('获取到的文章:', data.length)
    console.log('第一篇文章:', data[0])

    return {
      code: 0,
      data: {
        list: data,
        total: countResult.total
      }
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    return {
      code: 500,
      message: '获取文章列表失败'
    }
  }
} 