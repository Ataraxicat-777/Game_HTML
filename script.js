// --- Game Data (abbreviated for brevity) ---
const oldSchoolGames = [
{ title:"Pixel Pioneers", era:"1982", desc:"Navigate mysterious dungeons in classic blocky style." },
// ... rest of the games (omitted here for brevity)
];
// The rest of your games go here; only Pixel Pioneers will get a Play button.

// The newSchoolGames array goes here...

// --- Main Render ---
function renderGames(games, gridElem, isOldSchool, noResElem) {
gridElem.innerHTML = "";
if (games.length === 0) { noResElem.style.display = ''; return; }
else { noResElem.style.display = 'none'; }
games.forEach((game, idx) => {
const card = document.createElement("div");
card.className = `game-card ${isOldSchool ? "old-school" : "new-school"}`;
card.tabIndex = 0;
card.setAttribute('aria-label', `${game.title}, ${game.era}, press Enter or Info for description`);
card.innerHTML = `
<div class="game-title">${game.title}</div>
<div class="game-era">${game.era}</div>
<div class="game-desc" id="desc-${isOldSchool?'o':'n'}-${idx}">${game.desc}</div>
<button class="game-btn" tabindex="0" aria-expanded="false" aria-controls="desc-${isOldSchool?'o':'n'}-${idx}">Info</button>
`;
if (game.title === "Pixel Pioneers") {
const playBtn = document.createElement("button");
playBtn.className = "play-btn";
playBtn.innerText = "Play";
playBtn.title = "Play Pixel Pioneers";
playBtn.onclick = e => { e.stopPropagation(); openPixelGame(); };
card.appendChild(playBtn);
}
const infoBtn = card.querySelector('.game-btn');
function toggleDesc() {
const expanded = card.classList.toggle("active");
infoBtn.setAttribute('aria-expanded', expanded ? "true" : "false");
if (expanded) closeOtherCards(card);
}
infoBtn.onclick = e => { e.stopPropagation(); toggleDesc(); };
infoBtn.onkeydown = e => { if (e.key==="Enter"||e.key===" ") {e.preventDefault(); toggleDesc();}};
card.onclick = (evt) => { if (!evt.target.classList.contains("game-btn")) toggleDesc(); };
card.onkeydown = e => {
if ((e.key==="Enter"||e.key===" ") && !e.target.classList.contains("game-btn")) {
e.preventDefault(); toggleDesc();
}
if (e.key === "Escape") {
card.classList.remove("active");
infoBtn.setAttribute('aria-expanded', "false");
}
};
gridElem.appendChild(card);
});
}
const oldGrid = document.getElementById("oldSchoolGrid");
const newGrid = document.getElementById("newSchoolGrid");
const oldNoRes = document.getElementById("oldNoResults");
const newNoRes = document.getElementById("newNoResults");
function renderAllFiltered(searchVal) {
const oFiltered = oldSchoolGames.filter(g =>
g.title.toLowerCase().includes(searchVal) || g.era.toLowerCase().includes(searchVal)
);
const nFiltered = (typeof newSchoolGames !== "undefined" ? newSchoolGames : []).filter(g =>
g.title.toLowerCase().includes(searchVal) || g.era.toLowerCase().includes(searchVal)
);
renderGames(oFiltered, oldGrid, true, oldNoRes);
renderGames(nFiltered, newGrid, false, newNoRes);
}
renderAllFiltered('');
// Debounced search input
function debounce(fn, ms) { let timer; return function(...args) { clearTimeout(timer); timer = setTimeout(()=>fn.apply(this,args), ms); } }
document.getElementById('gameSearch').addEventListener('input', debounce(e => {
renderAllFiltered(e.target.value.toLowerCase());
}, 100));
// Utility
function closeOtherCards(except) {
document.querySelectorAll('.game-card.active').forEach(card => { if (card !== except) card.classList.remove('active'); });
}
document.body.addEventListener('click', (evt) => { if (!evt.target.closest('.game-card')) closeOtherCards(); });
document.querySelectorAll('.game-grid').forEach(grid=>{ grid.addEventListener('click', e=>e.stopPropagation()); });
document.addEventListener('keydown', e => { if (e.key === "Escape") closeOtherCards(); });

// --- PIXEL PIONEERS MAZE GAME ---
const modalBg = document.getElementById('modalBg');
const closeModalBtn = document.getElementById('closeModal');
const pixelStatus = document.getElementById('pixelStatus');
const restartBtn = document.getElementById('restartGame');
const pixelCanvas = document.getElementById('pixelCanvas');
let gameActive = false, animationId = null;

function openPixelGame() {
modalBg.classList.add('active');
gameActive = true;
document.body.style.overflow = "hidden";
startMazeGame();
setTimeout(()=>pixelCanvas.focus(), 300); // Focus canvas for keys
}
function closePixelGame() {
modalBg.classList.remove('active');
gameActive = false;
document.body.style.overflow = "";
cancelAnimationFrame(animationId);
pixelStatus.innerHTML = "";
}
closeModalBtn.onclick = closePixelGame;
modalBg.addEventListener('click', function(e){
if (e.target === modalBg) closePixelGame();
});
document.addEventListener('keydown', function(e){
if (!gameActive) return;
if (e.key === "Escape") closePixelGame();
});
restartBtn.onclick = function(e){
e.stopPropagation(); startMazeGame();
setTimeout(()=>pixelCanvas.focus(), 200);
};

// MAZE GAME LOGIC
// -- Maze Grid: 0=empty, 1=wall, 2=player, 3=exit
const MAZE_W = 13, MAZE_H = 13;
const CELL = 28, PADDING = 18;
let maze = [], px = 0, py = 0, ex = 0, ey = 0;
let moveDir = {x:0, y:0}, moveQueue = [];
let playerPos = {x:0, y:0}, playerScreen = {x:0, y:0};
let moving = false, win = false, moveSpeed = 5; // px per frame (hyper smooth)
function randomMaze(w,h) {
// Simple DFS maze gen, always solvable, center start, corner exit
let g = Array.from({length:h},()=>Array(w).fill(1));
let stack = [[1,1]]; g[1][1]=0;
let dx=[0,1,0,-1], dy=[-1,0,1,0];
while (stack.length) {
let [x,y]=stack[stack.length-1], dirs=[0,1,2,3].sort(()=>Math.random()-0.5), carved=false;
for (let d of dirs) {
let nx=x+dx[d]*2, ny=y+dy[d]*2;
if(ny>0&&ny<h-1&&nx>0&&nx<w-1&&g[ny][nx]===1){
g[y+dy[d]][x+dx[d]]=0;g[ny][nx]=0;stack.push([nx,ny]);carved=true;break;
}
}
if(!carved)stack.pop();
}
g[1][1]=2; g[h-2][w-2]=3; // Player start, exit
return g;
}
function startMazeGame() {
maze = randomMaze(MAZE_W,MAZE_H);
for (let y=0;y<MAZE_H;y++) for(let x=0;x<MAZE_W;x++){
if (maze[y][x]==2) { px=x; py=y; }
if (maze[y][x]==3) { ex=x; ey=y; }
}
playerPos = {x:px, y:py}; playerScreen = {x:px*CELL, y:py*CELL};
moving = false; win = false; moveDir={x:0,y:0}; moveQueue=[];
pixelStatus.textContent = '';
runGameLoop();
}
// --- Input handling ---
pixelCanvas.tabIndex = 0;
pixelCanvas.addEventListener('keydown', function(e){
if (!gameActive || win) return;
let dir = null;
if (["ArrowUp","w","W"].includes(e.key)) dir = {x:0,y:-1};
if (["ArrowDown","s","S"].includes(e.key)) dir = {x:0,y:1};
if (["ArrowLeft","a","A"].includes(e.key)) dir = {x:-1,y:0};
if (["ArrowRight","d","D"].includes(e.key)) dir = {x:1,y:0};
if (dir) {
e.preventDefault();
// Queue next move if not moving
if (!moving) attemptMove(dir);
else moveQueue.push(dir);
}
});
function attemptMove(dir) {
let nx = playerPos.x + dir.x, ny = playerPos.y + dir.y;
if (maze[ny] && maze[ny][nx]!==1) {
moveDir = dir; moving = true;
}
}
// -- Main game loop for smooth movement --
function runGameLoop() {
animationId = requestAnimationFrame(runGameLoop);
const ctx = pixelCanvas.getContext('2d');
// Draw BG
ctx.clearRect(0,0,pixelCanvas.width,pixelCanvas.height);
// Draw maze
for (let y=0;y<MAZE_H;y++) for(let x=0;x<MAZE_W;x++){
let cx = x*CELL+PADDING, cy = y*CELL+PADDING;
if (maze[y][x]===1) { // Wall
ctx.fillStyle="#232345"; ctx.fillRect(cx,cy,CELL,CELL);
ctx.strokeStyle="#46ecfd"; ctx.lineWidth=2;
ctx.strokeRect(cx+2,cy+2,CELL-4,CELL-4);
}
else if (maze[y][x]===3) { // Exit
ctx.fillStyle="#fd4674";
ctx.fillRect(cx+6,cy+6,CELL-12,CELL-12);
ctx.strokeStyle="#fff"; ctx.lineWidth=2;
ctx.strokeRect(cx+6,cy+6,CELL-12,CELL-12);
}
}
// Move player if needed
if (moving) {
playerScreen.x += moveDir.x*moveSpeed;
playerScreen.y += moveDir.y*moveSpeed;
// Check if arrived
let dx = playerScreen.x - playerPos.x*CELL, dy = playerScreen.y - playerPos.y*CELL;
if (Math.abs(dx)>CELL||Math.abs(dy)>CELL) { // Should not happen (speed too high)
playerScreen.x = (playerPos.x+moveDir.x)*CELL;
playerScreen.y = (playerPos.y+moveDir.y)*CELL;
}
if (Math.abs(playerScreen.x - (playerPos.x+moveDir.x)*CELL) < moveSpeed &&
Math.abs(playerScreen.y - (playerPos.y+moveDir.y)*CELL) < moveSpeed) {
// Snap to target
playerPos.x += moveDir.x; playerPos.y += moveDir.y;
playerScreen.x = playerPos.x*CELL; playerScreen.y = playerPos.y*CELL;
moving = false;
// Check win
if (maze[playerPos.y][playerPos.x]===3) {
win = true; pixelStatus.textContent = "🏆 You Escaped the Dungeon! 🏆";
}
// Queue next
if (moveQueue.length) {
let dir = moveQueue.shift();
attemptMove(dir);
}
}
}
// Draw player (glow effect)
ctx.save();
let px = playerScreen.x+PADDING, py = playerScreen.y+PADDING;
for (let r=18;r>0;r-=4) {
ctx.globalAlpha = 0.11 + 0.11*(r/18);
ctx.beginPath(); ctx.arc(px+CELL/2,py+CELL/2,r,0,2*Math.PI); ctx.fillStyle="#00fff0"; ctx.fill();
}
ctx.globalAlpha = 1.0;
ctx.fillStyle="#46ecfd";
ctx.fillRect(px+6,py+6,CELL-12,CELL-12);
ctx.strokeStyle="#fff"; ctx.lineWidth=2;
ctx.strokeRect(px+6,py+6,CELL-12,CELL-12);
ctx.restore();
}
