const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 格式化日期
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const minute = d.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 格式化数字
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

exports.main = async (event, context) => {
  const { id } = event
  console.log('获取文章详情, ID:', id)
  
  try {
    // 查询文章详情
    const { data } = await db.collection('newsnetease-articles')
      .doc(id)
      .get()
      
    console.log('查询结果:', data)

    if (!data) {
      return {
        code: 404,
        message: '文章不存在'
      }
    }

    // 格式化数据
    const formattedData = {
      ...data,
      publishTime: formatDate(data.publishTime),
      readCount: formatNumber(data.readCount)
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
      data: formattedData
    }
  } catch (error) {
    console.error('查询失败:', error)
    return {
      code: 500,
      message: error.message || '查询失败'
    }
  }
} 