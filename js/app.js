/* ============================================
   AI Classroom Rater — Core App Module
   Router, State, Storage, Init
   ============================================ */

window.App = window.App || {};

(function (App) {
  'use strict';

  // --- In-memory fallback when localStorage is blocked ---
  var memStore = {};

  function safeGetItem(key) {
    try { return localStorage.getItem(key); }
    catch (e) { return memStore[key] || null; }
  }

  function safeSetItem(key, value) {
    try { localStorage.setItem(key, value); }
    catch (e) { memStore[key] = value; }
  }

  // --- State ---
  var State = {
    currentPage: 'home',
    selectedVideoId: null,
    userScores: {},
    currentRating: null,
    videos: [],
    leaderboard: []
  };

  // --- Storage Keys ---
  var KEYS = {
    RESULTS: 'acr_user_results',
    LEADERBOARD: 'acr_leaderboard',
    COUNT: 'acr_total_count'
  };

  // --- StorageManager ---
  var StorageManager = {
    saveResults: function (results) {
      safeSetItem(KEYS.RESULTS, JSON.stringify(results));
    },
    getResults: function () {
      var d = safeGetItem(KEYS.RESULTS);
      if (!d) return [];
      try { return JSON.parse(d); }
      catch (e) { return []; }
    },
    addResult: function (rating) {
      var results = this.getResults();
      results.push(rating);
      this.saveResults(results);
      this.incrementCount();
    },
    incrementCount: function () {
      var count = this.getCount() + 1;
      safeSetItem(KEYS.COUNT, String(count));
      return count;
    },
    getCount: function () {
      var seedCount = State.leaderboard.length;
      var c = parseInt(safeGetItem(KEYS.COUNT), 10);
      return isNaN(c) ? seedCount : seedCount + c;
    },
    getLeaderboardData: function () {
      var seed = State.leaderboard;
      var userResults = this.getResults();
      var userEntries = userResults.map(function (r) {
        return {
          id: r.id,
          nickname: r.nickname,
          videoId: r.videoId,
          userAvgScore: r.userAvg,
          aiAvgScore: r.aiAvg,
          gap: Math.abs(r.userAvg - r.aiAvg),
          timestamp: r.timestamp
        };
      });
      return seed.concat(userEntries).sort(function (a, b) { return a.gap - b.gap; });
    }
  };

  // --- Router ---
  var Router = {
    init: function () {
      window.addEventListener('hashchange', onHashChange);
      onHashChange();
    },
    navigate: function (hash) {
      window.location.hash = '#' + hash;
    }
  };

  function onHashChange() {
    var hash = (window.location.hash || '#home').replace('#', '');
    var parts = hash.split('/');
    var route = parts[0];
    var param = parts[1] || null;

    switch (route) {
      case 'home':
        showPage('home');
        break;
      case 'select':
        showPage('select');
        renderVideoSelect();
        break;
      case 'play':
        if (param) {
          State.selectedVideoId = param;
          State.userScores = {};
          State.currentRating = null;
          showPage('play');
          if (App.VideoPlayer) App.VideoPlayer.load(param);
          if (App.Rating) App.Rating.render(param);
        }
        break;
      case 'analysis':
        showPage('analysis');
        runAnalysis();
        break;
      case 'result':
        showPage('result');
        renderResult();
        break;
      default:
        Router.navigate('home');
    }
  }

  function showPage(pageId) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }
    var el = document.getElementById('page-' + pageId);
    if (el) {
      el.classList.add('active');
      window.scrollTo(0, 0);
    }
    State.currentPage = pageId;
  }

  // --- Analysis Animation ---
  function runAnalysis() {
    // Reset the progress bar animation
    var bar = document.querySelector('.analysis-progress-bar');
    if (bar) {
      bar.style.animation = 'none';
      bar.offsetHeight; // trigger reflow
      bar.style.animation = 'progressFill 3s ease-out forwards';
    }

    var statusEl = document.getElementById('analysis-status');
    var messages = [
      '小AI测评员正在分析课堂互动...',
      '正在匹配SSTEW量表维度...',
      '小AI测评员正在生成评估报告...'
    ];
    var idx = 0;
    statusEl.textContent = messages[0];

    var interval = setInterval(function () {
      idx++;
      if (idx < messages.length) {
        statusEl.style.opacity = '0';
        setTimeout(function () {
          statusEl.textContent = messages[idx];
          statusEl.style.opacity = '0.9';
        }, 200);
      }
    }, 1000);

    setTimeout(function () {
      clearInterval(interval);
      Router.navigate('result');
    }, 3000);
  }

  // --- Render Result ---
  function renderResult() {
    var video = getSelectedVideo();
    if (!video) return;

    var scores = State.userScores;
    var dimensions = video.dimensions;

    // Calculate averages
    var userTotal = 0, aiTotal = 0;
    dimensions.forEach(function (d) {
      userTotal += (scores[d.id] || 0);
      aiTotal += d.aiScore;
    });
    var userAvg = userTotal / dimensions.length;
    var aiAvg = aiTotal / dimensions.length;

    // Save the rating (only once per submission)
    if (!State.currentRating) {
      var rating = {
        id: 'user_' + Date.now(),
        nickname: '访客 #' + Math.floor(Math.random() * 900 + 100),
        videoId: video.id,
        userScores: Object.assign({}, scores),
        userAvg: Math.round(userAvg * 10) / 10,
        aiAvg: Math.round(aiAvg * 10) / 10,
        timestamp: new Date().toISOString()
      };
      State.currentRating = rating;
      StorageManager.addResult(rating);
    }

    var currentRating = State.currentRating;

    // Display scores
    document.getElementById('result-user-avg').textContent = currentRating.userAvg.toFixed(1);
    document.getElementById('result-ai-avg').textContent = currentRating.aiAvg.toFixed(1);

    // Render radar chart
    if (App.RadarChart) {
      App.RadarChart.render('radar-chart', currentRating.userScores, video);
    }

    // Render insights
    var highlightsEl = document.getElementById('insights-highlights');
    var improvementsEl = document.getElementById('insights-improvements');
    var summaryEl = document.getElementById('insights-summary');

    highlightsEl.innerHTML = '';
    improvementsEl.innerHTML = '';

    video.insights.highlights.forEach(function (text) {
      highlightsEl.innerHTML += '<div class="insight-item"><span class="insight-icon">✅</span><span>' + escHtml(text) + '</span></div>';
    });

    video.insights.improvements.forEach(function (text) {
      improvementsEl.innerHTML += '<div class="insight-item"><span class="insight-icon">💡</span><span>' + escHtml(text) + '</span></div>';
    });

    summaryEl.textContent = video.insights.summary;
  }

  // --- Helpers ---
  function getSelectedVideo() {
    if (!State.selectedVideoId) return null;
    return State.videos.find(function (v) { return v.id === State.selectedVideoId; }) || null;
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Counter Animation ---
  function animateCounter(targetEl, targetNum) {
    var duration = 1200;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * targetNum);
      targetEl.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // --- Video Select Page ---
  function renderVideoSelect() {
    var container = document.getElementById('video-cards');
    container.innerHTML = '';

    var tagClasses = { '热门': 'tag-hot', '挑战': 'tag-challenge', '温馨': 'tag-warm' };

    State.videos.forEach(function (video) {
      var card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML =
        '<div class="video-card-emoji">' + video.emoji + '</div>' +
        '<div class="video-card-info">' +
          '<div class="video-card-title">' + escHtml(video.title) + '</div>' +
          '<div class="video-card-desc">' + escHtml(video.description) + '</div>' +
          '<span class="video-card-tag ' + (tagClasses[video.tag] || '') + '">' + escHtml(video.tag) + '</span>' +
        '</div>';

      card.addEventListener('click', function () {
        Router.navigate('play/' + video.id);
      });

      container.appendChild(card);
    });
  }

  // --- Data Loading ---
  function loadData() {
    return Promise.all([
      fetch('data/videos.json').then(function (r) { return r.json(); }),
      fetch('data/seed-leaderboard.json').then(function (r) { return r.json(); })
    ]).then(function (results) {
      State.videos = results[0].videos;
      State.leaderboard = results[1].entries;
    }).catch(function (err) {
      console.error('Failed to load data:', err);
    });
  }

  // --- Init ---
  function init() {
    loadData().then(function () {
      // Counter
      var count = StorageManager.getCount();
      animateCounter(document.getElementById('counter-num'), count);

      // Start button
      document.getElementById('btn-start').addEventListener('click', function () {
        Router.navigate('select');
      });

      // Back buttons
      var backBtns = document.querySelectorAll('.btn-back');
      backBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-go') || 'home';
          Router.navigate(target);
        });
      });

      // Result actions
      document.getElementById('btn-retry-video').addEventListener('click', function () {
        Router.navigate('select');
      });

      // Init sub-modules
      if (App.VideoPlayer) App.VideoPlayer.init();
      if (App.Rating) App.Rating.init();
      if (App.RadarChart) App.RadarChart.init();
      if (App.ShareCard) App.ShareCard.init();

      // Start router
      Router.init();
    });
  }

  // --- Expose ---
  App.State = State;
  App.StorageManager = StorageManager;
  App.Router = Router;
  App.showPage = showPage;
  App.getSelectedVideo = getSelectedVideo;
  App.animateCounter = animateCounter;

  document.addEventListener('DOMContentLoaded', init);
})(window.App);
