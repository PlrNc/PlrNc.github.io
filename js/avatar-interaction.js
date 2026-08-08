/* Avatar hover interaction: constant rotation + elastic scale with smooth resume */
(function () {
  'use strict';

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function buildScaleFrames() {
    var peak = randomBetween(1.5, 1.7);
    return [
      [0.0, 1.0],
      [0.12, peak],
      [0.28, 1 + (peak - 1) * 0.55],
      [0.44, 1 + (peak - 1) * 0.82],
      [0.62, 1 + (peak - 1) * 0.62],
      [0.8, 1 + (peak - 1) * 0.74],
      [1.0, 1.0]
    ];
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBack(t) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function scaleAt(phase, frames) {
    var t = phase % 1;
    for (var i = 1; i < frames.length; i++) {
      var prev = frames[i - 1];
      var next = frames[i];
      if (t <= next[0]) {
        var local = (t - prev[0]) / (next[0] - prev[0]);
        var eased = easeOutBack(local);
        return prev[1] + (next[1] - prev[1]) * eased;
      }
    }
    return frames[frames.length - 1][1];
  }

  var states = [];

  function initAvatar(el) {
    var state = {
      el: el,
      angle: 0,
      phase: Math.random(),
      hovered: false,
      returning: false,
      returnStart: 0,
      fromAngle: 0,
      fromPhase: 0,
      rotateMs: randomBetween(1800, 2200),
      scalePeriodMs: randomBetween(750, 950),
      returnMs: randomBetween(600, 800),
      frames: buildScaleFrames()
    };
    el.__avatarState = state;

    el.addEventListener('mouseenter', function () {
      state.hovered = true;
      state.returning = false;
    });

    el.addEventListener('mouseleave', function () {
      state.hovered = false;
      state.returning = true;
      state.returnStart = performance.now();
      state.fromAngle = state.angle;
      state.fromPhase = state.phase;
    });

    return state;
  }

  function bindAvatars() {
    var els = document.querySelectorAll('.avatar-img');
    for (var i = 0; i < els.length; i++) {
      if (!els[i].__avatarState) {
        states.push(initAvatar(els[i]));
      }
    }
  }

  function tick(now) {
    var dt = Math.min(100, now - (tick.last || now));
    tick.last = now;

    for (var i = states.length - 1; i >= 0; i--) {
      var s = states[i];
      if (!document.body.contains(s.el)) {
        states.splice(i, 1);
        continue;
      }

      if (s.hovered) {
        s.angle = (s.angle + (dt / s.rotateMs) * 360) % 360;
        s.phase = (s.phase + dt / s.scalePeriodMs) % 1;
        s.el.style.transform = 'rotate(' + s.angle.toFixed(3) + 'deg) scale(' + scaleAt(s.phase, s.frames).toFixed(4) + ')';
      } else if (s.returning) {
        var progress = Math.min(1, (now - s.returnStart) / s.returnMs);
        var eased = easeOutCubic(progress);
        s.angle = s.fromAngle * (1 - eased);
        s.phase = s.fromPhase * (1 - eased);
        s.el.style.transform = 'rotate(' + s.angle.toFixed(3) + 'deg) scale(' + scaleAt(s.phase, s.frames).toFixed(4) + ')';
        if (progress >= 1) {
          s.angle = 0;
          s.phase = 0;
          s.returning = false;
          s.el.style.transform = 'rotate(0deg) scale(1)';
        }
      }
    }

    requestAnimationFrame(tick);
  }

  bindAvatars();
  document.addEventListener('DOMContentLoaded', bindAvatars);
  window.addEventListener('pjax:complete', bindAvatars);
  requestAnimationFrame(tick);
})();
