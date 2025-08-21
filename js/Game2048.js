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
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});