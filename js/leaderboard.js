/* ============================================
   Leaderboard Module
   Used by both index.html and leaderboard.html
   ============================================ */

(function (App) {
  'use strict';

  function init() {
    // Nothing to init in index.html context for now
  }

  function getData() {
    if (App.StorageManager) {
      return App.StorageManager.getLeaderboardData();
    }
    return App.State.leaderboard || [];
  }

  function renderPodium(containerEl) {
    var data = getData();
    var top3 = data.slice(0, 3);
    containerEl.innerHTML = '';

    var medals = ['🥇', '🥈', '🥉'];
    var rankClasses = ['rank-1', 'rank-2', 'rank-3'];
    // Display order: 2nd, 1st, 3rd (podium style)
    var order = [1, 0, 2];

    order.forEach(function (idx) {
      if (!top3[idx]) return;
      var entry = top3[idx];
      var card = document.createElement('div');
      card.className = 'lb-podium-card ' + rankClasses[idx];
      card.innerHTML =
        '<div class="lb-rank-badge">' + medals[idx] + '</div>' +
        '<div class="lb-podium-name">' + escHtml(entry.nickname) + '</div>' +
        '<div class="lb-podium-score">差异 ' + entry.gap.toFixed(2) + '</div>';
      containerEl.appendChild(card);
    });
  }

  function renderList(containerEl, limit) {
    var data = getData();
    var display = limit ? data.slice(0, limit) : data;
    containerEl.innerHTML = '';

    display.forEach(function (entry, index) {
      var row = document.createElement('div');
      row.className = 'lb-row';
      var rankLabel = index + 1;
      if (index === 0) rankLabel = '🥇';
      else if (index === 1) rankLabel = '🥈';
      else if (index === 2) rankLabel = '🥉';

      row.innerHTML =
        '<span class="lb-row-rank">' + rankLabel + '</span>' +
        '<span class="lb-row-name">' + escHtml(entry.nickname) + '</span>' +
        '<span class="lb-row-score">评分 ' + entry.userAvgScore.toFixed(1) + '</span>' +
        '<span class="lb-row-gap">差 ' + entry.gap.toFixed(2) + '</span>';
      containerEl.appendChild(row);
    });
  }

  function renderStats(countEl, avgGapEl) {
    var data = getData();
    var count = data.length;
    if (countEl) countEl.textContent = count;

    if (avgGapEl && data.length > 0) {
      var totalGap = data.reduce(function (sum, e) { return sum + e.gap; }, 0);
      avgGapEl.textContent = (totalGap / data.length).toFixed(1);
    }
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  App.Leaderboard = {
    init: init,
    getData: getData,
    renderPodium: renderPodium,
    renderList: renderList,
    renderStats: renderStats
  };
})(window.App);
