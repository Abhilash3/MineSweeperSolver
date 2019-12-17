const AI = (function() {
    const isActive = cell => cell.bombCounter() > 0;

    class AI {
      constructor(grid) {
            this.grid = grid;

            this.cols = grid.cols;
            this.rows = grid.rows;
        }

        tryCorner() {
          const corners = [
                [0, 0], [0, this.cols - 1], [this.rows - 1, 0], [this.rows - 1, this.cols - 1]
            ]
                .map(([x, y]) => this.grid.cell(x, y))
                .filter(a => !a.revealed && !a.flagged);

            if (!corners.length) return false;

            this.grid.trigger(corners[floor(random(corners.length))]);
            return true;
        }

        tryEdge() {
            const cells = this.grid.cellsHidden()
                .filter(a => a.i === 0 || a.j === 0 || a.i === this.rows - 1 || a.j === this.cols - 1)
                .filter(a => !a.flagged);
            if (!cells.length) return false;

            this.grid.trigger(cells[floor(random(cells.length))]);
            return true;
        }

        tryGuessing() {
            const cells = this.grid.cellsHidden().filter(a => !a.flagged);
            if (!cells.length) return;

            this.grid.trigger(cells[floor(random(cells.length))]);
            return true;
        }

        checkCellRanges() {
            this.grid.iterate(cell => {
                const hiddenCells = cell.hiddenNeighbours(this.grid);

                if (hiddenCells.length === cell.bombCounter()) {
                    hiddenCells.forEach(a => a.flagged = true);
                }
            }, isActive);

            let pending = true;
            this.grid.iterate(cell => {
                const hiddenCells = cell.hiddenNeighbours(this.grid);
                const flaggedCells = hiddenCells.filter(a => a.flagged);
                const safeCells = hiddenCells.filter(a => !a.flagged);

                if (safeCells.length > 0 && flaggedCells.length === cell.bombCounter()) {
                    pending = false;
                    this.grid.trigger(safeCells[0]);
                }
            }, (cell) => pending && isActive(cell));

            return !pending;
        }

        checkOverlappingRanges() {
            const bombCounter = (cell, neighbours) => cell.bombCounter() - neighbours.filter(a => a.flagged).length;
            const areAdjacent = (a, b) => !(a.i === b.i && a.j === b.j) && abs(a.i - b.i) < 2 && abs(a.j - b.j) < 2;
            const cellIdentifier = cell => `${cell.i}-${cell.j}`;

            let pending = true;
            this.grid.iterate(a => {
                const aNeighbours = a.hiddenNeighbours(this.grid);
                const aTargets = aNeighbours.filter(cell => !cell.flagged);
                if (aTargets.length === 0) return;

                const aTargetSet = new Set(aTargets.map(cellIdentifier));

                this.grid.iterate(b => {
                    const bNeighbours = b.hiddenNeighbours(this.grid);
                    const bTargets = bNeighbours.filter(cell => !cell.flagged);
                    if (bTargets.length === 0) return;

                    const bTargetSet = new Set(bTargets.map(cellIdentifier));
                    const targets = aTargets.filter(cell => !bTargetSet.has(cellIdentifier(cell)));

                    const isSubset = bTargets.every(cell => aTargetSet.has(cellIdentifier(cell)));
                    const isSafe = bombCounter(a, aNeighbours) === bombCounter(b, bNeighbours);

                    if (targets.length > 0 && isSubset && isSafe) {
                        pending = false;
                        this.grid.trigger(targets[0]);
                    }
                }, cell => pending && isActive(cell) && areAdjacent(a, cell));
            }, (cell) => pending && isActive(cell));

            return !pending;
        }

        nextMove() {
            return this.checkCellRanges() || this.checkOverlappingRanges() || this.tryCorner() || this.tryEdge() || this.tryGuessing();
        }
    }

    return AI;
})();