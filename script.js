// ================= SLIDING PUZZLE =================

let PUZZLE_SIZE = 3;
const PUZZLE_PIXELS = 360;
let TILE_SIZE = PUZZLE_PIXELS / PUZZLE_SIZE;

const puzzleEl = document.getElementById('puzzle');
const newGameBtn = document.getElementById('newGameBtn');
const showSolutionBtn = document.getElementById('showSolutionBtn');
const solutionImg = document.getElementById('solutionImg');
const movesEl = document.getElementById('moves');

let tiles = [];
let blankTile = null;
let moves = 0;

// modal & timer state
let startTime = null;
const congratsModal = document.getElementById('congratsModal');
const congratsTimeEl = document.getElementById('congratsTime');
const replayBtn = document.getElementById('replayBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
let lastSolved = null;

const imgCandidates = ['cat.jpg','cat.jpeg'];
let imgUrl = imgCandidates[0];

function setPuzzleSize(n){
  PUZZLE_SIZE = n;
  TILE_SIZE = PUZZLE_PIXELS / PUZZLE_SIZE;
}

// ---------- CREATE TILES ----------
function createTiles(){

  puzzleEl.replaceChildren();   // SAFE CLEAR
  tiles = [];
  moves = 0;
  if(movesEl) movesEl.textContent = 0;

  puzzleEl.style.width = PUZZLE_PIXELS + 'px';
  puzzleEl.style.height = PUZZLE_PIXELS + 'px';

  let id = 0;

  for(let row=0; row<PUZZLE_SIZE; row++){
    for(let col=0; col<PUZZLE_SIZE; col++){

      id++;

      const el = document.createElement('div');
      el.className = 'tile';

      el.style.width = TILE_SIZE+'px';
      el.style.height = TILE_SIZE+'px';

      if(row === PUZZLE_SIZE-1 && col === PUZZLE_SIZE-1){
        el.classList.add('blank');
      } else {
        el.style.backgroundImage = `url(${imgUrl})`;
        el.style.backgroundSize = `${PUZZLE_PIXELS}px ${PUZZLE_PIXELS}px`;

        const px = (col/(PUZZLE_SIZE-1||1))*100;
        const py = (row/(PUZZLE_SIZE-1||1))*100;
        el.style.backgroundPosition = `${px}% ${py}%`;
      }

      const tileObj = {id,row,col,el};
      if(el.classList.contains('blank')) blankTile = tileObj;

      el.style.transform = `translate(${col*TILE_SIZE}px, ${row*TILE_SIZE}px)`;

      el.addEventListener('click', tileClick);

      puzzleEl.appendChild(el);
      tiles.push(tileObj);
    }
  }
}

// ---------- TILE CLICK ----------
function tileClick(e){

  const tileObj = tiles.find(t => t.el === e.currentTarget);
  if(tileObj === blankTile) return;

  const dr = Math.abs(tileObj.row - blankTile.row);
  const dc = Math.abs(tileObj.col - blankTile.col);

  if(dr+dc !== 1) return; // must be adjacent

  // swap
  const tr = tileObj.row;
  const tc = tileObj.col;

  tileObj.row = blankTile.row;
  tileObj.col = blankTile.col;

  blankTile.row = tr;
  blankTile.col = tc;

  tileObj.el.style.transform = `translate(${tileObj.col*TILE_SIZE}px, ${tileObj.row*TILE_SIZE}px)`;
  blankTile.el.style.transform = `translate(${blankTile.col*TILE_SIZE}px, ${blankTile.row*TILE_SIZE}px)`;

  moves++;
  if(movesEl) movesEl.textContent = moves;
  // check for solved state
  if(checkSolved()){
    lastSolved = 'main';
    showCongrats('main');
  }
}

// ---------- SOLVABLE SHUFFLE ----------
function shuffleAll(steps = 7){

  let lastMoved = null;

  for(let i = 0; i < steps; i++){

    // find tiles adjacent to blank
    let neighbors = tiles.filter(t =>
      Math.abs(t.row - blankTile.row) + Math.abs(t.col - blankTile.col) === 1
    );

    // prevent immediate undo move
    if(lastMoved){
      neighbors = neighbors.filter(t => t !== lastMoved);
      if(neighbors.length === 0) neighbors = [lastMoved];
    }

    // pick random neighbor
    const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];

    // swap chosen tile with blank
    const tempRow = chosen.row;
    const tempCol = chosen.col;

    chosen.row = blankTile.row;
    chosen.col = blankTile.col;

    blankTile.row = tempRow;
    blankTile.col = tempCol;

    // move visually
    chosen.el.style.transform =
      `translate(${chosen.col*TILE_SIZE}px, ${chosen.row*TILE_SIZE}px)`;

    blankTile.el.style.transform =
      `translate(${blankTile.col*TILE_SIZE}px, ${blankTile.row*TILE_SIZE}px)`;

    lastMoved = chosen;
  }

  moves = 0;
  if(movesEl) movesEl.textContent = 0;
  // start timer for this run
  startTime = Date.now();
}

// ---------- SOLVE ----------
function solve(){
  tiles.sort((a,b)=>a.id-b.id);

  let idx=0;
  for(let r=0;r<PUZZLE_SIZE;r++){
    for(let c=0;c<PUZZLE_SIZE;c++){
      const t = tiles[idx++];
      t.row=r;
      t.col=c;
      t.el.style.transform=`translate(${c*TILE_SIZE}px,${r*TILE_SIZE}px)`;
      if(t.el.classList.contains('blank')) blankTile=t;
    }
  }

  moves=0;
  if(movesEl) movesEl.textContent=0;
}

// ---------- BUTTONS ----------
newGameBtn.addEventListener('click', ()=>{
  createTiles();
  shuffleAll(6);
});

showSolutionBtn.addEventListener('click', ()=>{
  document.querySelector('.preview-box').classList.toggle('visible');
});

// ---------- IMAGE LOADER ----------
function tryInit(idx=0){

  if(idx>=imgCandidates.length){
    imgUrl='https://source.unsplash.com/360x360/?cat';
    solutionImg.src=imgUrl;
    createTiles();
    shuffleAll();
    return;
  }

  const img=new Image();
  img.onload=()=>{
    imgUrl=imgCandidates[idx];
    solutionImg.src=imgUrl;
    createTiles();
    shuffleAll();
  };
  img.onerror=()=>tryInit(idx+1);
  img.src=imgCandidates[idx];
}

tryInit();

// ---------- SOLVED / MODAL HANDLING ----------
function checkSolved(){
  // every tile's current row/col must match its original id position
  for(const t of tiles){
    const id0 = t.id - 1;
    const er = Math.floor(id0 / PUZZLE_SIZE);
    const ec = id0 % PUZZLE_SIZE;
    if(t.row !== er || t.col !== ec) return false;
  }
  return true;
}

function showCongrats(which){
  // compute elapsed
  const now = Date.now();
  const started = startTime || now;
  const elapsedSec = Math.round((now - started) / 1000);
  if(congratsTimeEl) congratsTimeEl.textContent = 'Time: ' + formatTime(elapsedSec);
  if(congratsModal) congratsModal.classList.add('visible');
  // launch confetti and suggest play
  startConfetti();
}

function hideCongrats(){
  if(congratsModal) congratsModal.classList.remove('visible');
}

if(replayBtn){
  replayBtn.addEventListener('click', ()=>{
    hideCongrats();
    // replay same puzzle: re-create and reshuffle
    createTiles();
    shuffleAll(6);
  });
}
if(closeModalBtn){ closeModalBtn.addEventListener('click', hideCongrats); }

// congrats modal play button: plays/pauses the music (current track)
// const congratsPlayBtn = document.getElementById('congratsPlay');
// if(congratsPlayBtn){
//   congratsPlayBtn.addEventListener('click', ()=>{
//     if(audio.paused){
//       audio.play().catch(()=>{});
//       congratsPlayBtn.textContent='⏸';
//     } else {
//       audio.pause();
//       congratsPlayBtn.textContent='▶';
//     }
//   });
// }

// CONFETTI: simple DOM-based confetti pieces
function startConfetti(){
  const colors = ['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93','#ff7aa2'];
  const count = 40;
  const pieces = [];
  for(let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className='confetti-piece';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    // random start horizontal position
    const left = Math.random()*100;
    el.style.left = left + 'vw';
    // random delay & duration variation
    const delay = Math.random()*300;
    el.style.top = (-10 - Math.random()*5) + 'vh';
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    el.style.animationDelay = delay + 'ms';
    el.style.opacity = 0.95;
    document.body.appendChild(el);
    pieces.push(el);
  }
  // remove after animation
  setTimeout(()=>{
    for(const p of pieces) p.remove();
  }, 2400);
}


// ================= MUSIC PLAYER =================
let audioUnlocked = false;

function unlockAudio(){
    if(audioUnlocked) return;

    audio.volume = 0.01;
    audio.play().then(()=>{
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        audioUnlocked = true;
    }).catch(()=>{});
}

document.addEventListener("click", unlockAudio);
document.addEventListener("touchstart", unlockAudio);
const tracks = [
  {title:"Perfect", url:"https://ia600608.us.archive.org/13/items/its-you_202602/its-you.mp3"},
  {title:"Iris", url:"https://ia600608.us.archive.org/13/items/its-you_202602/its-you.mp3"},
  {title:"One More Hour", url:"https://ia600608.us.archive.org/13/items/its-you_202602/its-you.mp3"},
  {title:"Night Changes", url:"https://ia600608.us.archive.org/13/items/its-you_202602/its-you.mp3"},
  {title:"Photograph", url:"https://ia600608.us.archive.org/13/items/its-you_202602/its-you.mp3"},
  {title:"Counting Stars", url:"https://archive.org/download/its-you_202602/its-you.mp3"}
];

const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const playBtn = document.getElementById("playPause");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const trackTitle = document.getElementById("trackTitle");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");

let startIndex = 0;

// ===== Render 4 Visible Songs =====
function renderPlaylist(){
  playlistEl.innerHTML = "";

  for(let i=0;i<4;i++){
    const idx = (startIndex + i) % tracks.length;
    const li = document.createElement("li");
    li.textContent = tracks[idx].title;
    li.dataset.index = idx;
    if(i===0) li.classList.add("active");
    playlistEl.appendChild(li);
  }
}

// ===== Load Current Track =====
function loadCurrent(){
  audio.src = tracks[startIndex].url;
  trackTitle.textContent = "Currently Playing: " + tracks[startIndex].title;
  audio.load();
}

// ===== Play Current =====
function playCurrent(){
  loadCurrent();
  audio.play();
  playBtn.textContent = "⏸";
}

// ===== Play / Pause =====
playBtn.onclick = () => {
  if(!audio.src){
    playCurrent();
    return;
  }

  if(audio.paused){
    audio.play();
    playBtn.textContent = "⏸";
  }else{
    audio.pause();
    playBtn.textContent = "▶";
  }
};

// ===== Next =====
nextBtn.onclick = () => {
  startIndex = (startIndex + 1) % tracks.length;
  renderPlaylist();
  playCurrent();
};

// ===== Prev =====
prevBtn.onclick = () => {
  startIndex = (startIndex - 1 + tracks.length) % tracks.length;
  renderPlaylist();
  playCurrent();
};

// ===== Click Song =====
playlistEl.addEventListener("click", (e)=>{
  if(e.target.tagName==="LI"){
    startIndex = Number(e.target.dataset.index);
    renderPlaylist();
    playCurrent();
  }
});

// ===== Auto Next =====
audio.addEventListener("ended", ()=>{
  startIndex = (startIndex + 1) % tracks.length;
  renderPlaylist();
  playCurrent();
});

// ===== Time Update =====
audio.addEventListener("timeupdate", ()=>{
  if(audio.duration){
    const pct = (audio.currentTime/audio.duration)*100;
    progressFill.style.width = pct + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
});

// ===== Seek =====
progressBar.onclick = (e)=>{
  const rect = progressBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left)/rect.width;
  audio.currentTime = pct * audio.duration;
};

// ===== Format Time =====
function formatTime(sec){
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

// Initialize
renderPlaylist();
const congratsPlayBtn = document.getElementById("congratsPlay");

congratsPlayBtn.addEventListener("click", () => {

    // if no song loaded, load current playlist song
    if(!audio.src || audio.src === window.location.href){
        audio.src = tracks[startIndex].url;
    }

    if(audio.paused){
        audio.play().then(()=>{
            congratsPlayBtn.textContent = "⏸";
        }).catch(err=>{
            console.log("Play blocked:", err);
        });
    }else{
        audio.pause();
        congratsPlayBtn.textContent = "▶";
    }

});



