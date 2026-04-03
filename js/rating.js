/* ============================================
   Rating Module — Star Rating + Submit
   ============================================ */

(function (App) {
  'use strict';

  function init() {
    document.getElementById('btn-submit').addEventListener('click', onSubmit);
  }

  function render(videoId) {
    var video = App.State.videos.find(function (v) { return v.id === videoId; });
    if (!video) return;

    App.State.userScores = {};
    var container = document.getElementById('rating-dimensions');
    container.innerHTML = '';

    video.dimensions.forEach(function (dim) {
      var row = document.createElement('div');
      row.className = 'rating-dimension';
      row.setAttribute('data-dimension', dim.id);

      var label = document.createElement('span');
      label.className = 'dimension-label';
      label.textContent = dim.label;

      var starGroup = document.createElement('div');
      starGroup.className = 'star-group';

      for (var i = 1; i <= 5; i++) {
        var star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★';
        star.setAttribute('data-value', String(i));
        star.setAttribute('data-dim', dim.id);
        // Use closure for click handler
        (function (s, val, dimId) {
          s.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            setRating(dimId, val, starGroup);
          });
        })(star, i, dim.id);
        starGroup.appendChild(star);
      }

      row.appendChild(label);
      row.appendChild(starGroup);
      container.appendChild(row);
    });

    // Reset submit button state
    var submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '提交我的评分';

    var hintEl = document.getElementById('rating-hint');
    hintEl.textContent = '请完成所有维度的评分';
    hintEl.classList.remove('hidden');
  }

  function setRating(dimId, value, starGroup) {
    // Toggle: clicking same value deselects it
    if (App.State.userScores[dimId] === value) {
      App.State.userScores[dimId] = 0;
      updateStars(starGroup, 0);
    } else {
      App.State.userScores[dimId] = value;
      updateStars(starGroup, value);
    }
    checkComplete();
  }

  function updateStars(starGroup, value) {
    var stars = starGroup.querySelectorAll('.star');
    for (var i = 0; i < stars.length; i++) {
      if (i < value) {
        stars[i].classList.add('filled');
      } else {
        stars[i].classList.remove('filled');
      }
    }
  }

  function checkComplete() {
    var video = App.State.videos.find(function (v) { return v.id === App.State.selectedVideoId; });
    if (!video) return;

    var allDone = video.dimensions.every(function (d) {
      return App.State.userScores[d.id] && App.State.userScores[d.id] > 0;
    });

    var submitBtn = document.getElementById('btn-submit');
    var hintEl = document.getElementById('rating-hint');

    submitBtn.disabled = !allDone;
    if (allDone) {
      hintEl.classList.add('hidden');
    } else {
      hintEl.textContent = '请完成所有维度的评分';
      hintEl.classList.remove('hidden');
    }
  }

  function onSubmit() {
    var video = App.State.videos.find(function (v) { return v.id === App.State.selectedVideoId; });
    if (!video) return;

    var allDone = video.dimensions.every(function (d) {
      return App.State.userScores[d.id] && App.State.userScores[d.id] > 0;
    });

    if (!allDone) {
      var btn = document.getElementById('btn-submit');
      btn.classList.add('shake');
      setTimeout(function () { btn.classList.remove('shake'); }, 500);
      return;
    }

    // Pause video if playing
    var vid = document.getElementById('main-video');
    if (vid && !vid.paused) vid.pause();

    // Navigate to analysis animation
    App.Router.navigate('analysis');
  }

  App.Rating = {
    init: init,
    render: render
  };
})(window.App);
