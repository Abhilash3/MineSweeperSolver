let grid;
let cols;
let rows;
let ai;

const w = 20;
const t = 100;

function setup() {
    createCanvas(501, 501);
    cols = floor(width / w);
    rows = floor(height / w);

    grid = new Grid(cols, rows, w, t);
    ai = new AI(grid);
}

function mousePressed() {
    grid.trigger(grid.identifyCell(mouseX, mouseY));
}

function draw() {
    background(255);

    if (!grid.gameover) {
        ai.nextMove();
    }
    
    grid.show();
}