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
        '<span class="share-card-score-label">测评差异</span>' +
        '<span class="share-card-score-value">' + gap.toFixed(1) + '</span>' +
      '</div>';

    // Summary
    document.getElementById('share-card-summary').textContent = video.insights.summary;

    // QR code placeholder
    var qrcodeEl = document.getElementById('share-card-qrcode');
    qrcodeEl.innerHTML = '';
    var qrImg = new Image();
    qrImg.onload = function () {
      qrcodeEl.appendChild(qrImg);
    };
    qrImg.onerror = function () {
      // Draw canvas placeholder
      var c = document.createElement('canvas');
      c.width = 160;
      c.height = 160;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 160, 160);
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 152, 152);
      // Simulate QR pattern
      ctx.fillStyle = '#333333';
      var size = 8;
      for (var row = 0; row < 16; row++) {
        for (var col = 0; col < 16; col++) {
          if (Math.random() > 0.5 || (row < 4 && col < 4) || (row < 4 && col > 11) || (row > 11 && col < 4)) {
            ctx.fillRect(8 + col * size, 8 + row * size, size - 1, size - 1);
          }
        }
      }
      ctx.fillStyle = '#666666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('扫码挑战', 80, 155);
      c.style.width = '80px';
      c.style.height = '80px';
      qrcodeEl.appendChild(c);
    };
    qrImg.src = 'assets/wechat-qr-code.png';

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
      canvas.toBlob(function (blob) {
        if (!blob) {
          fallbackDownload(canvas);
          return;
        }
        try {
          // Try native share first (mobile)
          if (navigator.share && navigator.canShare) {
            var file = new File([blob], 'AI测评报告.png', { type: 'image/png' });
            var shareData = { files: [file] };
            if (navigator.canShare(shareData)) {
              navigator.share(shareData).then(function () {
                btn.textContent = '保存图片';
                btn.disabled = false;
              }).catch(function () {
                fallbackDownload(canvas);
              });
              return;
            }
          }
        } catch (e) {
          // navigator.share not available, fall through
        }
        fallbackDownload(canvas);
      }, 'image/png');
    }).catch(function (err) {
      console.error('Share card generation failed:', err);
      btn.textContent = '请截图保存';
      btn.disabled = false;
      setTimeout(function () {
        btn.textContent = '保存图片';
      }, 3000);
    });
  }

  function fallbackDownload(canvas) {
    var btn = document.getElementById('btn-download');
    try {
      // Try blob URL download
      canvas.toBlob(function (blob) {
        if (!blob) {
          linkDownload(canvas);
          return;
        }
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.download = 'AI测评报告_' + Date.now() + '.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        btn.textContent = '保存图片';
        btn.disabled = false;
      }, 'image/png');
    } catch (e) {
      linkDownload(canvas);
    }
  }

  function linkDownload(canvas) {
    var btn = document.getElementById('btn-download');
    var dataUrl = canvas.toDataURL('image/png');
    var link = document.createElement('a');
    link.download = 'AI测评报告_' + Date.now() + '.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    btn.textContent = '保存图片';
    btn.disabled = false;
  }

  App.ShareCard = {
    init: init
  };
})(window.App);
