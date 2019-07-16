class AI {
  constructor(grid) {
		this.grid = grid;
		
		this.cols = grid.cols;
		this.rows = grid.rows;
		
		this.tryCorner();
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
	
	tryGuessing() {
		const cells = this.grid.cellsHidden().filter(a => !a.flagged);
		if (!cells.length) return;

		this.grid.trigger(cells[floor(random(cells.length))]);
		return true;
	}
	
	tryFlagging() {
		this.grid.iterateGrid(cell => {
			const bombCounter = this.grid.bombCounter(cell);
			if (bombCounter === 0) return;

			const hiddenCells = cell.hiddenNeighbours(this.grid);

			if (hiddenCells.length === bombCounter) {
				hiddenCells.forEach(a => a.flagged = true);
			}
		});
		
		let useful = false;
		this.grid.iterateGrid(cell => {
			const bombCounter = this.grid.bombCounter(cell);
			if (useful || bombCounter === 0) return;

			const hiddenCells = cell.hiddenNeighbours(this.grid);
			const flaggedCells = hiddenCells.filter(a => a.flagged);

			if (hiddenCells.length - flaggedCells.length > 0 && flaggedCells.length === bombCounter) {
				useful = true;
				this.grid.trigger(hiddenCells.filter(a => !a.flagged)[0]);
			}
		});
		
		return useful;
	}
	
	tryOverlapping() {
		const cells = this.grid.cellsNearBombs();
		if (cells.length <= 1) return false;
		
		const bombCounter = (cell, neighbours) => this.grid.bombCounter(cell) - neighbours.filter(a => a.flagged).length;
		
		return cells.some(a => {
			const aNeighbours = a.hiddenNeighbours(this.grid);
			const aTargets = aNeighbours.filter(cell => !cell.flagged);
			if (aTargets.length === 0) return false;
			
			const aTargetSet = new Set(aTargets.map(cell => `${cell.i} - ${cell.j}`));
			
			return cells.filter(b => b.isNeighbour(a)).some(b => {
				const bNeighbours = b.hiddenNeighbours(this.grid);
				const bTargets = bNeighbours.filter(cell => !cell.flagged);
				if (bTargets.length === 0) return false;
				
				let useful = false;
				
				const bTargetSet = new Set(bTargets.map(cell => `${cell.i} - ${cell.j}`));
				const targets = aTargets.filter(cell => !bTargetSet.has(`${cell.i} - ${cell.j}`));
				
				const isSubset = bTargets.every(cell => aTargetSet.has(`${cell.i} - ${cell.j}`));
				const isSafe = bombCounter(a, aNeighbours) === bombCounter(b, bNeighbours);
				
				if (targets.length > 0 && isSubset && isSafe) {
					useful = true;
					this.grid.trigger(targets[0]);
				}
				return useful;
			});
		});
	}
	
	nextMove() {
		return this.tryFlagging() || this.tryOverlapping() || this.tryCorner() || this.tryGuessing();
	}
}