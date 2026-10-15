(function () {
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var scoreEl = document.getElementById('score');
  var livesEl = document.getElementById('lives');
  var levelEl = document.getElementById('level');
  var bestEl = document.getElementById('best');
  var statusEl = document.getElementById('status');
  var startBtn = document.getElementById('start');

  var COLS = 8, ROWS = 5, GAP = 6, TOP = 40;
  var BW = (W - GAP * (COLS + 1)) / COLS, BH = 16;
  var ROW_COLORS = ['#ef476f', '#f78c6b', '#ffd166', '#06d6a0', '#4ea8de'];

  var paddle = { w: 80, h: 10, x: W / 2 - 40, y: H - 24 };
  var ball = { r: 6, x: 0, y: 0, vx: 0, vy: 0 };
  var bricks, score, lives, level, state, keys = {}, last = 0, frame = 0;
  // state: serve (ball on paddle) | running | paused | over

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function showBest() { bestEl.textContent = FG.getBest('breakout') || 0; }

  function buildBricks() {
    bricks = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        bricks.push({ x: GAP + c * (BW + GAP), y: TOP + r * (BH + GAP), color: ROW_COLORS[r], points: (ROWS - r) * 10, alive: true });
      }
    }
  }

  function newGame() {
    score = 0; lives = 3; level = 1;
    buildBricks();
    serve();
    updateHud();
    setStatus('Press Space or click the board to launch.');
    startBtn.textContent = 'Launch';
    draw();
  }

  function serve() {
    state = 'serve';
    ball.vx = 0; ball.vy = 0;
    stickBall();
  }

  function stickBall() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 1;
  }

  function speed() { return 260 + (level - 1) * 40; } // pixels per second

  function launch() {
    if (state === 'over') { newGame(); return; }
    if (state === 'serve') {
      var angle = (-Math.PI / 2) + (Math.random() * 0.6 - 0.3);
      ball.vx = Math.cos(angle) * speed();
      ball.vy = Math.sin(angle) * speed();
    }
    if (state === 'serve' || state === 'paused') {
      state = 'running';
      startBtn.textContent = 'Pause';
      setStatus('');
      last = 0;
      frame = requestAnimationFrame(loop);
    }
  }

  function pause() {
    if (state !== 'running') return;
    state = 'paused';
    cancelAnimationFrame(frame);
    startBtn.textContent = 'Resume';
    setStatus('Paused. Press Space or Resume to keep going.');
  }

  function updateHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    levelEl.textContent = level;
    showBest();
  }

  function movePaddle(dt) {
    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) setPaddle(paddle.x + paddle.w / 2 + dir * 420 * dt);
  }

  function setPaddle(centerX) {
    paddle.x = Math.max(0, Math.min(W - paddle.w, centerX - paddle.w / 2));
    if (state === 'serve') { stickBall(); draw(); }
  }

  function loop(t) {
    if (state !== 'running') return;
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    movePaddle(dt);
    // Small sub-steps so a fast ball can't skip through a brick.
    var steps = 4;
    for (var i = 0; i < steps && state === 'running'; i++) physics(dt / steps);
    draw();
    if (state === 'running') frame = requestAnimationFrame(loop);
  }

  function physics(dt) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
    if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

    // Paddle: where it hits changes the bounce angle.
    if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
      var hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1 .. 1
      var angle = hit * (Math.PI / 3);
      var s = speed();
      ball.vx = Math.sin(angle) * s;
      ball.vy = -Math.cos(angle) * s;
      ball.y = paddle.y - ball.r;
    }

    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.alive) continue;
      var cx = Math.max(b.x, Math.min(ball.x, b.x + BW));
      var cy = Math.max(b.y, Math.min(ball.y, b.y + BH));
      var dx = ball.x - cx, dy = ball.y - cy;
      if (dx * dx + dy * dy > ball.r * ball.r) continue;
      b.alive = false;
      score += b.points;
      if (Math.abs(dx) > Math.abs(dy)) ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
      else ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
      updateHud();
      if (bricks.every(function (k) { return !k.alive; })) return nextLevel();
      break;
    }

    if (ball.y - ball.r > H) loseLife();
  }

  function nextLevel() {
    level++;
    buildBricks();
    serve();
    updateHud();
    startBtn.textContent = 'Launch';
    setStatus('Level ' + level + '! The ball is a bit faster now. Press Space to launch.', 'win');
  }

  function loseLife() {
    lives--;
    updateHud();
    if (lives > 0) {
      serve();
      startBtn.textContent = 'Launch';
      setStatus('Missed! ' + lives + (lives === 1 ? ' life' : ' lives') + ' left. Press Space to launch.');
      return;
    }
    state = 'over';
    var record = FG.saveBest('breakout', score);
    showBest();
    startBtn.textContent = 'Play again';
    setStatus('Game over. Score: ' + score + '.' + (record && score > 0 ? ' New best!' : ''), record && score > 0 ? 'win' : 'lose');
  }

  function draw() {
    var p = FG.palette();
    ctx.fillStyle = p.board;
    ctx.fillRect(0, 0, W, H);

    var contrast = document.documentElement.getAttribute('data-theme') === 'contrast';
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.alive) continue;
      ctx.fillStyle = contrast ? p.fg : b.color;
      ctx.fillRect(b.x, b.y, BW, BH);
    }

    ctx.fillStyle = p.accent;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    ctx.fillStyle = p.fg;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function pointerToCanvasX(clientX) {
    var rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) * (W / rect.width);
  }

  canvas.addEventListener('mousemove', function (e) { setPaddle(pointerToCanvasX(e.clientX)); });
  canvas.addEventListener('click', function () { if (state !== 'running') launch(); });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    setPaddle(pointerToCanvasX(e.touches[0].clientX));
  }, { passive: false });
  canvas.addEventListener('touchstart', function (e) {
    setPaddle(pointerToCanvasX(e.touches[0].clientX));
  }, { passive: true });

  var KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  document.addEventListener('keydown', function (e) {
    if (KEYMAP[e.key]) {
      e.preventDefault();
      keys[KEYMAP[e.key]] = true;
      if (state === 'serve') keyNudge();
    } else if (e.key === ' ' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      if (state === 'running') pause(); else launch();
    }
  });
  document.addEventListener('keyup', function (e) {
    if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false;
  });

  // While waiting to serve there is no animation loop, so slide the paddle directly.
  function keyNudge() {
    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    setPaddle(paddle.x + paddle.w / 2 + dir * 24);
  }

  startBtn.addEventListener('click', function () {
    if (state === 'running') pause(); else launch();
  });
  document.getElementById('restart').addEventListener('click', function () {
    cancelAnimationFrame(frame);
    newGame();
  });

  FG.onLeave(function () {
    keys = {};
    pause();
  });

  newGame();
})();
