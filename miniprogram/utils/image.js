// 检查图片URL是否有效
function isValidImageUrl(url) {
  if (!url) return false;
  return url.startsWith('http') || url.startsWith('https');
}

// 获取默认图片
function getDefaultImage(type = 'cover') {
  const images = {
    cover: '/images/default-cover.png',
    avatar: '/images/default-avatar.png'
  };
  return images[type] || images.cover;
}

module.exports = {
  isValidImageUrl,
  getDefaultImage
}; 