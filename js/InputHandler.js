/**
 * 2048 游戏输入处理模块
 * 处理键盘、触摸和按钮事件
 */
class InputHandler {
    constructor(game) {
        this.game = game;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            
            let direction = null;
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    direction = 'right';
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    direction = 'down';
                    break;
            }
            
            if (direction) {
                e.preventDefault();
                // Use requestAnimationFrame for immediate response
                requestAnimationFrame(() => {
                    this.game.handleMove(direction);
                });
            }
        });

        // 触摸控制
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
            // 阻止默认的触摸行为（滚动、缩放等）
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            // 阻止触摸移动时的默认行为（滚动、下拉刷新等）
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            // 阻止默认的触摸结束行为
            e.preventDefault();
            this.handleSwipe();
        }, { passive: false });

        // 按钮控制
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.game.restart();
            });
        }

        const retryButton = document.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.game.restart();
            });
        }
    }

    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.game.handleMove('right');
                } else {
                    this.game.handleMove('left');
                }
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    this.game.handleMove('down');
                } else {
                    this.game.handleMove('up');
                }
            }
        }
    }
}