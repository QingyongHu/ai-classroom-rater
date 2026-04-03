/* ============================================
   Share Card Module — html2canvas
   ============================================ */

(function (App) {
  'use strict';

  function init() {
    document.getElementById('btn-share').addEventListener('click', onShare);
    document.getElementById('btn-download').addEventListener('click', download);
    document.getElementById('btn-close-share').addEventListener('click', function () {
      document.getElementById('page-share').classList.remove('active');
    });
  }

  function onShare() {
    var rating = App.State.currentRating;
    var video = App.getSelectedVideo();
    if (!rating || !video) return;

    buildShareCard(rating, video);
    document.getElementById('page-share').classList.add('active');
  }

  function buildShareCard(rating, video) {
    // Scores section
    var scoresEl = document.getElementById('share-card-scores');
    var gap = Math.abs(rating.userAvg - rating.aiAvg);
    scoresEl.innerHTML =
      '<div class="share-card-score-item">' +
        '<span class="share-card-score-label">您的评分</span>' +
        '<span class="share-card-score-value">' + rating.userAvg.toFixed(1) + '</span>' +
      '</div>' +
      '<div class="share-card-score-item">' +
        '<span class="share-card-score-label">AI评估</span>' +
        '<span class="share-card-score-value">' + rating.aiAvg.toFixed(1) + '</span>' +
      '</div>' +
      '<div class="share-card-score-item">' +
        '<span class="share-card-score-label">评课差异</span>' +
        '<span class="share-card-score-value">' + gap.toFixed(1) + '</span>' +
      '</div>';

    // Summary
    document.getElementById('share-card-summary').textContent = video.insights.summary;

    // Render small radar chart to a temporary offscreen canvas
    var tempCanvas = document.createElement('canvas');
    tempCanvas.id = 'share-radar-temp';
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    tempCanvas.style.cssText = 'position:absolute;left:-9999px;';
    document.body.appendChild(tempCanvas);

    var chart = App.RadarChart.renderSmall('share-radar-temp', rating.userScores, video);

    setTimeout(function () {
      var imgEl = document.getElementById('share-radar-img');
      if (chart) {
        imgEl.src = chart.toBase64Image();
      }
      // Clean up temp canvas
      var tc = document.getElementById('share-radar-temp');
      if (tc && tc.parentNode) tc.parentNode.removeChild(tc);
    }, 300);
  }

  function download() {
    var cardEl = document.getElementById('share-card');
    if (!cardEl) return;

    if (typeof html2canvas === 'undefined') {
      alert('请长按屏幕截图保存');
      return;
    }

    var btn = document.getElementById('btn-download');
    btn.textContent = '生成中...';
    btn.disabled = true;

    html2canvas(cardEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      width: 340,
      height: cardEl.scrollHeight
    }).then(function (canvas) {
      var link = document.createElement('a');
      link.download = 'AI评课报告_' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();

      btn.textContent = '保存图片';
      btn.disabled = false;
    }).catch(function (err) {
      console.error('Share card generation failed:', err);
      btn.textContent = '请截图保存';
      btn.disabled = false;
      setTimeout(function () {
        btn.textContent = '保存图片';
      }, 3000);
    });
  }

  App.ShareCard = {
    init: init
  };
})(window.App);
