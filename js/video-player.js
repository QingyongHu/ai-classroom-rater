/* ============================================
   Video Player Module
   ============================================ */

(function (App) {
  'use strict';

  var videoEl, sourceEl, overlayEl, progressEl, errorEl, playBtn;

  function init() {
    videoEl = document.getElementById('main-video');
    sourceEl = document.getElementById('video-source');
    overlayEl = document.getElementById('video-overlay');
    progressEl = document.getElementById('video-progress');
    errorEl = document.getElementById('video-error');
    playBtn = document.getElementById('btn-play-overlay');

    // Play overlay button
    playBtn.addEventListener('click', togglePlay);

    // Video events
    videoEl.addEventListener('timeupdate', onTimeUpdate);
    videoEl.addEventListener('play', function () {
      overlayEl.classList.add('hidden');
    });
    videoEl.addEventListener('pause', function () {
      if (!videoEl.ended) overlayEl.classList.remove('hidden');
    });
    videoEl.addEventListener('ended', onEnded);
    videoEl.addEventListener('error', onError);

    // Click on video to toggle
    videoEl.addEventListener('click', togglePlay);

    // Retry button
    document.getElementById('btn-retry').addEventListener('click', function () {
      errorEl.style.display = 'none';
      videoEl.load();
    });
  }

  function load(videoId) {
    var video = App.State.videos.find(function (v) { return v.id === videoId; });
    if (!video) return;

    // Set title
    document.getElementById('play-title').textContent = video.emoji + ' ' + video.title;

    // Set video source
    sourceEl.src = video.videoSrc;
    videoEl.load();

    // Show overlay, hide error
    overlayEl.classList.remove('hidden');
    errorEl.style.display = 'none';
    progressEl.style.width = '0%';

    // Let the video display at its natural aspect ratio
    // The CSS uses width:100% + height:auto + object-fit:contain
    // The container has no forced aspect-ratio
  }

  function togglePlay() {
    if (videoEl.paused || videoEl.ended) {
      if (videoEl.ended) {
        videoEl.currentTime = 0;
      }
      videoEl.play().catch(function () {
        // Autoplay blocked — show overlay so user can try again
        overlayEl.classList.remove('hidden');
      });
    } else {
      videoEl.pause();
    }
  }

  function onTimeUpdate() {
    if (videoEl.duration) {
      var pct = (videoEl.currentTime / videoEl.duration) * 100;
      progressEl.style.width = pct + '%';
    }
  }

  function onEnded() {
    overlayEl.classList.remove('hidden');
    playBtn.textContent = '↻';
    progressEl.style.width = '100%';

    // Scroll to rating area
    var ratingArea = document.getElementById('rating-area');
    if (ratingArea) {
      setTimeout(function () {
        ratingArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }

  function onError() {
    errorEl.style.display = 'flex';
    overlayEl.classList.add('hidden');
  }

  App.VideoPlayer = {
    init: init,
    load: load
  };
})(window.App);
