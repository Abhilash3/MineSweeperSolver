const Grid = (function() {
    const NEIGHBOURS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    const cellInfo = new WeakMap();

    const hasBomb = (cell) => cellInfo.get(cell).bomb;

    const bombCounter = (cell) => cellInfo.get(cell).bombCounter;

    const setBombCounter = (cell, count) => cellInfo.get(cell).bombCounter = count;

    function countBombs(grid) {
        grid.iterate(cell => {
            if (hasBomb(cell)) {
                setBombCounter(cell, -1);
            } else {
                const count = NEIGHBOURS
                    .map(([x, y]) => [cell.i + x, cell.j + y])
                    .filter(([x, y]) => grid.isValid(x, y) && hasBomb(grid.cell(x, y)))
                    .length;

                setBombCounter(cell, count);
            }
        });
    }

    function floodFill(cell, grid) {
        return NEIGHBOURS
            .map(([x, y]) => [cell.i + x, cell.j + y])
            .filter(([x, y]) => grid.isValid(x, y) && !grid.cell(x, y).revealed)
            .forEach(([x, y]) => reveal(grid.cell(x, y), grid));
    }

    function reveal(cell, grid) {
        cell.revealed = true;
        if (bombCounter(cell) === 0) {
            floodFill(cell, grid);
        }
    }

    function enableBomb(cell) {
        const info = cellInfo.get(cell);
        if (info.bomb) return false;

        return info.bomb = true;
    }

    function trigger(cell, grid) {
        if (hasBomb(cell)) {
            cell.triggered = true;
            return false;
        } else {
            reveal(cell, grid);
            return true;
        }
    }

    function showBombs(grid) {
        grid.iterate(cell => cell.revealed = true, hasBomb);
    }

    class Cell {
        constructor (i, j, w) {
            this.i = i;
            this.j = j;
            this.x = i * w;
            this.y = j * w;
            this.w = w;

            this.flagged = false;
            this.revealed = false;
            this.triggered = false;

            cellInfo.set(this, {bombCounter: 0, bomb: false});
        }

        show() {
            stroke(0);
            noFill();
            rect(this.x, this.y, this.w, this.w);
            if (this.revealed) {
                if (hasBomb(this) && !this.triggered) {
                    fill(127);
                    ellipse(this.x + this.w * 0.5, this.y + this.w * 0.5, this.w * 0.5);
                } else if (this.triggered) {
                    fill(255, 0, 0);
                    ellipse(this.x + this.w * 0.5, this.y + this.w * 0.5, this.w * 0.5);
                } else {
                    fill(200);
                    rect(this.x, this.y, this.w, this.w);
                    if (bombCounter(this) > 0) {
                        textAlign(CENTER);
                        fill(0);
                        text(bombCounter(this), this.x + this.w * 0.5, this.y + this.w - 6);
                    }
                }
            } else if (this.flagged) {
                fill(255, 255, 0);
                rect(this.x, this.y, this.w, this.w);

                fill(0);
                textAlign(CENTER);
                text('F', this.x + this.w * 0.5, this.y + this.w - 6);
            }
        }

        bombCounter() {
            return this.revealed ? bombCounter(this) : 0;
        }

        hiddenNeighbours(grid) {
            return NEIGHBOURS
                    .map(([x, y]) => [this.i + x, this.j + y])
                    .filter(([x, y]) => grid.isValid(x, y) && !grid.cell(x, y).revealed)
                    .map(([x, y]) => grid.cell(x, y));
        }

        contains(x, y) {
            return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.w;
        }
    }

    class Grid {
        constructor(cols, rows, w, t) {
            this.cols = cols;
            this.rows = rows;
            this.totalBombs = t;

            this.grid = new Array(cols).fill(0).map((a, i) => new Array(rows).fill(0).map((b, j) => new Cell(j, i, w)));

            let bombs = 0;
            while (bombs < this.totalBombs) {
                const index = floor(random(cols * rows));
                const cell = this.grid[floor(index / cols)][floor(index % cols)];

                bombs += Number(enableBomb(cell));
            }
            this.gameover = false;

            countBombs(this);
        }

        identifyCell(x, y) {
            return this.grid.reduce((acc, a) => [...acc, ...a], []).find(cell => cell.contains(x, y));
        }

        trigger(cell) {
            if (!cell || this.gameover) return;

            this.gameover = !trigger(cell, this) || this.cellsHidden().length === this.totalBombs;
            if (this.gameover) showBombs(this);
        }

        cellsHidden() {
            return this.grid.reduce((acc, a) => [...acc, ...a], []).filter(a => !a.revealed);
        }

        isValid(x, y) {
            return x >= 0 && x < this.rows && y >= 0 && y < this.cols;
        }

        cell(x, y) {
            return this.grid[y] && this.grid[y][x];
        }

        show() {
            this.iterate(cell => cell.show());
        }

        iterate(consumer, cellFilter = a => a) {
            this.grid.forEach(row => row.filter(cellFilter).forEach(consumer));
        }
    }

    return Grid;
})();