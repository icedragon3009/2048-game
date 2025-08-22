/**
 * 2048 游戏主控制器
 * 协调各个模块的工作
 */
class Game2048 {
    constructor() {
        this.core = new GameCore();
        this.ui = new GameUI();
        this.easterEgg = new EasterEgg();
        this.inputHandler = new InputHandler(this);
        
        this.init();
    }

    init() {
        const gameState = this.core.init();
        this.ui.updateDisplay(gameState.grid);
        this.ui.updateScore(gameState.score, gameState.bestScore);
        this.ui.hideMessage();
    }

    handleMove(direction) {
        const moveResult = this.core.move(direction);
        
        if (moveResult) {
            this.core.setAnimating(true);
            
            // 开始动画
            this.ui.animateMovement(moveResult.previousGrid, moveResult.newGrid, direction, () => {
                // 动画完成后的回调
                const newTile = this.core.addRandomTile();
                const newTiles = newTile ? [newTile] : [];
                
                this.ui.updateDisplay(this.core.getGameState().grid, newTiles);
                this.ui.updateScore(this.core.getGameState().score, this.core.getGameState().bestScore);
                this.core.setAnimating(false);
                
                // 检查彩蛋
                if (this.core.checkEasterEgg()) {
                    this.easterEgg.show();
                }
                
                // 检查游戏状态
                if (this.core.checkWin()) {
                    this.ui.showMessage('You Win!', 'game-won');
                } else if (this.core.checkGameOver()) {
                    this.ui.showMessage('Game Over!', 'game-over');
                }
            });
        }
    }

    restart() {
        const gameState = this.core.restart();
        this.easterEgg.reset();
        this.ui.hideMessage();
        this.ui.updateDisplay(gameState.grid);
        this.ui.updateScore(gameState.score, gameState.bestScore);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', async () => {
    // 立即开始预加载图片（游戏启动时）
    const imageUrls = ImagePreloader.getGameImageUrls();
    window.imagePreloader.preloadImages(imageUrls);
    
    // 初始化游戏（不等待图片加载完成）
    const game = new Game2048();
    
    // 监控预加载进度
    const preloadPromise = window.imagePreloader.preloadImages(imageUrls);
    preloadPromise.then(() => {
        console.log('🎉 所有游戏图片预加载完成，彩蛋将秒开！');
        // 可以在这里触发一些UI提示，告知用户图片已准备就绪
        if (window.performance && window.performance.mark) {
            window.performance.mark('images-preloaded');
        }
    }).catch((error) => {
        console.warn('⚠️ 图片预加载遇到问题，但不影响游戏运行:', error);
    });
    
    // 用户首次移动时再次确保图片已预加载（双重保险）
    let hasTriggeredSecondaryPreload = false;
    const originalMove = game.move;
    game.move = function(direction) {
        if (!hasTriggeredSecondaryPreload) {
            hasTriggeredSecondaryPreload = true;
            console.log('🔄 用户开始游戏，确保图片预加载');
            window.imagePreloader.preloadImages(imageUrls);
        }
        return originalMove.call(this, direction);
    };
});