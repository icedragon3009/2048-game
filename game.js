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
        this.isAnimating = false;
        
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

    updateDisplay(newTiles = [], mergedTiles = []) {
        this.clearTiles();
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const isNew = newTiles.some(tile => tile.row === row && tile.col === col);
                    const isMerged = mergedTiles.some(tile => tile.row === row && tile.col === col);
                    this.createTile(value, row, col, isNew, isMerged);
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
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        
        // Calculate position directly instead of using CSS classes
        const tileSize = window.innerWidth <= 520 ? 80 : 110;
        const x = col * tileSize;
        const y = row * tileSize;
        
        // Set initial position directly
        tile.style.transform = `translate(${x}px, ${y}px)`;
        
        if (isNew) {
            // For new tiles, start with scale 0 and animate to normal size
            tile.style.transform = `translate(${x}px, ${y}px) scale(0)`;
            tile.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
            tile.style.opacity = '0';
            
            // Force a reflow to ensure the initial state is applied
            tile.offsetHeight;
            
            // Then animate to full size
            setTimeout(() => {
                tile.style.transform = `translate(${x}px, ${y}px) scale(1)`;
                tile.style.opacity = '1';
            }, 10);
        }
        if (isMerged) {
            tile.classList.add('tile-merged');
        }
        
        this.tileContainer.appendChild(tile);
    }

    move(direction) {
        if (this.isAnimating) return; // Prevent moves during animation
        
        const previousGrid = this.copyGrid(this.grid);
        const moveResults = this.calculateMoves(direction);
        
        if (moveResults.length === 0) return; // No moves possible
        
        this.isAnimating = true;
        this.animateMoves(moveResults, direction);
    }

    calculateMoves(direction) {
        const moves = [];
        const newGrid = this.copyGrid(this.grid);
        let scoreGained = 0;

        // Create a map of current tile positions
        const currentTiles = new Map();
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] !== 0) {
                    currentTiles.set(`${row}-${col}`, {
                        value: this.grid[row][col],
                        row: row,
                        col: col
                    });
                }
            }
        }

        // Calculate new positions
        switch (direction) {
            case 'left':
                for (let row = 0; row < this.size; row++) {
                    const result = this.slideArrayWithTracking(this.grid[row], row, direction);
                    newGrid[row] = result.array;
                    moves.push(...result.moves);
                    scoreGained += result.score;
                }
                break;
            case 'right':
                for (let row = 0; row < this.size; row++) {
                    const reversed = this.grid[row].slice().reverse();
                    const result = this.slideArrayWithTracking(reversed, row, direction);
                    newGrid[row] = result.array.reverse();
                    // Adjust moves for right direction
                    result.moves.forEach(move => {
                        move.toCol = this.size - 1 - move.toCol;
                        move.fromCol = this.size - 1 - move.fromCol;
                    });
                    moves.push(...result.moves);
                    scoreGained += result.score;
                }
                break;
            case 'up':
                for (let col = 0; col < this.size; col++) {
                    const column = [];
                    for (let row = 0; row < this.size; row++) {
                        column.push(this.grid[row][col]);
                    }
                    const result = this.slideArrayWithTracking(column, col, direction);
                    for (let row = 0; row < this.size; row++) {
                        newGrid[row][col] = result.array[row];
                    }
                    moves.push(...result.moves);
                    scoreGained += result.score;
                }
                break;
            case 'down':
                for (let col = 0; col < this.size; col++) {
                    const column = [];
                    for (let row = this.size - 1; row >= 0; row--) {
                        column.push(this.grid[row][col]);
                    }
                    const result = this.slideArrayWithTracking(column, col, direction);
                    for (let row = 0; row < this.size; row++) {
                        newGrid[this.size - 1 - row][col] = result.array[row];
                    }
                    // Adjust moves for down direction
                    result.moves.forEach(move => {
                        move.toRow = this.size - 1 - move.toRow;
                        move.fromRow = this.size - 1 - move.fromRow;
                    });
                    moves.push(...result.moves);
                    scoreGained += result.score;
                }
                break;
        }

        this.pendingGrid = newGrid;
        this.pendingScore = scoreGained;
        return moves;
    }

    slideArrayWithTracking(array, fixedIndex, direction) {
        const moves = [];
        let score = 0;
        const newArray = [...array];
        
        // First pass: move non-zero elements
        const nonZeros = [];
        for (let i = 0; i < array.length; i++) {
            if (array[i] !== 0) {
                nonZeros.push({value: array[i], originalIndex: i});
            }
        }
        
        // Create moves for sliding
        for (let i = 0; i < nonZeros.length; i++) {
            const tile = nonZeros[i];
            if (tile.originalIndex !== i) {
                const move = {
                    value: tile.value,
                    distance: Math.abs(tile.originalIndex - i)
                };
                
                if (direction === 'left' || direction === 'right') {
                    move.fromRow = fixedIndex;
                    move.fromCol = tile.originalIndex;
                    move.toRow = fixedIndex;
                    move.toCol = i;
                } else {
                    move.fromRow = tile.originalIndex;
                    move.fromCol = fixedIndex;
                    move.toRow = i;
                    move.toCol = fixedIndex;
                }
                
                moves.push(move);
            }
            newArray[i] = tile.value;
        }
        
        // Fill the rest with zeros
        for (let i = nonZeros.length; i < this.size; i++) {
            newArray[i] = 0;
        }
        
        // Second pass: handle merges
        for (let i = 0; i < this.size - 1; i++) {
            if (newArray[i] !== 0 && newArray[i] === newArray[i + 1]) {
                newArray[i] *= 2;
                newArray[i + 1] = 0;
                score += newArray[i];
                
                // Create merge move
                const mergeMove = {
                    value: newArray[i],
                    merged: true,
                    distance: 1
                };
                
                if (direction === 'left' || direction === 'right') {
                    mergeMove.fromRow = fixedIndex;
                    mergeMove.fromCol = i + 1;
                    mergeMove.toRow = fixedIndex;
                    mergeMove.toCol = i;
                } else {
                    mergeMove.fromRow = i + 1;
                    mergeMove.fromCol = fixedIndex;
                    mergeMove.toRow = i;
                    mergeMove.toCol = fixedIndex;
                }
                
                moves.push(mergeMove);
            }
        }
        
        // Third pass: slide again after merging
        const finalFiltered = newArray.filter(val => val !== 0);
        const finalMissing = this.size - finalFiltered.length;
        const finalZeros = Array(finalMissing).fill(0);
        const finalArray = finalFiltered.concat(finalZeros);
        
        return { array: finalArray, moves: moves, score: score };
    }

    animateMoves(moves, direction) {
        if (moves.length === 0) {
            this.isAnimating = false;
            return;
        }

        // Calculate animation duration based on distance
        const baseSpeed = 120; // milliseconds per grid unit
        const maxDuration = Math.max(...moves.map(move => move.distance * baseSpeed));
        
        // Apply animations to existing tiles
        moves.forEach(move => {
            const tileElement = this.findTileElement(move.fromRow, move.fromCol, move.value);
            if (tileElement) {
                const duration = move.distance * baseSpeed;
                const tileSize = window.innerWidth <= 520 ? 80 : 110; // Responsive tile spacing
                tileElement.style.transition = `transform ${duration}ms ease-out`;
                tileElement.style.transform = `translate(${move.toCol * tileSize}px, ${move.toRow * tileSize}px)`;
                
                if (move.merged) {
                    setTimeout(() => {
                        tileElement.classList.add('tile-merged');
                    }, duration);
                }
            }
        });

        // Update grid and display after animation
        setTimeout(() => {
            this.grid = this.pendingGrid;
            this.score += this.pendingScore;
            this.updateBestScore();
            
            const newTile = this.addRandomTile();
            const newTiles = newTile ? [newTile] : [];
            this.updateDisplay(newTiles, []);
            
            this.isAnimating = false;
            
            if (this.checkWin()) {
                this.showMessage('You Win!', 'game-won');
            } else if (this.checkGameOver()) {
                this.showMessage('Game Over!', 'game-over');
            }
        }, maxDuration + 50);
    }

    findTileElement(row, col, value) {
        const tiles = document.querySelectorAll('.tile');
        const tileSize = window.innerWidth <= 520 ? 80 : 110;
        const expectedX = col * tileSize;
        const expectedY = row * tileSize;
        
        for (let tile of tiles) {
            const classes = tile.className.split(' ');
            const valueClass = `tile-${value}`;
            
            if (classes.includes(valueClass)) {
                // Extract current position from transform
                const transform = tile.style.transform;
                const matches = transform.match(/translate\((\d+)px,\s*(\d+)px\)/);
                
                if (matches) {
                    const currentX = parseInt(matches[1]);
                    const currentY = parseInt(matches[2]);
                    
                    if (currentX === expectedX && currentY === expectedY) {
                        return tile;
                    }
                }
            }
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
        this.isAnimating = false;
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