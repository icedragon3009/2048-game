/**
 * 2048 游戏核心逻辑模块
 * 处理游戏状态、数据操作和游戏规则
 */
class GameCore {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.size = 4;
        this.isAnimating = false;
        this.easterEggShown = false;
    }

    init() {
        this.grid = this.createEmptyGrid();
        this.addRandomTile();
        this.addRandomTile();
        return {
            grid: this.grid,
            score: this.score,
            bestScore: this.bestScore
        };
    }

    createEmptyGrid() {
        const grid = [];
        for (let i = 0; i < this.size; i++) {
            grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                grid[i][j] = 0;
            }
        }
        return grid;
    }

    addRandomTile() {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const cell = emptyCells[randomIndex];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[cell.row][cell.col] = value;
            return { row: cell.row, col: cell.col, value: value };
        }
        return null;
    }

    getEmptyCells() {
        const cells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    cells.push({ row: i, col: j });
                }
            }
        }
        return cells;
    }

    move(direction) {
        if (this.isAnimating) return null;
        
        const previousGrid = this.copyGrid(this.grid);
        let moved = false;
        let scoreGained = 0;

        switch (direction) {
            case 'left':
                for (let row = 0; row < this.size; row++) {
                    const result = this.slideArray(this.grid[row]);
                    this.grid[row] = result.array;
                    scoreGained += result.score;
                    if (result.moved) moved = true;
                }
                break;
            case 'right':
                for (let row = 0; row < this.size; row++) {
                    const reversed = this.grid[row].slice().reverse();
                    const result = this.slideArray(reversed);
                    this.grid[row] = result.array.reverse();
                    scoreGained += result.score;
                    if (result.moved) moved = true;
                }
                break;
            case 'up':
                for (let col = 0; col < this.size; col++) {
                    const column = [];
                    for (let row = 0; row < this.size; row++) {
                        column.push(this.grid[row][col]);
                    }
                    const result = this.slideArray(column);
                    for (let row = 0; row < this.size; row++) {
                        this.grid[row][col] = result.array[row];
                    }
                    scoreGained += result.score;
                    if (result.moved) moved = true;
                }
                break;
            case 'down':
                for (let col = 0; col < this.size; col++) {
                    const column = [];
                    for (let row = this.size - 1; row >= 0; row--) {
                        column.push(this.grid[row][col]);
                    }
                    const result = this.slideArray(column);
                    for (let row = 0; row < this.size; row++) {
                        this.grid[this.size - 1 - row][col] = result.array[row];
                    }
                    scoreGained += result.score;
                    if (result.moved) moved = true;
                }
                break;
        }

        if (moved) {
            this.score += scoreGained;
            this.updateBestScore();
            return {
                previousGrid,
                newGrid: this.copyGrid(this.grid),
                scoreGained,
                moved: true
            };
        }
        
        return null;
    }

    slideArray(array) {
        const filtered = array.filter(val => val !== 0);
        const missing = this.size - filtered.length;
        const zeros = Array(missing).fill(0);
        const newArray = filtered.concat(zeros);
        
        let score = 0;
        let moved = false;
        
        // Check if the array changed (moved)
        for (let i = 0; i < this.size; i++) {
            if (array[i] !== newArray[i]) {
                moved = true;
                break;
            }
        }
        
        // Merge adjacent equal elements
        for (let i = 0; i < this.size - 1; i++) {
            if (newArray[i] !== 0 && newArray[i] === newArray[i + 1]) {
                newArray[i] *= 2;
                newArray[i + 1] = 0;
                score += newArray[i];
                moved = true;
            }
        }
        
        // Slide again after merging
        const finalFiltered = newArray.filter(val => val !== 0);
        const finalMissing = this.size - finalFiltered.length;
        const finalZeros = Array(finalMissing).fill(0);
        const finalArray = finalFiltered.concat(finalZeros);
        
        return { array: finalArray, score: score, moved: moved };
    }

    copyGrid(grid) {
        return grid.map(row => row.slice());
    }

    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    checkWin() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    checkGameOver() {
        // Check for empty cells
        if (this.getEmptyCells().length > 0) {
            return false;
        }
        
        // Check for possible merges
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const current = this.grid[row][col];
                
                // Check right neighbor
                if (col < this.size - 1 && current === this.grid[row][col + 1]) {
                    return false;
                }
                
                // Check bottom neighbor
                if (row < this.size - 1 && current === this.grid[row + 1][col]) {
                    return false;
                }
            }
        }
        
        return true;
    }

    checkEasterEgg() {
        // 如果彩蛋已经显示过，直接返回
        if (this.easterEggShown) return false;
        
        // 检查是否同时存在 2, 4, 8, 16
        const requiredValues = [2, 4, 8, 16];
        const existingValues = new Set();
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.grid[row][col];
                if (requiredValues.includes(value)) {
                    existingValues.add(value);
                }
            }
        }
        
        // 如果所有必需的值都存在，触发彩蛋
        if (requiredValues.every(val => existingValues.has(val))) {
            this.easterEggShown = true;
            return true;
        }
        
        return false;
    }

    restart() {
        this.score = 0;
        this.isAnimating = false;
        this.easterEggShown = false;
        return this.init();
    }

    setAnimating(isAnimating) {
        this.isAnimating = isAnimating;
    }

    getGameState() {
        return {
            grid: this.copyGrid(this.grid),
            score: this.score,
            bestScore: this.bestScore,
            isAnimating: this.isAnimating,
            easterEggShown: this.easterEggShown
        };
    }
}