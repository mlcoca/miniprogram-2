App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-8gfvv1gf3c3f0d0f', // 确保这是您的云环境ID
        traceUser: true,
      })
    }

    this.globalData = {
      userInfo: null
    }
  }
}) 