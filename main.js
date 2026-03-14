const TOTAL_TIME    = 30;
const MEMORIZE_TIME = 3;
const PAIRS         = 4;

const IMG_POOL = [
  { id: 'c1', src: 'images/card1.jpeg' },
  { id: 'c2', src: 'images/card2.jpeg' },
  { id: 'c3', src: 'images/card3.jpeg' },
  { id: 'c4', src: 'images/card4.jpeg' },
  { id: 'c5', src: 'images/card5.jpeg' },
];
const COVER_SRC = 'images/cover.jpeg';

let phase = 'idle';
let timeLeft = TOTAL_TIME;
let round = 0;
let score = 0;
let matched = 0;
let first = null;
let locked = false;
let gameInterval = null;
let memTimeout = null;

const gridEl       = document.getElementById('card-grid');
const tNum         = document.getElementById('t-num');
const resultScreen = document.getElementById('result-screen');

document.getElementById('restart-btn').addEventListener('click', backToIdle);

function renderTimer() {
  tNum.textContent = timeLeft;
  tNum.classList.toggle('warn',   timeLeft <= 10 && timeLeft > 5);
  tNum.classList.toggle('danger', timeLeft <= 5);
}

function startGame() {
  timeLeft = TOTAL_TIME;
  round    = 0;
  score    = 0;
  renderTimer();

  gameInterval = setInterval(() => {
    if (phase !== 'playing') return;
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) { timeLeft = 0; renderTimer(); endGame(); }
  }, 1000);

  beginRound();
}

function beginRound() {
  round++;
  matched = 0;
  first   = null;
  locked  = false;
  buildGrid();
  revealAll();
  phase = 'memorize';
  memTimeout = setTimeout(() => {
    hideAll();
    phase = 'playing';
  }, MEMORIZE_TIME * 1000);
}

function onCardClick(card) {
  if (phase !== 'playing' || locked) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

  card.classList.add('flipped');
  if (!first) { first = card; return; }

  const second = card;
  locked = true;

  if (first.dataset.pid === second.dataset.pid) {
    setTimeout(() => {
      if (phase === 'gameover') return;
      first.classList.replace('flipped', 'matched');
      second.classList.replace('flipped', 'matched');
      first.style.pointerEvents = second.style.pointerEvents = 'none';
      matched++;
      first = null; locked = false;
      if (matched === PAIRS) onRoundComplete();
    }, 350);
  } else {
    first.classList.add('wrong');
    second.classList.add('wrong');
    setTimeout(() => {
      if (phase === 'gameover') return;
      first.classList.remove('flipped', 'wrong');
      second.classList.remove('flipped', 'wrong');
      first = null; locked = false;
    }, 700);
  }
}

function onRoundComplete() {
  if (timeLeft <= 0) { endGame(); return; }
  phase = 'between';
  score += round * 10;
  setTimeout(() => { if (timeLeft > 0) beginRound(); else endGame(); }, 400);
}

function endGame() {
  phase = 'gameover';
  clearInterval(gameInterval);
  clearTimeout(memTimeout);
  document.getElementById('final-rounds').textContent = round;
  document.getElementById('final-score').textContent  = score;
  resultScreen.style.display = '';
}

function backToIdle() {
  clearInterval(gameInterval);
  clearTimeout(memTimeout);
  phase    = 'idle';
  timeLeft = TOTAL_TIME;
  renderTimer();
  resultScreen.style.display = 'none';
  showIdleGrid();
}

function buildGrid() {
  gridEl.innerHTML = '';
  const offset = ((round - 1) * PAIRS) % IMG_POOL.length;
  const pairs = Array.from({ length: PAIRS }, (_, i) => IMG_POOL[(offset + i) % IMG_POOL.length]);
  const cards = [];
  pairs.forEach(img => { cards.push(img); cards.push(img); });
  shuffle(cards).forEach(img => gridEl.appendChild(makeCard(img)));
}

function showIdleGrid() {
  gridEl.innerHTML = '';
  for (let i = 0; i < PAIRS * 2; i++) {
    const card = makeBackCard();
    card.addEventListener('click', startGame, { once: true });
    gridEl.appendChild(card);
  }
}

function makeCard(img) {
  const wrap  = document.createElement('div');
  wrap.className = 'card';
  wrap.dataset.pid = img.id;

  const inner = document.createElement('div');
  inner.className = 'card-inner';

  const back = document.createElement('div');
  back.className = 'card-face card-back';
  const coverImg = document.createElement('img');
  coverImg.src = COVER_SRC; coverImg.alt = '';
  back.appendChild(coverImg);

  const front = document.createElement('div');
  front.className = 'card-face card-front';
  const fImg = document.createElement('img');
  fImg.src = img.src; fImg.alt = '';
  front.appendChild(fImg);

  inner.appendChild(back);
  inner.appendChild(front);
  wrap.appendChild(inner);
  wrap.addEventListener('click', () => onCardClick(wrap));
  return wrap;
}

function makeBackCard() {
  const wrap  = document.createElement('div');
  wrap.className = 'card';
  const inner = document.createElement('div');
  inner.className = 'card-inner';
  const back = document.createElement('div');
  back.className = 'card-face card-back';
  const img = document.createElement('img');
  img.src = COVER_SRC; img.alt = '';
  back.appendChild(img);
  inner.appendChild(back);
  wrap.appendChild(inner);
  return wrap;
}

function revealAll() {
  gridEl.querySelectorAll('.card').forEach(c => c.classList.add('flipped'));
}
function hideAll() {
  gridEl.querySelectorAll('.card:not(.matched)').forEach(c => c.classList.remove('flipped'));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

renderTimer();
showIdleGrid();
