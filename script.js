// Unicode pieces for board
const PIECES = {
  'p':'♟', 'r':'♜', 'n':'♞', 'b':'♝', 'q':'♛', 'k':'♚',
  'P':'♙', 'R':'♖', 'N':'♘', 'B':'♗', 'Q':'♕', 'K':'♔'
};
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const historyEl = document.getElementById('history');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const resetBtn = document.getElementById('resetBtn');
const aiBtn = document.getElementById('aiBtn');
const aiStatus = document.getElementById('aiStatus');

let game = new Chess();
let selected = null, legalMoves = [];
let moveHistory = [], redoHistory = [];
let lastMove = null;
let aiEnabled = false;

function renderBoard() {
  boardEl.innerHTML = '';
  const position = game.board();
  for (let r = 0; r < 8; r++) {
    const row = boardEl.insertRow();
    for (let c = 0; c < 8; c++) {
      const square = row.insertCell();
      const piece = position[r][c];
      square.className = ((r+c)%2 ? 'dark' : 'light');
      square.dataset.square = 'abcdefgh'[c] + (8-r);
      if (piece) square.textContent = PIECES[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
      // Highlight for selection, legal moves, and last move
      if (selected && selected === square.dataset.square) square.classList.add('selected');
      if (legalMoves.includes(square.dataset.square)) square.classList.add('legal');
      if (lastMove && (lastMove.from === square.dataset.square || lastMove.to === square.dataset.square)) square.classList.add('lastmove');
      square.onclick = () => onSquareClick(square.dataset.square);
    }
  }
}

function onSquareClick(sq) {
  if (selected && legalMoves.includes(sq)) {
    let move = game.move({ from: selected, to: sq, promotion: 'q' });
    moveHistory.push(move);
    redoHistory = [];
    selected = null;
    legalMoves = [];
    lastMove = {from: move.from, to: move.to};
    renderBoard();
    updateStatus();
    renderHistory();
    if (aiEnabled && !game.game_over() && game.turn() === 'b') {
      setTimeout(aiMove, 400);
    }
    return;
  }
  const piece = game.get(sq);
  if (piece && piece.color === game.turn() && (!aiEnabled || game.turn() === 'w')) {
    selected = sq;
    legalMoves = game.moves({ square: sq, verbose: true }).map(m => m.to);
  } else {
    selected = null;
    legalMoves = [];
  }
  renderBoard();
}

function updateStatus() {
  let status = (game.turn() === 'w' ? 'White' : 'Black') + ' to move.';
  if (game.in_checkmate()) status = 'Checkmate! ' + (game.turn() === 'w' ? 'Black' : 'White') + ' wins.';
  else if (game.in_draw()) status = 'Draw!';
  else if (game.in_check()) status += ' Check!';
  statusEl.textContent = status;
}

function renderHistory() {
  historyEl.innerHTML = '';
  let hist = game.history({ verbose: true });
  for (let i = 0; i < hist.length; i += 2) {
    let li = document.createElement('li');
    let moveNum = Math.floor(i/2) + 1;
    let whiteMove = hist[i] ? hist[i].san : '';
    let blackMove = hist[i+1] ? hist[i+1].san : '';
    li.innerHTML = `<span style="min-width:2em; color:#888;">${moveNum}.</span> <span style="color:#222;">${whiteMove}</span> <span style="color:#444;margin-left:8px;">${blackMove}</span>`;
    li.onclick = () => jumpToMove(i+1);
    historyEl.appendChild(li);
  }
}

function jumpToMove(index) {
  game = new Chess();
  let hist = moveHistory.slice(0, index);
  lastMove = null;
  for (let m of hist) {
    game.move(m);
    lastMove = {from: m.from, to: m.to};
  }
  redoHistory = moveHistory.slice(index).concat(redoHistory);
  moveHistory = hist;
  selected = null;
  legalMoves = [];
  renderBoard();
  updateStatus();
  renderHistory();
}

function undoMove() {
  if (!moveHistory.length) return;
  let move = game.undo();
  if (move) {
    redoHistory.unshift(moveHistory.pop());
    lastMove = moveHistory.length ? {from: moveHistory[moveHistory.length-1].from, to: moveHistory[moveHistory.length-1].to} : null;
    selected = null;
    legalMoves = [];
    renderBoard();
    updateStatus();
    renderHistory();
  }
}

function redoMove() {
  if (!redoHistory.length) return;
  let move = redoHistory.shift();
  if (move) {
    game.move(move);
    moveHistory.push(move);
    lastMove = {from: move.from, to: move.to};
    selected = null;
    legalMoves = [];
    renderBoard();
    updateStatus();
    renderHistory();
  }
}

function resetGame() {
  game = new Chess();
  moveHistory = [];
  redoHistory = [];
  selected = null;
  legalMoves = [];
  lastMove = null;
  renderBoard();
  updateStatus();
  renderHistory();
}

function aiMove() {
  if (game.turn() !== 'b' || game.game_over()) return;
  let moves = game.moves({ verbose: true });
  if (!moves.length) return;
  // Very basic AI: random legal move
  let move = moves[Math.floor(Math.random()*moves.length)];
  let result = game.move(move);
  moveHistory.push(result);
  lastMove = {from: result.from, to: result.to};
  redoHistory = [];
  renderBoard();
  updateStatus();
  renderHistory();
}

undoBtn.onclick = undoMove;
redoBtn.onclick = redoMove;
resetBtn.onclick = resetGame;
aiBtn.onclick = () => {
  aiEnabled = !aiEnabled;
  aiStatus.textContent = aiEnabled ? 'ON' : 'OFF';
  aiBtn.style.background = aiEnabled ? '#2bcf00' : '#ffb700';
  if (aiEnabled && game.turn() === 'b' && !game.game_over()) setTimeout(aiMove, 500);
};

// Initial render
renderBoard();
updateStatus();
renderHistory();