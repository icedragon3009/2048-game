/**
 * 2048 游戏彩蛋功能模块
 * 处理彩蛋触发和显示逻辑
 */
class EasterEgg {
    constructor() {
        this.isShown = false;
        this.qrOverlay = null;
        this.dacheOverlay = null;
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
                        <img src="static/wechat-qr.png" alt="WeChat QR Code" class="qr-code-img">
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
        
        // 点击二维码弹窗外区域关闭整个彩蛋
        this.qrOverlay.addEventListener('click', (e) => {
            if (!this.qrOverlay.querySelector('.easter-egg-qr-content').contains(e.target)) {
                this.closeAll();
            }
        });
        
        this.qrOverlay.addEventListener('touchend', (e) => {
            if (!this.qrOverlay.querySelector('.easter-egg-qr-content').contains(e.target)) {
                e.preventDefault();
                this.closeAll();
            }
        });
        
        this.isShown = true;
    }

    showDacheOverlay() {
        // 创建搭车浮层（第二层，覆盖在二维码上方）
        this.dacheOverlay = document.createElement('div');
        this.dacheOverlay.className = 'easter-egg-dache-overlay';
        this.dacheOverlay.innerHTML = `
            <div class="easter-egg-dache-content">
                <img src="static/dache.png?v=${Date.now()}" alt="搭车场景" class="dache-image" onerror="console.error('Failed to load dache.png'); this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="image-placeholder" style="display: none; width: 200px; height: 150px; border: 2px dashed #ccc; align-items: center; justify-content: center; color: #666; font-size: 14px; text-align: center;">搭车图片加载失败<br>路径: static/dache.png</div>
                
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
            </div>
        `;
        
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
    }

    getStatus() {
        return this.isShown;
    }
}