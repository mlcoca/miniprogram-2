"""
网易新闻爬虫程序
"""

import os
import time
import logging
import hashlib
import requests
import schedule
from bs4 import BeautifulSoup
from datetime import datetime
from pymongo import MongoClient
from urllib.parse import urljoin
import config

# 配置日志
logging.basicConfig(
    format=config.LOG_FORMAT,
    level=getattr(logging, config.LOG_LEVEL)
)
logger = logging.getLogger(__name__)

class NewsCrawler:
    def __init__(self):
        # 初始化数据库连接
        self.client = MongoClient(config.MONGODB_URI)
        self.db = self.client[config.MONGODB_DB]
        self.collection = self.db[config.MONGODB_COLLECTION]
        
        # 创建索引
        self.collection.create_index([("url", 1)], unique=True)
        self.collection.create_index([("category", 1), ("publish_time", -1)])
        
        # 创建图片保存目录
        os.makedirs(config.IMAGE_SAVE_PATH, exist_ok=True)
        
        # 请求头
        self.headers = {
            "User-Agent": config.USER_AGENT
        }

    def download_image(self, image_url, category):
        """下载并保存��片"""
        try:
            response = requests.get(image_url, headers=self.headers)
            if response.status_code == 200:
                # 生成文件名
                image_hash = hashlib.md5(image_url.encode()).hexdigest()
                image_ext = image_url.split('.')[-1].split('?')[0]
                image_name = f"{category}_{image_hash}.{image_ext}"
                image_path = os.path.join(config.IMAGE_SAVE_PATH, image_name)
                
                # 保存图片
                with open(image_path, 'wb') as f:
                    f.write(response.content)
                
                return urljoin(config.IMAGE_BASE_URL, image_name)
        except Exception as e:
            logger.error(f"下载图片失败: {image_url}, 错误: {str(e)}")
        return image_url

    def parse_article(self, url, category):
        """解析文章详情"""
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 提取文章信息
                title = soup.find('h1').text.strip()
                content = soup.find('div', class_='post_text').text.strip()
                image_element = soup.find('img', class_='post_img')
                image_url = image_element['src'] if image_element else None
                
                if image_url:
                    image_url = self.download_image(image_url, category)
                
                return {
                    'title': title,
                    'content': content,
                    'image_url': image_url
                }
        except Exception as e:
            logger.error(f"解析文章失败: {url}, 错误: {str(e)}")
        return None

    def crawl_category(self, category, url):
        """爬取特定分类的新闻"""
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                articles = []
                
                # 查找新闻链接
                for link in soup.find_all('a', href=True):
                    if '/article/' in link['href']:
                        article_url = link['href']
                        
                        # 检查是否已存在
                        if not self.collection.find_one({"url": article_url}):
                            article_data = self.parse_article(article_url, category)
                            if article_data:
                                article = {
                                    'url': article_url,
                                    'category': category,
                                    'title': article_data['title'],
                                    'content': article_data['content'],
                                    'cover_url': article_data['image_url'],
                                    'publish_time': datetime.now(),
                                    'read_count': 0
                                }
                                articles.append(article)
                
                # 批量插入数据库
                if articles:
                    self.collection.insert_many(articles)
                    logger.info(f"分类 {category} 新增 {len(articles)} 篇文章")
                
                # 清理旧文章
                self.cleanup_old_articles(category)
                
        except Exception as e:
            logger.error(f"爬取分类失败: {category}, 错误: {str(e)}")

    def cleanup_old_articles(self, category):
        """清理旧文章，保持每个分类的文章数量在限制内"""
        try:
            count = self.collection.count_documents({"category": category})
            if count > config.MAX_ARTICLES_PER_CATEGORY:
                # 获取最旧的文章
                old_articles = self.collection.find(
                    {"category": category}
                ).sort(
                    "publish_time", 1
                ).limit(
                    count - config.MAX_ARTICLES_PER_CATEGORY
                )
                
                # 删除文章及其图片
                for article in old_articles:
                    if article.get('cover_url'):
                        image_path = article['cover_url'].split('/')[-1]
                        full_path = os.path.join(config.IMAGE_SAVE_PATH, image_path)
                        if os.path.exists(full_path):
                            os.remove(full_path)
                    
                    self.collection.delete_one({"_id": article["_id"]})
                
                logger.info(f"清理分类 {category} 的旧文章完成")
        except Exception as e:
            logger.error(f"清理旧文章失败: {category}, 错误: {str(e)}")

    def run(self):
        """运行爬虫"""
        logger.info("开始爬取新闻...")
        for category, url in config.NEWS_URLS.items():
            self.crawl_category(category, url)
        logger.info("爬取完成")

def start_crawler():
    """启动爬虫服务"""
    crawler = NewsCrawler()
    
    # 立即运行一次
    crawler.run()
    
    # 设置定时任务
    schedule.every(config.CRAWLER_INTERVAL).seconds.do(crawler.run)
    
    # 持续运行
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    start_crawler() 