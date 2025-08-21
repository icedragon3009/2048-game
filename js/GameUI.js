/**
 * 2048 游戏UI和动画模块
 * 处理DOM操作、动画效果和视觉反馈
 */
class GameUI {
    constructor() {
        this.tileContainer = document.querySelector('.tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessage = document.querySelector('.game-message');
        this.size = 4;
    }

    updateDisplay(grid, newTiles = [], mergedTiles = []) {
        this.clearTiles();
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = grid[row][col];
                if (value !== 0) {
                    const isNew = newTiles.some(tile => tile.row === row && tile.col === col);
                    const isMerged = mergedTiles.some(tile => tile.row === row && tile.col === col);
                    this.createTile(value, row, col, isNew, isMerged);
                }
            }
        }
    }

    updateScore(score, bestScore) {
        this.scoreElement.textContent = score;
        this.bestScoreElement.textContent = bestScore;
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

    animateMovement(oldGrid, newGrid, direction, callback) {
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
                            const newValueAtPos = newGrid[row][col];
                            if (newValueAtPos === 0) {
                                tilesToRemove.push(tile);
                            }
                        }
                    }
                }
            }
        }
        
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

    findNewPositionWithTracking(oldGrid, newGrid, oldRow, oldCol, oldValue, direction, usedPositions) {
        // 首先检查原位置的值
        const newValueAtOldPos = newGrid[oldRow][oldCol];
        
        // 如果原位置的值没有变化，说明这个方块没有移动也没有被合并
        if (newValueAtOldPos === oldValue) {
            return null; // 不需要动画
        }
        
        // 使用逐步搜索的方法，沿着移动方向查找最近的合理位置
        const searchPositions = this.getSearchPath(oldRow, oldCol, direction);
        
        // 先查找相同值的位置（普通移动）
        for (const pos of searchPositions) {
            const posKey = `${pos.row}-${pos.col}`;
            if (!usedPositions.has(posKey) && newGrid[pos.row][pos.col] === oldValue) {
                // 确保这个位置在原grid中确实发生了变化（不是原本就存在的值）
                if (oldGrid[pos.row][pos.col] !== oldValue) {
                    return {row: pos.row, col: pos.col, value: oldValue};
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
                    return {row: pos.row, col: pos.col, value: mergedValue};
                }
            }
        }
        
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

    findTileByOldPosition(tiles, row, col, value) {
        return tiles.find(tile => 
            parseInt(tile.dataset.row) === row && 
            parseInt(tile.dataset.col) === col && 
            parseInt(tile.dataset.value) === value
        );
    }

    animateColorChange(tile, oldValue, newValue) {
        // 更新数值
        tile.textContent = newValue;
        tile.dataset.value = newValue;
        tile.className = `tile tile-${newValue}`;
        
        // 设置渐变动画
        tile.style.transition = 'background-color 300ms ease-out, color 300ms ease-out, transform 150ms ease-out';
        
        // 添加轻微的缩放效果表示合并
        tile.style.transform = tile.style.transform + ' scale(1.1)';
        setTimeout(() => {
            tile.style.transform = tile.style.transform.replace(' scale(1.1)', '');
        }, 150);
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
}