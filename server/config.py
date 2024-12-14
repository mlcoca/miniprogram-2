"""
配置文件
"""

# 数据库配置
MONGODB_URI = "mongodb://localhost:27017/"
MONGODB_DB = "news_app"
MONGODB_COLLECTION = "articles"

# 网易新闻分类 URL
NEWS_URLS = {
    "tech": "https://news.163.com/tech",
    "finance": "https://money.163.com",
    "sports": "https://sports.163.com",
    "entertainment": "https://ent.163.com",
    "life": "https://news.163.com/domestic"
}

# API 配置
API_HOST = "0.0.0.0"
API_PORT = 5000

# 爬虫配置
CRAWLER_INTERVAL = 3600  # 爬虫间隔（秒）
MAX_ARTICLES_PER_CATEGORY = 50  # 每个分类最大文章数
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# 图片处理
IMAGE_SAVE_PATH = "images/"
IMAGE_BASE_URL = "http://your_domain/images/"  # 替换为你的域名

# 日志配置
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_LEVEL = "INFO" 