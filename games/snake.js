(function () {
  var N = 20;
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var cell = canvas.width / N;
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var statusEl = document.getElementById('status');
  var startBtn = document.getElementById('start');
  var speedSel = document.getElementById('speed');

  var DIRS = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
  };

  var snake, dir, queue, food, score, timer, state; // state: ready | running | paused | over

  speedSel.value = String(FG.load('fg-snake-speed', 125));
  speedSel.addEventListener('change', function () { FG.save('fg-snake-speed', Number(speedSel.value)); });

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function showBest() { bestEl.textContent = FG.getBest('snake') || 0; }

  function reset() {
    clearTimeout(timer);
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    dir = DIRS.right;
    queue = [];
    score = 0;
    scoreEl.textContent = 0;
    placeFood();
    state = 'ready';
    startBtn.textContent = 'Start';
    setStatus('Press an arrow key or Start to play.');
    draw();
  }

  function placeFood() {
    var free = [];
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        if (!onSnake(x, y)) free.push({ x: x, y: y });
      }
    }
    food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  function onSnake(x, y, skipTail) {
    var len = skipTail ? snake.length - 1 : snake.length;
    for (var i = 0; i < len; i++) {
      if (snake[i].x === x && snake[i].y === y) return true;
    }
    return false;
  }

  function delay() {
    // Speeds up a little as the snake grows.
    return Math.max(55, Number(speedSel.value) - score * 1.5);
  }

  function start() {
    if (state === 'over') reset();
    if (state === 'running') return;
    state = 'running';
    startBtn.textContent = 'Pause';
    setStatus('');
    timer = setTimeout(step, delay());
  }

  function pause() {
    if (state !== 'running') return;
    state = 'paused';
    clearTimeout(timer);
    startBtn.textContent = 'Resume';
    setStatus('Paused. Press Space or Resume to keep going.');
  }

  function step() {
    if (queue.length) dir = queue.shift();
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    var eating = food && head.x === food.x && head.y === food.y;
    var outside = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
    if (outside || onSnake(head.x, head.y, !eating)) return gameOver();

    snake.unshift(head);
    if (eating) {
      score++;
      scoreEl.textContent = score;
      placeFood();
      if (!food) return gameOver(true);
    } else {
      snake.pop();
    }
    draw();
    timer = setTimeout(step, delay());
  }

  function gameOver(won) {
    state = 'over';
    clearTimeout(timer);
    startBtn.textContent = 'Play again';
    var record = FG.saveBest('snake', score);
    showBest();
    var msg = won ? 'You filled the whole board! ' : 'Game over. ';
    msg += 'Score: ' + score + '.' + (record && score > 0 ? ' New best!' : '') + ' Press Enter to play again.';
    setStatus(msg, won || record ? 'win' : 'lose');
    draw();
  }

  function turn(name) {
    var d = DIRS[name];
    var last = queue.length ? queue[queue.length - 1] : dir;
    if (d.x === -last.x && d.y === -last.y) return; // no instant reversal
    if (d.x === last.x && d.y === last.y) return;
    if (queue.length < 3) queue.push(d);
    if (state === 'ready') start();
  }

  function draw() {
    var p = FG.palette();
    ctx.fillStyle = p.board;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // faint grid
    ctx.strokeStyle = p.border;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (var i = 1; i < N; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell + 0.5, 0); ctx.lineTo(i * cell + 0.5, canvas.height);
      ctx.moveTo(0, i * cell + 0.5); ctx.lineTo(canvas.width, i * cell + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (food) {
      ctx.fillStyle = p.bad;
      ctx.beginPath();
      ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var s = snake.length - 1; s >= 0; s--) {
      ctx.fillStyle = s === 0 ? p.fg : p.good;
      ctx.fillRect(snake[s].x * cell + 1, snake[s].y * cell + 1, cell - 2, cell - 2);
    }
  }

  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'SELECT') return;
    if (KEYS[e.key]) {
      e.preventDefault();
      if (state === 'over') return;
      if (state === 'paused') start();
      turn(KEYS[e.key]);
    } else if (e.key === ' ') {
      if (e.target.tagName === 'BUTTON') return; // let the focused button handle Space
      e.preventDefault();
      if (state === 'running') pause(); else start();
    } else if (e.key === 'Enter' && state === 'over' && e.target.tagName !== 'BUTTON') {
      start();
    }
  });

  startBtn.addEventListener('click', function () {
    if (state === 'running') pause(); else start();
  });
  document.getElementById('restart').addEventListener('click', reset);

  Array.prototype.forEach.call(document.querySelectorAll('.dpad button'), function (b) {
    b.addEventListener('click', function () {
      if (state === 'over') return;
      if (state === 'paused') start();
      turn(b.getAttribute('data-dir'));
    });
  });

  // Swipe on the board
  var touchStart = null;
  canvas.addEventListener('touchstart', function (e) {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', function (e) {
    if (!touchStart) return;
    var dx = e.changedTouches[0].clientX - touchStart.x;
    var dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
      if (state !== 'running') start();
      return;
    }
    if (state === 'over') return;
    if (state === 'paused') start();
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });

  FG.onLeave(pause);
  showBest();
  reset();
})();
