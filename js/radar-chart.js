/* ============================================
   Radar Chart Module — Chart.js Wrapper
   ============================================ */

(function (App) {
  'use strict';

  var mainChart = null;
  var smallChart = null;

  function init() {
    // Chart.js is loaded from local file
  }

  function render(canvasId, userScores, video) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, skipping radar chart');
      return null;
    }

    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');

    // Destroy previous main chart
    if (mainChart) {
      mainChart.destroy();
      mainChart = null;
    }

    var labels = video.dimensions.map(function (d) { return d.proLabel; });
    var userData = video.dimensions.map(function (d) { return userScores[d.id] || 0; });
    var aiData = video.dimensions.map(function (d) { return d.aiScore; });

    mainChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '您的评分',
            data: userData,
            borderColor: '#5B2C86',
            backgroundColor: 'rgba(91, 44, 134, 0.12)',
            borderWidth: 3,
            pointRadius: 6,
            pointBackgroundColor: '#5B2C86',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 8,
            pointHoverBorderWidth: 2
          },
          {
            label: 'AI评估',
            data: aiData,
            borderColor: '#D4A843',
            backgroundColor: 'rgba(212, 168, 67, 0.12)',
            borderWidth: 3,
            borderDash: [6, 4],
            pointRadius: 6,
            pointBackgroundColor: '#D4A843',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 8,
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
              display: false,
              backdropColor: 'transparent'
            },
            grid: {
              color: 'rgba(0,0,0,0.05)',
              lineWidth: 1
            },
            angleLines: {
              color: 'rgba(0,0,0,0.05)',
              lineWidth: 1
            },
            pointLabels: {
              font: {
                size: 14,
                weight: '600',
                family: "'PingFang SC', 'Microsoft YaHei', sans-serif"
              },
              color: '#333',
              padding: 12
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(26, 10, 46, 0.9)',
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ': ' + ctx.raw.toFixed(1) + ' 分';
              }
            }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeInOutQuart'
        }
      }
    });

    return mainChart;
  }

  function renderSmall(canvasId, userScores, video) {
    if (typeof Chart === 'undefined') return null;

    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');

    if (smallChart) {
      smallChart.destroy();
      smallChart = null;
    }

    var labels = video.dimensions.map(function (d) { return d.proLabel; });
    var userData = video.dimensions.map(function (d) { return userScores[d.id] || 0; });
    var aiData = video.dimensions.map(function (d) { return d.aiScore; });

    smallChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '您的评分',
            data: userData,
            borderColor: 'rgba(255,255,255,0.9)',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(255,255,255,0.9)'
          },
          {
            label: 'AI评估',
            data: aiData,
            borderColor: '#D4A843',
            backgroundColor: 'rgba(212, 168, 67, 0.2)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#D4A843'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 5,
            ticks: { display: false },
            grid: { color: 'rgba(255,255,255,0.15)' },
            angleLines: { color: 'rgba(255,255,255,0.15)' },
            pointLabels: {
              font: { size: 10 },
              color: 'rgba(255,255,255,0.8)'
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: { duration: 0 }
      }
    });

    return smallChart;
  }

  function destroyMain() {
    if (mainChart) {
      mainChart.destroy();
      mainChart = null;
    }
  }

  App.RadarChart = {
    init: init,
    render: render,
    renderSmall: renderSmall,
    destroy: destroyMain
  };
})(window.App);
