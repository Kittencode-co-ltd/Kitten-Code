/**
 * Kitten Code — hero title "scramble" effect (home page only).
 * Plays on load, on hover, and again after every language change, always
 * resolving to the current translation of hero.title_word1 / title_word2.
 */
(function () {
  'use strict';

  var CHARS = '!<>-_\\/[]{}—=+*^?#________';
  var COLORS = ['#ff4a17', '#ffffff'];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function TextScramble(el) {
    this.el = el;
    this.update = this.update.bind(this);
  }

  TextScramble.prototype.setText = function (newText) {
    var oldText = this.el.textContent;
    var length = Math.max(oldText.length, newText.length);
    this.queue = [];
    for (var i = 0; i < length; i++) {
      var start = Math.floor((i / length) * 60);
      this.queue.push({ from: oldText[i] || '', to: newText[i] || '', start: start, end: start + 180 });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    if (reduceMotion) { this.el.textContent = newText; return; }
    this.update();
  };

  TextScramble.prototype.update = function () {
    var out = document.createDocumentFragment();
    var plain = '';
    var complete = 0;
    for (var i = 0; i < this.queue.length; i++) {
      var q = this.queue[i];
      if (this.frame >= q.end) {
        complete++;
        plain += q.to;
      } else if (this.frame >= q.start) {
        if (!q.char || Math.random() < 0.28) {
          q.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          q.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
        if (plain) { out.appendChild(document.createTextNode(plain)); plain = ''; }
        var span = document.createElement('span');
        span.className = 'scramble-char';
        span.style.setProperty('--scramble-color', q.color);
        span.textContent = q.char;
        out.appendChild(span);
      } else {
        plain += q.from;
      }
    }
    if (plain) out.appendChild(document.createTextNode(plain));
    this.el.replaceChildren(out);
    if (complete < this.queue.length) {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  };

  function word(key, fallback) {
    var v = window.KCi18n && window.KCi18n.t(key);
    return typeof v === 'string' && v ? v : fallback;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var elA = document.getElementById('scramble-kitten');
    var elB = document.getElementById('scramble-code');
    if (!elA || !elB) return;

    var fxA = new TextScramble(elA);
    var fxB = new TextScramble(elB);
    var timer;

    function play(delayA, gap) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        fxA.setText(word('hero.title_word1', 'Kitten'));
        timer = setTimeout(function () { fxB.setText(word('hero.title_word2', 'Code')); }, gap);
      }, delayA);
    }

    play(800, 400);
    document.addEventListener('kc:langchange', function () { play(0, 200); });
    elA.parentElement.addEventListener('mouseenter', function () { play(0, 200); });
  });
})();
