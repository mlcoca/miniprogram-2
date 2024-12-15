App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'news-netease-1gg5rx8p10b107e8',
        traceUser: true
      })
    }

    // 获取系统信息
    try {
      const systemInfo = {
        ...wx.getWindowInfo(),
        ...wx.getSystemSetting(),
        ...wx.getAppBaseInfo(),
        ...wx.getDeviceInfo()
      }
      this.globalData.systemInfo = systemInfo
    } catch (e) {
      console.error('获取系统信息失败:', e)
    }
  },

  globalData: {
    userInfo: null,
    systemInfo: null
  }
}) 