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
        this.easterEggShown = false; // 记录彩蛋是否已显示
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.grid = this.createEmptyGrid();
        this.clearTiles(); // Only clear when initializing
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }

    // New method for game restart that preserves DOM performance
    initGameState() {
        console.log('🔄 重新初始化游戏状态，保留DOM结构');
        this.grid = this.createEmptyGrid();
        // Don't call clearTiles or updateDisplay to avoid DOM destruction
        
        // Add initial tiles directly
        const tile1 = this.addRandomTile();
        const tile2 = this.addRandomTile();
        
        if (tile1) {
            this.createTile(tile1.value, tile1.row, tile1.col, true, false);
        }
        if (tile2) {
            this.createTile(tile2.value, tile2.row, tile2.col, true, false);
        }
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
        
        // Store position data for efficient lookup
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.value = value;
        
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
            
            // Use requestAnimationFrame for smoother animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    tile.style.transform = `translate(${x}px, ${y}px) scale(1)`;
                    tile.style.opacity = '1';
                });
            });
        }
        if (isMerged) {
            tile.classList.add('tile-merged');
        }
        
        this.tileContainer.appendChild(tile);
    }

    move(direction) {
        if (this.isAnimating) return; // Prevent moves during animation
        
        const previousGrid = this.copyGrid(this.grid);
        let moved = false;
        let scoreGained = 0;

        console.log(`🎮 开始移动: ${direction}`);

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

        console.log(`📊 移动结果: moved=${moved}, score=${scoreGained}`);

        if (moved) {
            this.score += scoreGained;
            this.updateBestScore();
            
            // Start visual animations while preserving the correct game logic
            this.isAnimating = true;
            this.animateMovement(previousGrid, this.grid, direction, () => {
                // Animation complete callback
                this.addRandomTile();
                this.updateDisplay();
                this.isAnimating = false;
                
                // 检查彩蛋
                this.checkEasterEgg();
                
                if (this.checkWin()) {
                    this.showMessage('You Win!', 'game-won');
                } else if (this.checkGameOver()) {
                    this.showMessage('Game Over!', 'game-over');
                }
            });
        }
    }

    animateMovement(oldGrid, newGrid, direction, callback) {
        console.log(`🎬 开始动画分析: ${direction}`);
        
        // 固定动画时长200ms，确保不同距离的移动都有相同速度感
        const animationDuration = 200;
        const tileSize = window.innerWidth <= 520 ? 80 : 110;
        
        // 当前DOM中的方块
        const currentTiles = Array.from(this.tileContainer.children);
        const animations = [];
        const tilesToRemove = [];
        
        // 创建已使用位置的跟踪集合，避免重复匹配
        const usedPositions = new Set();
        
        // 为每个旧位置的方块找到新位置并创建动画
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const oldValue = oldGrid[row][col];
                if (oldValue !== 0) {
                    const tile = this.findTileByOldPosition(currentTiles, row, col, oldValue);
                    if (tile) {
                        const newPos = this.findNewPositionWithTracking(oldGrid, newGrid, row, col, oldValue, direction, usedPositions);
                        if (newPos) {
                            console.log(`📍 创建动画: (${row},${col})[${oldValue}] -> (${newPos.row},${newPos.col})[${newPos.value}]`);
                            animations.push({
                                tile: tile,
                                fromRow: row,
                                fromCol: col,
                                toRow: newPos.row,
                                toCol: newPos.col,
                                oldValue: oldValue,
                                newValue: newPos.value,
                                isMerge: newPos.value !== oldValue
                            });
                            // 标记这个位置已被使用
                            usedPositions.add(`${newPos.row}-${newPos.col}`);
                        } else {
                            // findNewPosition 返回 null 有两种情况：
                            // 1. 方块没有移动也没有合并（最常见）
                            // 2. 方块被合并消除了（较少见）
                            const newValueAtPos = newGrid[row][col];
                            if (newValueAtPos === 0) {
                                // 原位置变成了0，说明方块被移走或合并了
                                console.log(`❌ 方块被移除或合并: (${row},${col})[${oldValue}]`);
                                tilesToRemove.push(tile);
                            } else {
                                console.log(`⏸️  方块保持不动: (${row},${col})[${oldValue}]`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`🎬 创建动画: ${animations.length}个移动, ${tilesToRemove.length}个消除`);
        
        // 执行移动动画
        animations.forEach(anim => {
            const targetX = anim.toCol * tileSize;
            const targetY = anim.toRow * tileSize;
            
            // 设置固定时长的动画
            anim.tile.style.transition = `transform ${animationDuration}ms ease-out`;
            anim.tile.style.transform = `translate(${targetX}px, ${targetY}px)`;
            
            // 更新tile的数据
            anim.tile.dataset.row = anim.toRow;
            anim.tile.dataset.col = anim.toCol;
        });
        
        // 处理合并和移除
        setTimeout(() => {
            // 处理合并的颜色变化
            animations.forEach(anim => {
                if (anim.isMerge) {
                    this.animateColorChange(anim.tile, anim.oldValue, anim.newValue);
                }
            });
            
            // 移除被合并消除的方块
            tilesToRemove.forEach(tile => {
                if (tile && tile.parentNode) {
                    tile.style.transition = 'opacity 150ms ease-out, transform 150ms ease-out';
                    tile.style.opacity = '0';
                    tile.style.transform = tile.style.transform + ' scale(0.8)';
                    setTimeout(() => {
                        if (tile.parentNode) {
                            tile.parentNode.removeChild(tile);
                        }
                    }, 150);
                }
            });
            
        }, animationDuration * 0.7);
        
        // 动画完成回调
        setTimeout(callback, animationDuration + 50);
    }
    
    findNewPosition(oldGrid, newGrid, oldRow, oldCol, oldValue, direction) {
        // 首先检查原位置的值
        const newValueAtOldPos = newGrid[oldRow][oldCol];
        
        // 如果原位置的值没有变化，说明这个方块没有移动也没有被合并
        if (newValueAtOldPos === oldValue) {
            console.log(`⏸️  方块保持原位: (${oldRow},${oldCol})[${oldValue}] - 原位置值未变`);
            return null; // 不需要动画
        }
        
        // 检查这个方块是否应该被移除（原位置变成0或其他值）
        if (newValueAtOldPos === 0) {
            console.log(`🔍 方块需要移动或合并: (${oldRow},${oldCol})[${oldValue}] - 原位置变成0`);
        } else {
            console.log(`🔍 方块位置被占用: (${oldRow},${oldCol})[${oldValue}] - 原位置现在是${newValueAtOldPos}`);
        }
        
        // 使用逐步搜索的方法，沿着移动方向查找最近的合理位置
        const searchPositions = this.getSearchPath(oldRow, oldCol, direction);
        
        // 先查找相同值的位置（普通移动）
        for (const pos of searchPositions) {
            if (newGrid[pos.row][pos.col] === oldValue) {
                console.log(`📦 找到移动目标: (${oldRow},${oldCol})[${oldValue}] -> (${pos.row},${pos.col})[${oldValue}]`);
                return {row: pos.row, col: pos.col, value: oldValue};
            }
        }
        
        // 再查找合并后的值（合并）
        const mergedValue = oldValue * 2;
        for (const pos of searchPositions) {
            if (newGrid[pos.row][pos.col] === mergedValue) {
                console.log(`🔥 找到合并目标: (${oldRow},${oldCol})[${oldValue}] -> (${pos.row},${pos.col})[${mergedValue}]`);
                return {row: pos.row, col: pos.col, value: mergedValue};
            }
        }
        
        console.log(`❌ 未找到目标位置: (${oldRow},${oldCol})[${oldValue}] - 方块可能被消除`);
        return null;
    }
    
    findNewPositionWithTracking(oldGrid, newGrid, oldRow, oldCol, oldValue, direction, usedPositions) {
        // 首先检查原位置的值
        const newValueAtOldPos = newGrid[oldRow][oldCol];
        
        // 如果原位置的值没有变化，说明这个方块没有移动也没有被合并
        if (newValueAtOldPos === oldValue) {
            console.log(`⏸️  方块保持原位: (${oldRow},${oldCol})[${oldValue}] - 原位置值未变`);
            return null; // 不需要动画
        }
        
        // 检查这个方块是否应该被移除（原位置变成0或其他值）
        if (newValueAtOldPos === 0) {
            console.log(`🔍 方块需要移动或合并: (${oldRow},${oldCol})[${oldValue}] - 原位置变成0`);
        } else {
            console.log(`🔍 方块位置被占用: (${oldRow},${oldCol})[${oldValue}] - 原位置现在是${newValueAtOldPos}`);
        }
        
        // 使用逐步搜索的方法，沿着移动方向查找最近的合理位置
        const searchPositions = this.getSearchPath(oldRow, oldCol, direction);
        
        // 先查找相同值的位置（普通移动）
        for (const pos of searchPositions) {
            const posKey = `${pos.row}-${pos.col}`;
            if (!usedPositions.has(posKey) && newGrid[pos.row][pos.col] === oldValue) {
                // 确保这个位置在原grid中确实发生了变化（不是原本就存在的值）
                if (oldGrid[pos.row][pos.col] !== oldValue) {
                    console.log(`📦 找到移动目标: (${oldRow},${oldCol})[${oldValue}] -> (${pos.row},${pos.col})[${oldValue}]`);
                    return {row: pos.row, col: pos.col, value: oldValue};
                } else {
                    console.log(`⚠️  跳过原本就存在的位置: (${pos.row},${pos.col})[${oldValue}] - 原grid中也是这个值`);
                }
            }
        }
        
        // 再查找合并后的值（合并）
        const mergedValue = oldValue * 2;
        for (const pos of searchPositions) {
            const posKey = `${pos.row}-${pos.col}`;
            if (!usedPositions.has(posKey) && newGrid[pos.row][pos.col] === mergedValue) {
                // 确保这个位置在原grid中确实发生了变化（合并是新产生的）
                if (oldGrid[pos.row][pos.col] !== mergedValue) {
                    console.log(`🔥 找到合并目标: (${oldRow},${oldCol})[${oldValue}] -> (${pos.row},${pos.col})[${mergedValue}]`);
                    return {row: pos.row, col: pos.col, value: mergedValue};
                } else {
                    console.log(`⚠️  跳过原本就存在的合并值: (${pos.row},${pos.col})[${mergedValue}] - 原grid中也是这个值`);
                }
            }
        }
        
        console.log(`❌ 未找到目标位置: (${oldRow},${oldCol})[${oldValue}] - 方块可能被消除`);
        return null;
    }
    
    getSearchPath(startRow, startCol, direction) {
        // 生成沿着移动方向的搜索路径，从最近到最远
        const positions = [];
        let currentRow = startRow;
        let currentCol = startCol;
        
        const directions = {
            'left': [0, -1],
            'right': [0, 1],
            'up': [-1, 0],
            'down': [1, 0]
        };
        
        const [deltaRow, deltaCol] = directions[direction] || [0, 0];
        
        // 沿着移动方向生成所有可能的位置
        while (true) {
            currentRow += deltaRow;
            currentCol += deltaCol;
            
            if (currentRow < 0 || currentRow >= this.size || 
                currentCol < 0 || currentCol >= this.size) {
                break;
            }
            
            positions.push({row: currentRow, col: currentCol});
        }
        
        return positions;
    }
    
    isReasonableTarget(oldRow, oldCol, newRow, newCol, direction) {
        // 检查移动是否符合方向逻辑，且真的移动了
        const actuallyMoved = (oldRow !== newRow) || (oldCol !== newCol);
        if (!actuallyMoved) {
            return false; // 没有移动就不是合理的目标
        }
        
        // 检查移动方向是否正确
        switch (direction) {
            case 'left':
                return newCol < oldCol && newRow === oldRow;
            case 'right':
                return newCol > oldCol && newRow === oldRow;
            case 'up':
                return newRow < oldRow && newCol === oldCol;
            case 'down':
                return newRow > oldRow && newCol === oldCol;
            default:
                return false;
        }
    }
    
    
    findTileByOldPosition(tiles, row, col, value) {
        return tiles.find(tile => 
            parseInt(tile.dataset.row) === row && 
            parseInt(tile.dataset.col) === col && 
            parseInt(tile.dataset.value) === value
        );
    }
    
    
    animateColorChange(tile, oldValue, newValue) {
        const oldColors = this.getTileColors(oldValue);
        const newColors = this.getTileColors(newValue);
        
        console.log(`🎨 颜色渐变: ${oldValue}->${newValue}, ${oldColors.bg}->${newColors.bg}`);
        
        // 更新数值
        tile.textContent = newValue;
        tile.dataset.value = newValue;
        tile.className = `tile tile-${newValue}`;
        
        // 设置渐变动画
        tile.style.transition = 'background-color 300ms ease-out, color 300ms ease-out, transform 150ms ease-out';
        tile.style.backgroundColor = newColors.bg;
        tile.style.color = newColors.color;
        
        // 添加轻微的缩放效果表示合并
        tile.style.transform = tile.style.transform + ' scale(1.1)';
        setTimeout(() => {
            tile.style.transform = tile.style.transform.replace(' scale(1.1)', '');
        }, 150);
        
        // 调整字体大小
        this.updateTileFontSize(tile, newValue);
    }
    
    getTileColors(value) {
        const colors = {
            2: { bg: '#eee4da', color: '#776e65' },
            4: { bg: '#ede0c8', color: '#776e65' },
            8: { bg: '#f2b179', color: '#f9f6f2' },
            16: { bg: '#f59563', color: '#f9f6f2' },
            32: { bg: '#f67c5f', color: '#f9f6f2' },
            64: { bg: '#f65e3b', color: '#f9f6f2' },
            128: { bg: '#edcf72', color: '#f9f6f2' },
            256: { bg: '#edcc61', color: '#f9f6f2' },
            512: { bg: '#edc850', color: '#f9f6f2' },
            1024: { bg: '#edc53f', color: '#f9f6f2' },
            2048: { bg: '#edc22e', color: '#f9f6f2' }
        };
        return colors[value] || { bg: '#3c3a32', color: '#f9f6f2' };
    }
    
    updateTileFontSize(tile, value) {
        let fontSize;
        if (window.innerWidth <= 520) {
            if (value >= 128 && value < 1024) fontSize = '20px';
            else if (value >= 1024) fontSize = '18px';
            else if (value > 2048) fontSize = '16px';
            else fontSize = '24px';
        } else {
            if (value >= 128 && value < 1024) fontSize = '28px';
            else if (value >= 1024) fontSize = '24px';
            else if (value > 2048) fontSize = '20px';
            else fontSize = '32px';
        }
        tile.style.fontSize = fontSize;
    }


    setTileColor(tile, value) {
        const colors = {
            2: { bg: '#eee4da', color: '#776e65' },
            4: { bg: '#ede0c8', color: '#776e65' },
            8: { bg: '#f2b179', color: '#f9f6f2' },
            16: { bg: '#f59563', color: '#f9f6f2' },
            32: { bg: '#f67c5f', color: '#f9f6f2' },
            64: { bg: '#f65e3b', color: '#f9f6f2' },
            128: { bg: '#edcf72', color: '#f9f6f2' },
            256: { bg: '#edcc61', color: '#f9f6f2' },
            512: { bg: '#edc850', color: '#f9f6f2' },
            1024: { bg: '#edc53f', color: '#f9f6f2' },
            2048: { bg: '#edc22e', color: '#f9f6f2' }
        };
        
        const tileColor = colors[value] || { bg: '#3c3a32', color: '#f9f6f2' };
        tile.style.background = tileColor.bg;
        tile.style.color = tileColor.color;
        
        // Adjust font size for larger numbers
        if (value >= 128) {
            tile.style.fontSize = window.innerWidth <= 520 ? '20px' : '28px';
        }
        if (value >= 1024) {
            tile.style.fontSize = window.innerWidth <= 520 ? '18px' : '24px';
        }
        if (value > 2048) {
            tile.style.fontSize = window.innerWidth <= 520 ? '16px' : '20px';
        }
    }

    findTileElement(row, col, value) {
        // Much more efficient lookup using dataset
        const tiles = this.tileContainer.children;
        for (let tile of tiles) {
            if (parseInt(tile.dataset.row) === row && 
                parseInt(tile.dataset.col) === col && 
                parseInt(tile.dataset.value) === value) {
                return tile;
            }
        }
        return null;
    }

    findAllTilesAtPosition(row, col) {
        const tiles = this.tileContainer.children;
        const found = [];
        for (let tile of tiles) {
            if (parseInt(tile.dataset.row) === row && 
                parseInt(tile.dataset.col) === col) {
                found.push(tile);
            }
        }
        return found;
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
        this.easterEggShown = false; // 重置彩蛋状态
        this.hideMessage();
        this.init();
    }
    
    checkEasterEgg() {
        // 如果彩蛋已经显示过，直接返回
        if (this.easterEggShown) return;
        
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
        
        // 如果所有必需的值都存在，显示彩蛋
        if (requiredValues.every(val => existingValues.has(val))) {
            console.log('🎉 彩蛋触发！同时存在 2, 4, 8, 16');
            this.showEasterEgg();
            this.easterEggShown = true;
        }
    }
    
    showEasterEgg() {
        // 创建气球弹窗
        const balloon = document.createElement('div');
        balloon.className = 'easter-egg-balloon';
        balloon.innerHTML = `
            <div class="balloon-content">
                <div class="qr-code-container">
                    <div class="qr-code-image">
                        <img src="wechat-qr.png" alt="WeChat QR Code" class="qr-code-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="qr-placeholder" style="display: none; width: 260px; height: 260px; border: 1px solid #ccc; align-items: center; justify-content: center; color: #666; font-size: 14px;">请将微信二维码保存为<br>wechat-qr.png</div>
                    </div>
                </div>
                <div class="balloon-tail"></div>
            </div>
        `;
        
        document.body.appendChild(balloon);
        
        // 添加点击事件监听器来关闭弹窗
        const closeBalloon = (e) => {
            // 只有点击气球外的区域才关闭
            if (!balloon.contains(e.target) || e.target === balloon) {
                balloon.classList.add('balloon-hide');
                setTimeout(() => {
                    if (balloon.parentNode) {
                        balloon.parentNode.removeChild(balloon);
                    }
                }, 300);
                document.removeEventListener('click', closeBalloon);
            }
        };
        
        // 延迟添加事件监听器，避免立即关闭
        setTimeout(() => {
            document.addEventListener('click', closeBalloon);
        }, 100);
    }
    

    setupEventListeners() {
        // Keyboard controls - use keydown for immediate response
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
                    this.move(direction);
                });
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
            // 阻止默认的触摸行为（滚动、缩放等）
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            // 阻止触摸移动时的默认行为（滚动、下拉刷新等）
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            // 阻止默认的触摸结束行为
            e.preventDefault();
            this.handleSwipe();
        }, { passive: false });

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