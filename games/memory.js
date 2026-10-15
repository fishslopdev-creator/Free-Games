(function () {
  // Plain symbols that render on any computer (no emoji font needed).
  var FACES = [
    { s: '★', name: 'star', color: '#e0a800' },
    { s: '♥', name: 'heart', color: '#d6334a' },
    { s: '♦', name: 'diamond', color: '#e0662b' },
    { s: '♣', name: 'club', color: '#1b7f45' },
    { s: '♠', name: 'spade', color: 'var(--fg)' },
    { s: '●', name: 'circle', color: '#2463d6' },
    { s: '▲', name: 'triangle', color: '#8a4fd1' },
    { s: '■', name: 'square', color: '#0f7f86' }
  ];

  var boardEl = document.getElementById('board');
  var movesEl = document.getElementById('moves');
  var pairsEl = document.getElementById('pairs');
  var bestEl = document.getElementById('best');
  var statusEl = document.getElementById('status');

  var deck, buttons, up, matched, moves, locked, hideTimer;

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function showBest() {
    var b = FG.getBest('memory');
    bestEl.textContent = b === null ? '–' : b;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function newGame() {
    clearTimeout(hideTimer);
    deck = shuffle(FACES.concat(FACES).map(function (f) { return { face: f, done: false }; }));
    up = [];
    matched = 0;
    moves = 0;
    locked = false;
    boardEl.innerHTML = '';
    buttons = deck.map(function (card, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', function () { flip(i); });
      boardEl.appendChild(b);
      return b;
    });
    deck.forEach(function (c, i) { paint(i); });
    movesEl.textContent = 0;
    pairsEl.textContent = 0;
    setStatus('');
    showBest();
  }

  function paint(i) {
    var card = deck[i], b = buttons[i];
    var showing = card.done || up.indexOf(i) !== -1;
    b.className = card.done ? 'done' : (showing ? 'up' : '');
    b.textContent = showing ? card.face.s : '?';
    b.style.color = showing ? card.face.color : '';
    b.setAttribute('aria-label', 'Card ' + (i + 1) + ': ' + (showing ? card.face.name : 'face down') + (card.done ? ', matched' : ''));
    b.setAttribute('aria-disabled', String(card.done));
  }

  function flip(i) {
    var card = deck[i];
    if (card.done || up.indexOf(i) !== -1) return;
    if (locked) {
      // Third card clicked while two mismatched cards are showing: hide them now.
      clearTimeout(hideTimer);
      hideUp();
    }
    up.push(i);
    paint(i);
    if (up.length < 2) return;

    moves++;
    movesEl.textContent = moves;
    var a = deck[up[0]], b = deck[up[1]];
    if (a.face === b.face) {
      a.done = b.done = true;
      var pair = up;
      up = [];
      pair.forEach(paint);
      matched++;
      pairsEl.textContent = matched;
      setStatus('Match: ' + a.face.name + 's!');
      if (matched === FACES.length) finish();
    } else {
      locked = true;
      setStatus('No match. Try again.');
      hideTimer = setTimeout(hideUp, 900);
    }
  }

  function hideUp() {
    var was = up;
    up = [];
    locked = false;
    was.forEach(paint);
  }

  function finish() {
    var record = FG.saveBest('memory', moves, true);
    showBest();
    setStatus('All pairs found in ' + moves + ' moves!' + (record ? ' New best!' : ''), 'win');
  }

  document.getElementById('restart').addEventListener('click', newGame);
  newGame();
})();
