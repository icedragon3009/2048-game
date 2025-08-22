/**
 * 图片预加载管理器
 * 在游戏启动时预加载图片，提升用户体验
 */
class ImagePreloader {
    constructor() {
        this.loadedImages = new Map();
        this.loadingPromises = new Map();
        this.preloadStarted = false;
    }

    /**
     * 预加载指定的图片列表
     * @param {Array} imageUrls - 需要预加载的图片URL列表
     * @returns {Promise} 所有图片加载完成的Promise
     */
    async preloadImages(imageUrls) {
        if (this.preloadStarted) {
            return Promise.all(Array.from(this.loadingPromises.values()));
        }
        
        this.preloadStarted = true;
        console.log('🖼️ 开始预加载图片...');
        
        const promises = imageUrls.map(url => this.loadSingleImage(url));
        
        try {
            await Promise.all(promises);
            console.log('✅ 所有图片预加载完成');
        } catch (error) {
            console.warn('⚠️ 部分图片预加载失败:', error);
        }
        
        return Promise.all(promises);
    }

    /**
     * 加载单个图片
     * @param {string} url - 图片URL
     * @returns {Promise} 图片加载完成的Promise
     */
    loadSingleImage(url) {
        // 如果已经加载过，直接返回
        if (this.loadedImages.has(url)) {
            return Promise.resolve(this.loadedImages.get(url));
        }
        
        // 如果正在加载，返回加载Promise
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log(`✅ 图片加载成功: ${url}`);
                this.loadedImages.set(url, img);
                this.loadingPromises.delete(url);
                resolve(img);
            };
            
            img.onerror = () => {
                console.error(`❌ 图片加载失败: ${url}`);
                this.loadingPromises.delete(url);
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            // 设置图片源，开始加载
            img.src = url;
        });
        
        this.loadingPromises.set(url, promise);
        return promise;
    }

    /**
     * 检查图片是否已加载
     * @param {string} url - 图片URL
     * @returns {boolean} 是否已加载
     */
    isImageLoaded(url) {
        return this.loadedImages.has(url);
    }

    /**
     * 获取已加载的图片对象
     * @param {string} url - 图片URL
     * @returns {Image|null} 图片对象
     */
    getLoadedImage(url) {
        return this.loadedImages.get(url) || null;
    }

    /**
     * 创建带有预加载支持的图片元素
     * @param {string} url - 图片URL
     * @param {Object} options - 选项
     * @returns {HTMLImageElement} 图片元素
     */
    createImageElement(url, options = {}) {
        const img = document.createElement('img');
        
        // 设置基本属性
        if (options.alt) img.alt = options.alt;
        if (options.className) img.className = options.className;
        
        // 如果图片已预加载，直接设置src
        if (this.isImageLoaded(url)) {
            img.src = url;
            if (options.onLoad) {
                // 使用setTimeout确保DOM已更新
                setTimeout(() => options.onLoad(), 0);
            }
        } else {
            // 显示加载中占位符
            if (options.placeholder) {
                img.style.backgroundColor = '#f0f0f0';
                img.style.border = '1px dashed #ccc';
            }
            
            // 异步加载图片
            this.loadSingleImage(url).then(() => {
                img.src = url;
                if (options.onLoad) options.onLoad();
            }).catch(() => {
                if (options.onError) options.onError();
            });
        }
        
        return img;
    }

    /**
     * 获取游戏需要的所有图片URL
     * @returns {Array} 图片URL列表
     */
    static getGameImageUrls() {
        return [
            'static/wechat-qr.png',
            'static/dache.png'
        ];
    }
}

// 创建全局实例
window.imagePreloader = new ImagePreloader();