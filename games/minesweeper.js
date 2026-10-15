(function () {
  var LEVELS = {
    easy: { cols: 9, rows: 9, mines: 10, cell: 36 },
    medium: { cols: 16, rows: 16, mines: 40, cell: 28 }
  };

  var boardEl = document.getElementById('board');
  var leftEl = document.getElementById('left');
  var timeEl = document.getElementById('time');
  var bestEl = document.getElementById('best');
  var statusEl = document.getElementById('status');
  var levelSel = document.getElementById('level');
  var flagBtn = document.getElementById('flagmode');

  var level, cols, rows, mineCount;
  var mine, open, flag, count, buttons;
  var started, finished, opened, flags, seconds, timer, focusIdx;
  var flagMode = false;

  levelSel.value = FG.load('fg-mines-level', 'easy') === 'medium' ? 'medium' : 'easy';

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function showBest() {
    var b = FG.getBest('minesweeper-' + level);
    bestEl.textContent = b === null ? '–' : b + 's';
  }

  function newGame() {
    level = levelSel.value;
    var cfg = LEVELS[level];
    cols = cfg.cols; rows = cfg.rows; mineCount = cfg.mines;
    var total = cols * rows;
    mine = new Array(total).fill(false);
    open = new Array(total).fill(false);
    flag = new Array(total).fill(false);
    count = new Array(total).fill(0);
    started = false; finished = false;
    opened = 0; flags = 0; seconds = 0; focusIdx = 0;
    clearInterval(timer);
    timeEl.textContent = 0;

    boardEl.style.setProperty('--cols', cols);
    boardEl.style.setProperty('--cell', 'min(' + cfg.cell + 'px, calc((100vw - 48px) / ' + cols + '))');
    boardEl.innerHTML = '';
    buttons = [];
    for (var r = 0; r < rows; r++) {
      var row = document.createElement('div');
      row.setAttribute('role', 'row');
      row.style.display = 'contents';
      for (var c = 0; c < cols; c++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'gridcell');
        b.tabIndex = -1;
        b.dataset.i = r * cols + c;
        row.appendChild(b);
        buttons.push(b);
      }
      boardEl.appendChild(row);
    }
    buttons[0].tabIndex = 0;
    for (var i = 0; i < total; i++) paint(i);
    leftEl.textContent = mineCount;
    setStatus('Click any square to start.');
    showBest();
  }

  function neighbors(i) {
    var r = Math.floor(i / cols), c = i % cols, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
      }
    }
    return out;
  }

  function layMines(safe) {
    var banned = neighbors(safe).concat(safe);
    var spots = [];
    for (var i = 0; i < cols * rows; i++) if (banned.indexOf(i) === -1) spots.push(i);
    for (var m = 0; m < mineCount; m++) {
      var k = Math.floor(Math.random() * spots.length);
      mine[spots[k]] = true;
      spots.splice(k, 1);
    }
    for (var j = 0; j < cols * rows; j++) {
      count[j] = neighbors(j).filter(function (n) { return mine[n]; }).length;
    }
  }

  function paint(i) {
    var b = buttons[i];
    var r = Math.floor(i / cols) + 1, c = (i % cols) + 1;
    var where = 'Row ' + r + ', column ' + c + ': ';
    b.className = '';
    if (open[i]) {
      b.classList.add('open');
      if (mine[i]) {
        b.textContent = '✱';
        b.classList.add('boom');
        b.setAttribute('aria-label', where + 'mine');
      } else {
        b.textContent = count[i] || '';
        if (count[i]) b.classList.add('n' + count[i]);
        b.setAttribute('aria-label', where + (count[i] ? count[i] + ' nearby' : 'empty'));
      }
    } else if (flag[i]) {
      b.textContent = '⚑';
      b.classList.add('flag');
      b.setAttribute('aria-label', where + 'flagged');
    } else {
      b.textContent = '';
      b.setAttribute('aria-label', where + 'covered');
    }
  }

  function reveal(i) {
    if (finished || flag[i]) return;
    if (!started) {
      started = true;
      layMines(i);
      setStatus('');
      timer = setInterval(function () {
        seconds++;
        timeEl.textContent = seconds;
      }, 1000);
    }
    if (open[i]) return chord(i);
    if (mine[i]) return lose(i);

    var stack = [i];
    while (stack.length) {
      var k = stack.pop();
      if (open[k] || flag[k]) continue;
      open[k] = true;
      opened++;
      paint(k);
      if (count[k] === 0) stack.push.apply(stack, neighbors(k));
    }
    if (opened === cols * rows - mineCount) win();
  }

  // Clicking an open number with the right number of flags opens its neighbours.
  function chord(i) {
    if (!count[i]) return;
    var around = neighbors(i);
    var flagged = around.filter(function (n) { return flag[n]; }).length;
    if (flagged !== count[i]) return;
    around.forEach(function (n) {
      if (!open[n] && !flag[n] && !finished) reveal(n);
    });
  }

  function toggleFlag(i) {
    if (finished || open[i]) return;
    flag[i] = !flag[i];
    flags += flag[i] ? 1 : -1;
    leftEl.textContent = mineCount - flags;
    paint(i);
  }

  function lose(hit) {
    finished = true;
    clearInterval(timer);
    for (var i = 0; i < mine.length; i++) {
      if (mine[i]) { flag[i] = false; open[i] = true; paint(i); }
    }
    buttons[hit].focus();
    setStatus('Boom! You hit a mine. Press New game to try again.', 'lose');
  }

  function win() {
    finished = true;
    clearInterval(timer);
    for (var i = 0; i < mine.length; i++) {
      if (mine[i] && !flag[i]) { flag[i] = true; paint(i); }
    }
    leftEl.textContent = 0;
    var record = FG.saveBest('minesweeper-' + level, seconds, true);
    showBest();
    setStatus('You cleared the field in ' + seconds + ' seconds!' + (record ? ' New best time!' : ''), 'win');
  }

  function moveFocus(i) {
    buttons[focusIdx].tabIndex = -1;
    focusIdx = i;
    buttons[i].tabIndex = 0;
    buttons[i].focus();
  }

  boardEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var i = Number(b.dataset.i);
    if (focusIdx !== i) moveFocus(i);
    if (flagMode && !open[i]) toggleFlag(i); else reveal(i);
  });

  boardEl.addEventListener('contextmenu', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    e.preventDefault();
    toggleFlag(Number(b.dataset.i));
  });

  boardEl.addEventListener('keydown', function (e) {
    var r = Math.floor(focusIdx / cols), c = focusIdx % cols;
    var next = null;
    if (e.key === 'ArrowUp' && r > 0) next = focusIdx - cols;
    else if (e.key === 'ArrowDown' && r < rows - 1) next = focusIdx + cols;
    else if (e.key === 'ArrowLeft' && c > 0) next = focusIdx - 1;
    else if (e.key === 'ArrowRight' && c < cols - 1) next = focusIdx + 1;
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFlag(focusIdx); return; }
    if (e.key.indexOf('Arrow') === 0) e.preventDefault();
    if (next !== null) moveFocus(next);
  });

  flagBtn.addEventListener('click', function () {
    flagMode = !flagMode;
    flagBtn.setAttribute('aria-pressed', String(flagMode));
    flagBtn.textContent = 'Flag mode: ' + (flagMode ? 'on' : 'off');
  });

  levelSel.addEventListener('change', function () {
    FG.save('fg-mines-level', levelSel.value);
    newGame();
  });
  document.getElementById('restart').addEventListener('click', newGame);

  // Stop the clock while the tab is hidden so a quick switch doesn't ruin a best time.
  document.addEventListener('visibilitychange', function () {
    if (!started || finished) return;
    if (document.hidden) {
      clearInterval(timer);
    } else {
      clearInterval(timer);
      timer = setInterval(function () {
        seconds++;
        timeEl.textContent = seconds;
      }, 1000);
    }
  });

  newGame();
})();
