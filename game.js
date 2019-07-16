let grid;
let cols;
let rows;
let ai;

const w = 20;

function setup() {
  createCanvas(501, 501);
  cols = floor(width / w);
  rows = floor(height / w);
	
  grid = new Grid(cols, rows, w);
	
	grid.countBombs();
}

function mousePressed() {
	grid.trigger(grid.identifyCell(mouseX, mouseY));
}

function draw() {
	background(255);
	
	if (!grid.gameover) {
		if (!ai) {
			ai = new AI(grid);
		} else {
			ai.nextMove();
		}
	}
	
	grid.show();
}