(function () {
  var LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  var boardEl = document.getElementById('board');
  var statusEl = document.getElementById('status');
  var modeSel = document.getElementById('mode');

  var stats = Object.assign({ wins: 0, losses: 0, draws: 0 }, FG.load('fg-ttt-stats', {}));
  var board, turn, done, firstPlayer = 'O', thinking;

  modeSel.value = ['easy', 'hard', 'two'].indexOf(FG.load('fg-ttt-mode', 'easy')) !== -1 ? FG.load('fg-ttt-mode', 'easy') : 'easy';

  var buttons = [];
  for (var i = 0; i < 9; i++) {
    (function (i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', function () { play(i); });
      boardEl.appendChild(b);
      buttons.push(b);
    })(i);
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function vsComputer() { return modeSel.value !== 'two'; }

  function showStats() {
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('draws').textContent = stats.draws;
  }

  function newGame() {
    clearTimeout(thinking);
    board = ['', '', '', '', '', '', '', '', ''];
    done = false;
    firstPlayer = firstPlayer === 'X' ? 'O' : 'X';
    turn = firstPlayer;
    render();
    announceTurn();
    if (vsComputer() && turn === 'O') computerMove();
  }

  function announceTurn() {
    if (vsComputer()) setStatus(turn === 'X' ? 'Your turn (X).' : 'Computer is thinking…');
    else setStatus(turn + "'s turn.");
  }

  function winner(b) {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]], line: l };
    }
    return b.indexOf('') === -1 ? { who: 'draw', line: [] } : null;
  }

  function play(i) {
    if (done || board[i]) return;
    if (vsComputer() && turn === 'O') return;
    place(i);
    if (!done && vsComputer()) computerMove();
  }

  function place(i) {
    board[i] = turn;
    turn = turn === 'X' ? 'O' : 'X';
    var w = winner(board);
    if (w) finish(w); else announceTurn();
    render(w);
  }

  function computerMove() {
    thinking = setTimeout(function () {
      var move = (modeSel.value === 'easy' && Math.random() < 0.5) ? randomMove() : bestMove();
      place(move);
    }, 350);
  }

  function randomMove() {
    var free = [];
    board.forEach(function (v, i) { if (!v) free.push(i); });
    return free[Math.floor(Math.random() * free.length)];
  }

  function bestMove() {
    var best = -Infinity, choice = null;
    for (var i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = 'O';
      var s = minimax(board, 'X', 1);
      board[i] = '';
      if (s > best) { best = s; choice = i; }
    }
    return choice;
  }

  function minimax(b, player, depth) {
    var w = winner(b);
    if (w) return w.who === 'O' ? 10 - depth : w.who === 'X' ? depth - 10 : 0;
    var scores = [];
    for (var i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = player;
      scores.push(minimax(b, player === 'O' ? 'X' : 'O', depth + 1));
      b[i] = '';
    }
    return player === 'O' ? Math.max.apply(null, scores) : Math.min.apply(null, scores);
  }

  function finish(w) {
    done = true;
    if (w.who === 'draw') {
      setStatus("It's a draw. Press New game to play again.");
      if (vsComputer()) stats.draws++;
    } else if (vsComputer()) {
      if (w.who === 'X') { stats.wins++; setStatus('You win!', 'win'); }
      else { stats.losses++; setStatus('The computer wins this one.', 'lose'); }
    } else {
      setStatus(w.who + ' wins!', 'win');
    }
    FG.save('fg-ttt-stats', stats);
    FG.save('fg-best-tictactoe-wins', stats.wins);
    showStats();
  }

  function render(w) {
    var winLine = w ? w.line : [];
    var names = ['top left', 'top middle', 'top right', 'middle left', 'center', 'middle right', 'bottom left', 'bottom middle', 'bottom right'];
    for (var i = 0; i < 9; i++) {
      var b = buttons[i];
      b.textContent = board[i];
      b.className = (board[i] ? board[i].toLowerCase() : '') + (winLine.indexOf(i) !== -1 ? ' win' : '');
      b.setAttribute('aria-label', names[i] + ': ' + (board[i] || 'empty'));
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'SELECT') return;
    var n = Number(e.key);
    if (n >= 1 && n <= 9) play(n - 1);
  });

  modeSel.addEventListener('change', function () {
    FG.save('fg-ttt-mode', modeSel.value);
    firstPlayer = 'O'; // so the human (X) moves first in the new game
    newGame();
  });
  document.getElementById('restart').addEventListener('click', newGame);

  showStats();
  newGame();
})();
