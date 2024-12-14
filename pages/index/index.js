// index.js
Page({
  data: {
    currentTab: 'all',
    leftList: [],
    rightList: [],
    page: 1,
    size: 10,
    isLoading: false,
    isRefreshing: false,
    hasMore: true
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
      }
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
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
  }
})
