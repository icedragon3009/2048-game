/**
 * 2048 游戏彩蛋功能模块
 * 处理彩蛋触发和显示逻辑
 */
class EasterEgg {
    constructor() {
        this.isShown = false;
        this.qrOverlay = null;
        this.dacheOverlay = null;
        this.isProtected = false; // 保护状态，防止误点关闭
        this.protectionTimeout = null; // 保护倒计时
    }

    show() {
        if (this.isShown) return;
        
        // 创建二维码弹窗（第一层）
        this.qrOverlay = document.createElement('div');
        this.qrOverlay.className = 'easter-egg-qr-overlay';
        this.qrOverlay.innerHTML = `
            <div class="easter-egg-qr-content">
                <div class="qr-code-container">
                    <div class="qr-code-image">
                        <img src="${ImagePreloader.getResponsiveImageUrl('wechat-qr')}" alt="WeChat QR Code" class="qr-code-img" loading="eager">
                        <!-- 点击引导动画 -->
                        <div class="click-guide">
                            <div class="click-indicator"></div>
                            <div class="click-ripple"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.qrOverlay);
        
        // 启动2秒保护机制
        this.startProtection();
        
        // 二维码图片点击事件
        const qrImage = this.qrOverlay.querySelector('.qr-code-image');
        let touchStartTime = 0;
        let touchMoved = false;
        
        // 桌面端点击
        qrImage.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDacheOverlay();
        });
        
        // 移动端触摸开始
        qrImage.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchMoved = false;
        });
        
        // 移动端触摸移动
        qrImage.addEventListener('touchmove', (e) => {
            touchMoved = true;
        });
        
        // 移动端触摸结束
        qrImage.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const touchDuration = Date.now() - touchStartTime;
            
            // 只有快速点击（小于500ms）且没有移动时才触发
            if (touchDuration < 500 && !touchMoved) {
                this.showDacheOverlay();
            }
        });
        
        // 点击二维码弹窗外区域关闭整个彩蛋（保护机制延迟添加）
        this.setupQrOutsideClickHandlers();
        
        this.isShown = true;
    }

    showDacheOverlay() {
        // 创建搭车浮层（第二层，覆盖在二维码上方）
        this.dacheOverlay = document.createElement('div');
        this.dacheOverlay.className = 'easter-egg-dache-overlay';
        
        // 创建内容容器
        const content = document.createElement('div');
        content.className = 'easter-egg-dache-content';
        
        // 创建图片容器
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        
        // 使用预加载器创建图片，提供更好的加载体验
        const baseImageUrl = ImagePreloader.getResponsiveImageUrl('dache');
        const imageUrl = `${baseImageUrl}?v=${Date.now()}`;
        
        if (window.imagePreloader && window.imagePreloader.isImageLoaded(baseImageUrl)) {
            // 图片已预加载，直接显示
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = '搭车场景';
            img.className = 'dache-image';
            imageContainer.appendChild(img);
        } else {
            // 图片未预加载，显示加载动画
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            loadingSpinner.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-text">加载中...</div>
            `;
            imageContainer.appendChild(loadingSpinner);
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = '搭车场景';
            img.className = 'dache-image';
            img.style.display = 'none';
            
            img.onload = () => {
                img.style.display = 'block';
                loadingSpinner.style.display = 'none';
                img.style.animation = 'imageFadeIn 0.5s ease-in-out';
            };
            
            img.onerror = () => {
                loadingSpinner.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.style.cssText = 'width: 200px; height: 150px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px; text-align: center;';
                placeholder.innerHTML = `搭车图片加载失败<br>路径: ${baseImageUrl}`;
                imageContainer.appendChild(placeholder);
            };
            
            imageContainer.appendChild(img);
        }
        
        content.appendChild(imageContainer);
        
        // 添加其余HTML内容
        content.innerHTML += `
                <!-- 选择按钮区域 -->
                <div class="choice-buttons">
                    <button class="choice-btn yes-btn">🚀 搭车</button>
                    <button class="choice-btn no-btn">不搭</button>
                </div>
                
                <!-- 价格信息（初始隐藏） -->
                <div class="price-info" style="display: none;">
                    <div class="price-title">联系方式与价格</div>
                    <div class="price-list">
                        <div class="price-item">+v：icedragon_817</div>
                        <div class="price-item">日付：15米</div>
                        <div class="price-item">周付：80米</div>
                        <div class="price-item">月付：300米</div>
                    </div>
                </div>
                
                <div class="close-btn">×</div>
        `;
        
        this.dacheOverlay.appendChild(content);
        document.body.appendChild(this.dacheOverlay);
        
        // 搭车浮层的关闭事件
        const closeBtn = this.dacheOverlay.querySelector('.close-btn');
        const noBtnElement = this.dacheOverlay.querySelector('.no-btn');
        const yesBtnElement = this.dacheOverlay.querySelector('.yes-btn');
        const priceInfo = this.dacheOverlay.querySelector('.price-info');
        const choiceButtons = this.dacheOverlay.querySelector('.choice-buttons');
        
        const closeDacheOverlay = () => {
            this.dacheOverlay.classList.add('fade-out');
            setTimeout(() => {
                if (this.dacheOverlay && this.dacheOverlay.parentNode) {
                    this.dacheOverlay.parentNode.removeChild(this.dacheOverlay);
                    this.dacheOverlay = null;
                }
            }, 300);
        };
        
        // 不搭按钮事件 - 关闭浮层和整个彩蛋
        const handleNoBtn = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeAll(); // 关闭整个彩蛋
        };
        
        noBtnElement.addEventListener('click', handleNoBtn);
        noBtnElement.addEventListener('touchend', handleNoBtn);
        
        // 搭按钮事件 - 显示价格信息
        const handleYesBtn = (e) => {
            e.preventDefault();
            e.stopPropagation();
            choiceButtons.style.display = 'none';
            priceInfo.style.display = 'block';
        };
        
        yesBtnElement.addEventListener('click', handleYesBtn);
        yesBtnElement.addEventListener('touchend', handleYesBtn);
        
        // 关闭按钮事件
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeDacheOverlay();
        });
        
        closeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeDacheOverlay();
        });
        
        // 点击搭车浮层外区域关闭搭车浮层（不关闭二维码）
        this.dacheOverlay.addEventListener('click', (e) => {
            if (e.target === this.dacheOverlay) {
                e.preventDefault();
                closeDacheOverlay();
            }
        });
        
        this.dacheOverlay.addEventListener('touchend', (e) => {
            if (e.target === this.dacheOverlay) {
                e.preventDefault();
                closeDacheOverlay();
            }
        });
    }

    closeAll() {
        // 重置保护状态
        this.resetProtection();
        
        // 关闭所有弹窗
        if (this.dacheOverlay) {
            this.dacheOverlay.classList.add('fade-out');
            setTimeout(() => {
                if (this.dacheOverlay && this.dacheOverlay.parentNode) {
                    this.dacheOverlay.parentNode.removeChild(this.dacheOverlay);
                    this.dacheOverlay = null;
                }
            }, 300);
        }
        
        if (this.qrOverlay) {
            this.qrOverlay.classList.add('fade-out');
            setTimeout(() => {
                if (this.qrOverlay && this.qrOverlay.parentNode) {
                    this.qrOverlay.parentNode.removeChild(this.qrOverlay);
                    this.qrOverlay = null;
                }
            }, 300);
        }
        
        this.isShown = false;
    }

    reset() {
        this.isShown = false;
        this.resetProtection();
    }

    getStatus() {
        return this.isShown;
    }

    /**
     * 启动2秒保护机制，防止彩蛋刚出现就被误点关闭
     */
    startProtection() {
        this.isProtected = true;
        console.log('🛡️ 彩蛋保护机制启动，2秒内不会被误点关闭');
        
        // 添加保护状态的视觉提示
        if (this.qrOverlay) {
            this.qrOverlay.classList.add('easter-egg-protected');
        }
        
        // 清除之前的保护倒计时（如果存在）
        if (this.protectionTimeout) {
            clearTimeout(this.protectionTimeout);
        }
        
        // 2秒后解除保护
        this.protectionTimeout = setTimeout(() => {
            this.isProtected = false;
            console.log('✅ 彩蛋保护机制解除，现在可以点击外部区域关闭');
            
            // 移除保护状态的视觉提示
            if (this.qrOverlay) {
                this.qrOverlay.classList.remove('easter-egg-protected');
            }
            
            this.protectionTimeout = null;
        }, 2000);
    }

    /**
     * 设置二维码弹窗外部点击处理器（延迟添加）
     */
    setupQrOutsideClickHandlers() {
        // 立即添加事件监听器，但在处理函数中检查保护状态
        const handleOutsideClick = (e) => {
            // 如果还在保护期内，忽略点击
            if (this.isProtected) {
                console.log('🛡️ 彩蛋正在保护期内，忽略外部点击');
                return;
            }
            
            // 检查点击是否在内容区域外
            if (!this.qrOverlay.querySelector('.easter-egg-qr-content').contains(e.target)) {
                this.closeAll();
            }
        };

        const handleOutsideTouch = (e) => {
            // 如果还在保护期内，忽略触摸
            if (this.isProtected) {
                console.log('🛡️ 彩蛋正在保护期内，忽略外部触摸');
                e.preventDefault();
                return;
            }
            
            // 检查触摸是否在内容区域外
            if (!this.qrOverlay.querySelector('.easter-egg-qr-content').contains(e.target)) {
                e.preventDefault();
                this.closeAll();
            }
        };
        
        // 添加事件监听器
        this.qrOverlay.addEventListener('click', handleOutsideClick);
        this.qrOverlay.addEventListener('touchend', handleOutsideTouch);
    }

    /**
     * 重置保护状态（在关闭彩蛋时调用）
     */
    resetProtection() {
        this.isProtected = false;
        
        // 清除保护倒计时
        if (this.protectionTimeout) {
            clearTimeout(this.protectionTimeout);
            this.protectionTimeout = null;
        }
        
        // 移除保护状态的视觉提示
        if (this.qrOverlay) {
            this.qrOverlay.classList.remove('easter-egg-protected');
        }
    }
}