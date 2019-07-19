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
        this.grid.iterateGrid(cell => {
            const bombCounter = cell.bombCounter();
            if (bombCounter === 0) return;

            const hiddenCells = cell.hiddenNeighbours(this.grid);

            if (hiddenCells.length === bombCounter) {
                hiddenCells.forEach(a => a.flagged = true);
            }
        });

        let useful = false;
        this.grid.iterateGrid(cell => {
            const bombCounter = cell.bombCounter();
            if (bombCounter === 0) return;

            const hiddenCells = cell.hiddenNeighbours(this.grid);
            const flaggedCells = hiddenCells.filter(a => a.flagged);
            const safeCells = hiddenCells.filter(a => !a.flagged);

            if (safeCells.length > 0 && flaggedCells.length === bombCounter) {
                useful = true;
                safeCells.forEach(cell => this.grid.trigger(cell));
            }
        });

        return useful;
    }

    checkOverlappingRanges() {
        const cells = this.grid.cellsNearBombs();
        if (cells.length <= 1) return false;

        const bombCounter = (cell, neighbours) => cell.bombCounter() - neighbours.filter(a => a.flagged).length;
        const areAdjacent = (a, b) => !(a.i === b.i && a.j === b.j) && abs(a.i - b.i) < 2 && abs(a.j - b.j) < 2;

        let useful = false;
        cells.forEach(a => {
            const aNeighbours = a.hiddenNeighbours(this.grid);
            const aTargets = aNeighbours.filter(cell => !cell.flagged);
            if (aTargets.length === 0) return;

            const aTargetSet = new Set(aTargets.map(cell => `${cell.i} - ${cell.j}`));

            cells.filter(b => areAdjacent(a, b)).forEach(b => {
                const bNeighbours = b.hiddenNeighbours(this.grid);
                const bTargets = bNeighbours.filter(cell => !cell.flagged);
                if (bTargets.length === 0) return;

                const bTargetSet = new Set(bTargets.map(cell => `${cell.i} - ${cell.j}`));
                const targets = aTargets.filter(cell => !bTargetSet.has(`${cell.i} - ${cell.j}`));

                const isSubset = bTargets.every(cell => aTargetSet.has(`${cell.i} - ${cell.j}`));
                const isSafe = bombCounter(a, aNeighbours) === bombCounter(b, bNeighbours);

                if (targets.length > 0 && isSubset && isSafe) {
                    useful = true;
                    targets.forEach(cell => this.grid.trigger(cell));
                }
            });
        });

        return useful;
    }

    nextMove() {
        return this.checkCellRanges() || this.checkOverlappingRanges() || this.tryCorner() || this.tryEdge() || this.tryGuessing();
    }
}