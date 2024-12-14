const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const { category = 'all', page = 1, size = 10 } = event
  
  try {
    const collection = db.collection('newsnetease-articles')
    let query = {}
    
    // 构建查询条件
    if (category !== 'all') {
      query.category = category
    }
    query.status = 1
    
    // 计算分页
    const skip = (page - 1) * size
    
    // 查询文章列表
    const { data } = await collection
      .where(query)
      .orderBy('publishTime', 'desc')
      .skip(skip)
      .limit(size)
      .get()
      
    // 获取总数
    const { total } = await collection
      .where(query)
      .count()
      
    return {
      code: 0,
      data: {
        list: data,
        total,
        page,
        size
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '查询失败'
    }
  }
} 