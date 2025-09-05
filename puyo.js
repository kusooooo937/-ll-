const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const nextEl = document.getElementById("next");

const COLS = 6;
const ROWS = 12;
const BLOCK_SIZE = 20;
const colors = [null, "red", "green", "blue", "yellow"];

let board = Array.from({length: ROWS},()=>Array(COLS).fill(0));
let score = 0;

// 現在の落下ぷよ
let current = { pair:[randomColor(),randomColor()], x:2, y:0, orientation:0 };
let nextPair = [randomColor(), randomColor()];

function randomColor(){ return Math.floor(Math.random()*(colors.length-1))+1; }

function drawBlock(x,y,color){
  ctx.fillStyle = color;
  ctx.fillRect(x*BLOCK_SIZE,y*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
  ctx.strokeStyle="#111";
  ctx.strokeRect(x*BLOCK_SIZE,y*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
}

function drawBoard(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(board[y][x]) drawBlock(x,y,colors[board[y][x]]);
    }
  }
  const coords = getCurrentCoords();
  coords.forEach((p,i)=>drawBlock(p.x,p.y,colors[current.pair[i]]));
  drawNext();
}

function getCurrentCoords(){
  let coords=[{x:current.x,y:current.y}];
  switch(current.orientation){
    case 0: coords.push({x:current.x,y:current.y+1}); break;
    case 1: coords.push({x:current.x+1,y:current.y}); break;
    case 2: coords.push({x:current.x,y:current.y-1}); break;
    case 3: coords.push({x:current.x-1,y:current.y}); break;
  }
  return coords;
}

function collide(dx=0,dy=0,ori=current.orientation){
  const temp={x:current.x+dx,y:current.y+dy,orientation:ori};
  const coords=[{x:temp.x,y:temp.y}];
  switch(temp.orientation){
    case 0: coords.push({x:temp.x,y:temp.y+1}); break;
    case 1: coords.push({x:temp.x+1,y:temp.y}); break;
    case 2: coords.push({x:temp.x,y:temp.y-1}); break;
    case 3: coords.push({x:temp.x-1,y:temp.y}); break;
  }
  return coords.some(p=>p.x<0||p.x>=COLS||p.y<0||p.y>=ROWS||board[p.y][p.x]!==0);
}

function move(dx,dy){ if(!collide(dx,dy)){current.x+=dx;current.y+=dy;drawBoard();} }
function rotate(){ const newOri=(current.orientation+1)%4; if(!collide(0,0,newOri)) current.orientation=newOri; drawBoard(); }

function drop(){
  if(!collide(0,1)){ current.y++; }
  else{ freeze(); clearChains(); spawnNew(); if(collide()){ alert("ゲームオーバー"); board=Array.from({length:ROWS},()=>Array(COLS).fill(0)); score=0; updateScore(); } }
  drawBoard();
}

function freeze(){
  const coords=getCurrentCoords();
  coords.forEach((p,i)=>board[p.y][p.x]=current.pair[i]);
}

function spawnNew(){
  current={pair:nextPair.slice(), x:2, y:0, orientation:0};
  nextPair=[randomColor(),randomColor()];
  drawNext();
}

function clearChains(){
  let visited=Array.from({length:ROWS},()=>Array(COLS).fill(false));
  let chains=[];
  function dfs(x,y,color,cells){
    if(x<0||x>=COLS||y<0||y>=ROWS) return;
    if(visited[y][x]||board[y][x]!==color) return;
    visited[y][x]=true;
    cells.push({x,y});
    dfs(x+1,y,color,cells); dfs(x-1,y,color,cells); dfs(x,y+1,color,cells); dfs(x,y-1,color,cells);
  }
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(board[y][x]&&!visited[y][x]){
        let cells=[]; dfs(x,y,board[y][x],cells);
        if(cells.length>=4) chains.push(cells);
      }
    }
  }
  if(chains.length>0){
    chains.forEach(cells=>cells.forEach(p=>board[p.y][p.x]=0));
    score+=chains.reduce((acc,c)=>acc+c.length*10,0);
    updateScore();
    gravity();
    setTimeout(clearChains,100); // 連鎖対応
  }
}

function gravity(){
  for(let x=0;x<COLS;x++){
    for(let y=ROWS-2;y>=0;y--){
      if(board[y][x]&&board[y+1][x]===0){
        let ny=y;
        while(ny+1<ROWS&&board[ny+1][x]===0){ board[ny+1][x]=board[ny][x]; board[ny][x]=0; ny++; }
      }
    }
  }
}

function updateScore(){ scoreEl.textContent=score; }

function drawNext(){
  nextEl.innerHTML = '次のぷよ: ';
  nextPair.forEach(c=>{
    const div = document.createElement('span');
    div.style.display='inline-block';
    div.style.width='20px';
    div.style.height='20px';
    div.style.backgroundColor=colors[c];
    div.style.margin='2px';
    nextEl.appendChild(div);
  });
}

// キー操作
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") {
    move(-1, 0); // 左移動
  } else if (e.key === "ArrowRight") {
    move(1, 0);  // 右移動
  } else if (e.key === "ArrowDown") {
    move(0, 1);  // 下に移動
  } else if (e.key === "Enter") {
    // Enterキーの動作（例: 即落下など）
    drop();
  } else if (e.key === "Shift") {
    rotate();    // 回転
  }
});

// 自動落下
setInterval(drop,500);
drawBoard();

