(function () {
  var boardEl = document.getElementById('board');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var statusEl = document.getElementById('status');
  var undoBtn = document.getElementById('undo');
  var SAVE = 'fg-2048-game';

  var cells, score, won, over, prev;
  var tiles = [];
  for (var i = 0; i < 16; i++) {
    var t = document.createElement('div');
    t.className = 'tile';
    boardEl.appendChild(t);
    tiles.push(t);
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function newGame() {
    cells = [];
    for (var i = 0; i < 16; i++) cells.push(0);
    score = 0;
    won = false;
    over = false;
    prev = null;
    addTile();
    addTile();
    setStatus('');
    render();
  }

  function addTile() {
    var empty = [];
    for (var i = 0; i < 16; i++) if (!cells[i]) empty.push(i);
    if (!empty.length) return;
    cells[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  }

  // Cell indices of row/column i, ordered starting from the wall tiles slide toward.
  function line(dir, i) {
    var r = [];
    for (var j = 0; j < 4; j++) {
      if (dir === 'left') r.push(i * 4 + j);
      else if (dir === 'right') r.push(i * 4 + 3 - j);
      else if (dir === 'up') r.push(j * 4 + i);
      else r.push((3 - j) * 4 + i);
    }
    return r;
  }

  function move(dir) {
    if (over) return;
    var before = { cells: cells.slice(), score: score, won: won };
    var moved = false;
    for (var i = 0; i < 4; i++) {
      var idx = line(dir, i);
      var vals = idx.map(function (k) { return cells[k]; }).filter(Boolean);
      var out = [];
      for (var k = 0; k < vals.length; k++) {
        if (k + 1 < vals.length && vals[k] === vals[k + 1]) {
          out.push(vals[k] * 2);
          score += vals[k] * 2;
          k++;
        } else {
          out.push(vals[k]);
        }
      }
      while (out.length < 4) out.push(0);
      for (var j = 0; j < 4; j++) {
        if (cells[idx[j]] !== out[j]) moved = true;
        cells[idx[j]] = out[j];
      }
    }
    if (!moved) return;
    prev = before;
    addTile();

    if (!won && cells.indexOf(2048) !== -1) {
      won = true;
      setStatus('You made 2048! Keep going for a higher score, or start a new game.', 'win');
    } else if (!canMove()) {
      over = true;
      FG.saveBest('2048', score);
      var record = score > 0 && score === FG.getBest('2048');
      setStatus('No moves left. Final score: ' + score + '.' + (record ? ' New best!' : ''), record ? 'win' : 'lose');
    } else if (!won) {
      setStatus('');
    }
    render();
  }

  function canMove() {
    for (var i = 0; i < 16; i++) {
      if (!cells[i]) return true;
      if (i % 4 < 3 && cells[i] === cells[i + 1]) return true;
      if (i < 12 && cells[i] === cells[i + 4]) return true;
    }
    return false;
  }

  function undo() {
    if (!prev) return;
    cells = prev.cells;
    score = prev.score;
    won = prev.won;
    over = false;
    prev = null;
    setStatus('Move undone.');
    render();
  }

  function render() {
    for (var i = 0; i < 16; i++) {
      var v = cells[i];
      tiles[i].textContent = v || '';
      tiles[i].setAttribute('data-v', v > 2048 ? 'big' : String(v));
    }
    scoreEl.textContent = score;
    if (score > (FG.getBest('2048') || 0)) FG.saveBest('2048', score);
    bestEl.textContent = FG.getBest('2048') || 0;
    undoBtn.disabled = !prev;
    FG.save(SAVE, over ? null : { cells: cells, score: score, won: won });
  }

  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };

  document.addEventListener('keydown', function (e) {
    if (KEYS[e.key]) {
      e.preventDefault();
      move(KEYS[e.key]);
    } else if (e.key === 'u' || e.key === 'U') {
      undo();
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll('.dpad button'), function (b) {
    b.addEventListener('click', function () { move(b.getAttribute('data-dir')); });
  });
  document.getElementById('restart').addEventListener('click', newGame);
  undoBtn.addEventListener('click', undo);

  var touchStart = null;
  boardEl.addEventListener('touchstart', function (e) {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  boardEl.addEventListener('touchend', function (e) {
    if (!touchStart) return;
    var dx = e.changedTouches[0].clientX - touchStart.x;
    var dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });

  var saved = FG.load(SAVE, null);
  if (saved && saved.cells && saved.cells.length === 16) {
    cells = saved.cells;
    score = saved.score || 0;
    won = !!saved.won;
    over = false;
    prev = null;
    setStatus('Welcome back — your last game was restored.');
    render();
  } else {
    newGame();
  }
})();
