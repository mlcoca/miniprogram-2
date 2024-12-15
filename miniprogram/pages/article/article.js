const { isValidImageUrl, getDefaultImage } = require('../../utils/image')

Page({
  data: {
    article: null,
    id: '',
    isLoading: true
  },

  onLoad(options) {
    console.log('文章详情页参数:', options)
    if (options.id) {
      this.setData({ id: options.id })
      this.getArticleDetail()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
    }
  },

  async getArticleDetail() {
    try {
      this.setData({ isLoading: true })
      console.log('获取文章详情:', this.data.id)
      
      const { result } = await wx.cloud.callFunction({
        name: 'getArticleDetail',
        data: {
          id: this.data.id
        }
      })

      console.log('文章详情结果:', result)

      if (result.code === 0 && result.data) {
        // 处理文章内容的换行
        if (result.data.content) {
          result.data.content = result.data.content.replace(/\\n/g, '\n')
        }
        
        // 检查图片URL
        if (!isValidImageUrl(result.data.coverUrl)) {
          result.data.coverUrl = getDefaultImage('cover')
        }
        if (!isValidImageUrl(result.data.accountAvatar)) {
          result.data.accountAvatar = getDefaultImage('avatar')
        }
        
        this.setData({
          article: result.data
        })
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: result.data.title
        })
      } else {
        throw new Error(result.message || '文章不存在')
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      wx.showToast({
        title: error.message || '文章加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.getArticleDetail()
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage() {
    const { article } = this.data
    return {
      title: article?.title || '精彩文章',
      path: `/pages/article/article?id=${this.data.id}`,
      imageUrl: article?.coverUrl
    }
  },

  // 处理图片加载错误
  handleImageError(e) {
    const { type } = e.currentTarget.dataset
    const defaultImage = getDefaultImage(type)
    
    if (type === 'cover') {
      this.setData({
        'article.coverUrl': defaultImage
      })
    } else if (type === 'avatar') {
      this.setData({
        'article.accountAvatar': defaultImage
      })
    }
  }
}) 