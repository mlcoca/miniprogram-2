const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 文章集合
const articlesSchema = {
  _id: 'string',  // 文章ID
  title: 'string',  // 文章标题
  coverUrl: 'string',  // 封面图片
  content: 'string',  // 文章内容
  category: 'string',  // 分类: all/tech/finance/life/entertainment/sports
  readCount: 'number',  // 阅读数
  accountId: 'string',  // 作者ID
  accountName: 'string',  // 作者名称
  accountAvatar: 'string',  // 作者头像
  publishTime: 'date',  // 发布时间
  status: 'number',  // 状态：0-草稿，1-已发布
  createTime: 'date',  // 创建时间
  updateTime: 'date'   // 更新时间
}

// 分类集合
const categoriesSchema = {
  _id: 'string',  // 分类ID
  name: 'string',  // 分类名称
  code: 'string',  // 分类代码
  sortOrder: 'number',  // 排序
  status: 'number'  // 状态：0-禁用，1-启用
}

// 初始化数据库函数
exports.main = async (event, context) => {
  try {
    // 创建集合
    await db.createCollection('newsnetease-articles')
    await db.createCollection('newsnetease-categories')
    
    // 创建索引
    const articleCollection = db.collection('newsnetease-articles')
    await articleCollection.createIndexes([
      {
        key: {
          category: 1,
          publishTime: -1
        },
        name: 'category_publish_time_idx'
      },
      {
        key: {
          status: 1
        },
        name: 'status_idx'
      }
    ])
    
    // 初始化分类数据
    const categoryCollection = db.collection('newsnetease-categories')
    await categoryCollection.add({
      data: [
        { code: 'all', name: '全部', sortOrder: 0, status: 1 },
        { code: 'tech', name: '科技', sortOrder: 1, status: 1 },
        { code: 'finance', name: '财经', sortOrder: 2, status: 1 },
        { code: 'life', name: '生活', sortOrder: 3, status: 1 },
        { code: 'entertainment', name: '娱乐', sortOrder: 4, status: 1 },
        { code: 'sports', name: '体育', sortOrder: 5, status: 1 }
      ]
    })
    
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