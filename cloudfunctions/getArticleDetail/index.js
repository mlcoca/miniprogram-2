const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { id } = event
  
  try {
    // 查询文章详情
    const { data } = await db.collection('newsnetease-articles')
      .doc(id)
      .get()
      
    if (!data) {
      return {
        code: 404,
        message: '文章不存在'
      }
    }
    
    // 更新阅读数
    await db.collection('newsnetease-articles')
      .doc(id)
      .update({
        data: {
          readCount: db.command.inc(1)
        }
      })
    
    return {
      code: 0,
      data
    }
  } catch (error) {
    return {
      code: 500,
      message: '查询失败'
    }
  }
} 