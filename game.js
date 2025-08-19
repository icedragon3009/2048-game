class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.size = 4;
        this.tileContainer = document.querySelector('.tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessage = document.querySelector('.game-message');
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.grid = this.createEmptyGrid();
        this.updateDisplay();
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
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
        }
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

    updateDisplay() {
        this.clearTiles();
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    this.createTile(value, row, col);
                }
            }
        }
        
        this.scoreElement.textContent = this.score;
        this.bestScoreElement.textContent = this.bestScore;
    }

    clearTiles() {
        this.tileContainer.innerHTML = '';
    }

    createTile(value, row, col, isNew = false, isMerged = false) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value} tile-position-${row + 1}-${col + 1}`;
        tile.textContent = value;
        
        if (isNew) {
            tile.classList.add('tile-new');
        }
        if (isMerged) {
            tile.classList.add('tile-merged');
        }
        
        this.tileContainer.appendChild(tile);
    }

    move(direction) {
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
            this.addRandomTile();
            this.updateDisplay();
            
            if (this.checkWin()) {
                this.showMessage('You Win!', 'game-won');
            } else if (this.checkGameOver()) {
                this.showMessage('Game Over!', 'game-over');
            }
        }
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

    showMessage(text, className) {
        const messageP = this.gameMessage.querySelector('p');
        messageP.textContent = text;
        this.gameMessage.className = `game-message ${className}`;
        this.gameMessage.style.display = 'block';
    }

    hideMessage() {
        this.gameMessage.style.display = 'none';
    }

    restart() {
        this.score = 0;
        this.hideMessage();
        this.init();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.move('down');
                    break;
            }
        });

        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        });

        const handleSwipe = () => {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 50;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
        };

        this.handleSwipe = handleSwipe;

        // Button controls
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.restart();
        });

        document.querySelector('.retry-button').addEventListener('click', () => {
            this.restart();
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});