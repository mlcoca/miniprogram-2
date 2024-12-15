// pages/index/index.js
const app = getApp()
const { isValidImageUrl, getDefaultImage } = require('../../utils/image');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'news', name: '要闻' },
      { id: 'tech', name: '科技' },
      { id: 'finance', name: '财经' },
      { id: 'sports', name: '体育' },
      { id: 'ent', name: '娱乐' }
    ],
    leftList: [],
    rightList: [],
    page: 1,
    size: 10,
    isLoading: false,
    isRefreshing: false,
    hasMore: true,
    windowHeight: 0,
    showBackTop: false,
    scrollTop: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 获取窗口高度
    const { windowHeight } = app.globalData.systemInfo || wx.getWindowInfo()
    this.setData({
      windowHeight
    })
    
    this.getArticles(true)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getArticles(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.onLoadMore()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '今日热点',
      path: '/pages/index/index'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '今日热点'
    }
  },

  // 获取文章列表
  async getArticles(refresh = false) {
    if (this.data.isLoading) return
    
    try {
      this.setData({ isLoading: true })
      
      if (refresh) {
        this.setData({ page: 1 })
      }
      
      const { result } = await wx.cloud.callFunction({
        name: 'getArticles',
        data: {
          category: this.data.currentTab,
          page: this.data.page,
          size: this.data.size
        }
      })
      
      if (result.code === 0) {
        const { list, total } = result.data
        
        // 瀑布流数据处理
        const newLeftList = []
        const newRightList = []
        
        list.forEach((item, index) => {
          if (index % 2 === 0) {
            newLeftList.push(item)
          } else {
            newRightList.push(item)
          }
        })
        
        if (refresh) {
          this.setData({
            leftList: newLeftList,
            rightList: newRightList,
            hasMore: this.data.page * this.data.size < total
          })
        } else {
          this.setData({
            leftList: [...this.data.leftList, ...newLeftList],
            rightList: [...this.data.rightList, ...newRightList],
            hasMore: this.data.page * this.data.size < total
          })
        }
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      // 添加重试按钮
      wx.showModal({
        title: '加载失败',
        content: '是否重试？',
        success: (res) => {
          if (res.confirm) {
            this.getArticles(refresh)
          }
        }
      })
    } finally {
      this.setData({ 
        isLoading: false,
        isRefreshing: false
      })
    }
  },

  // 切换分类
  async switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ 
      currentTab: tab,
      leftList: [],
      rightList: [],
      page: 1
    })
    await this.getArticles(true)
  },

  // 下拉刷新
  async onRefresh() {
    this.setData({ isRefreshing: true })
    await this.getArticles(true)
  },

  // 加载更多
  async onLoadMore() {
    if (!this.data.hasMore || this.data.isLoading) return
    
    this.setData({
      page: this.data.page + 1
    })
    await this.getArticles()
  },

  // 查看文章详情
  viewArticle(e) {
    const { id } = e.currentTarget.dataset
    console.log('点击文章:', id)
    wx.navigateTo({
      url: `/pages/article/article?id=${id}`
    })
  },

  // 监听滚动
  onPageScroll(e) {
    const { scrollTop } = e
    this.setData({
      scrollTop,
      showBackTop: scrollTop > 300
    })
  },

  // 返回顶部
  backToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },

  // 处理图片加载错误
  handleImageError(e) {
    const { index, type } = e.currentTarget.dataset
    const defaultImage = getDefaultImage('cover')
    
    if (type === 'left') {
      const key = `leftList[${index}].coverUrl`
      this.setData({
        [key]: defaultImage
      })
    } else {
      const key = `rightList[${index}].coverUrl`
      this.setData({
        [key]: defaultImage
      })
    }
  }
})