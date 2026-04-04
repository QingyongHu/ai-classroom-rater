/* ============================================
   Admin Panel Module — #/admin
   Edit video data, preview, export/import
   ============================================ */

(function (App) {
  'use strict';

  var CUSTOM_KEY = 'acr_custom_videos';
  var editingVideoId = null;
  var previewChart = null;

  function safeGet(key) {
    try { return localStorage.getItem(key); }
    catch (e) { return null; }
  }

  function safeSet(key, val) {
    try { localStorage.setItem(key, val); }
    catch (e) { /* noop */ }
  }

  function safeRemove(key) {
    try { localStorage.removeItem(key); }
    catch (e) { /* noop */ }
  }

  function getCustomVideos() {
    var raw = safeGet(CUSTOM_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); }
    catch (e) { return {}; }
  }

  function saveCustomVideos(customVideos) {
    safeSet(CUSTOM_KEY, JSON.stringify(customVideos));
  }

  function getEffectiveVideo(videoId) {
    var custom = getCustomVideos();
    if (custom[videoId]) {
      var base = App.State.videos.find(function (v) { return v.id === videoId; });
      if (base) {
        var merged = JSON.parse(JSON.stringify(base));
        var c = custom[videoId];
        if (c.title !== undefined) merged.title = c.title;
        if (c.description !== undefined) merged.description = c.description;
        if (c.tag !== undefined) merged.tag = c.tag;
        if (c.emoji !== undefined) merged.emoji = c.emoji;
        if (c.subtitles !== undefined) merged.subtitles = c.subtitles;
        if (c.dimensions !== undefined) merged.dimensions = c.dimensions;
        if (c.insights !== undefined) merged.insights = c.insights;
        return merged;
      }
    }
    return App.State.videos.find(function (v) { return v.id === videoId; }) || null;
  }

  function init() {
    // Called on hashchange to #admin
  }

  function render() {
    var container = document.getElementById('admin-content');
    if (!container) return;

    var videos = App.State.videos;
    editingVideoId = editingVideoId || (videos.length > 0 ? videos[0].id : null);

    container.innerHTML =
      '<div class="admin-layout">' +
        '<div class="admin-sidebar" id="admin-sidebar"></div>' +
        '<div class="admin-main" id="admin-main"></div>' +
      '</div>';

    renderSidebar();
    renderMain();
  }

  function renderSidebar() {
    var sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) return;

    var videos = App.State.videos;
    var custom = getCustomVideos();

    var html =
      '<div class="admin-sidebar-header">' +
        '<h2>视频管理</h2>' +
        '<div class="admin-sidebar-actions">' +
          '<button class="admin-btn admin-btn-sm" id="admin-export">导出JSON</button>' +
          '<label class="admin-btn admin-btn-sm admin-btn-import-label" for="admin-import">导入JSON</label>' +
          '<input type="file" id="admin-import" accept=".json" style="display:none">' +
        '</div>' +
      '</div>' +
      '<div class="admin-sidebar-links">' +
        '<a href="index.html" target="_blank" class="admin-btn admin-btn-sm">在新标签页打开前台</a>' +
      '</div>' +
      '<ul class="admin-video-list">';

    videos.forEach(function (v) {
      var isCustom = !!custom[v.id];
      var isActive = v.id === editingVideoId;
      html +=
        '<li class="admin-video-item' + (isActive ? ' active' : '') + '" data-id="' + v.id + '">' +
          '<span class="admin-video-emoji">' + v.emoji + '</span>' +
          '<span class="admin-video-id">' + v.id + '</span>' +
          '<span class="admin-video-title">' + escHtml(v.title) + '</span>' +
          (isCustom ? '<span class="admin-badge-custom">已编辑</span>' : '') +
        '</li>';
    });

    html += '</ul>';
    sidebar.innerHTML = html;

    // Bind clicks
    var items = sidebar.querySelectorAll('.admin-video-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        editingVideoId = item.getAttribute('data-id');
        renderSidebar();
        renderMain();
      });
    });

    // Export
    document.getElementById('admin-export').addEventListener('click', exportJSON);

    // Import
    document.getElementById('admin-import').addEventListener('change', importJSON);
  }

  function renderMain() {
    var main = document.getElementById('admin-main');
    if (!main) return;

    if (!editingVideoId) {
      main.innerHTML = '<div class="admin-empty">请从左侧选择一个视频进行编辑</div>';
      return;
    }

    var video = getEffectiveVideo(editingVideoId);
    if (!video) {
      main.innerHTML = '<div class="admin-empty">视频数据未找到</div>';
      return;
    }

    var html =
      '<div class="admin-form-scroll">' +
        '<div class="admin-form">' +

          // Basic info
          '<div class="admin-section">' +
            '<h3>基本信息</h3>' +
            '<div class="admin-field">' +
              '<label>title</label>' +
              '<input type="text" data-field="title" value="' + escAttr(video.title) + '">' +
            '</div>' +
            '<div class="admin-field">' +
              '<label>description</label>' +
              '<input type="text" data-field="description" value="' + escAttr(video.description) + '">' +
            '</div>' +
            '<div class="admin-field-row">' +
              '<div class="admin-field">' +
                '<label>tag</label>' +
                '<input type="text" data-field="tag" value="' + escAttr(video.tag) + '" style="width:120px">' +
              '</div>' +
              '<div class="admin-field">' +
                '<label>emoji</label>' +
                '<input type="text" data-field="emoji" value="' + escAttr(video.emoji) + '" style="width:80px">' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Subtitles
          '<div class="admin-section">' +
            '<h3>字幕 <button class="admin-btn admin-btn-sm admin-btn-add" id="admin-add-subtitle">+ 添加</button></h3>' +
            '<div id="admin-subtitles">' + renderSubtitles(video.subtitles) + '</div>' +
          '</div>' +

          // Dimensions
          '<div class="admin-section">' +
            '<h3>打分维度</h3>' +
            '<div id="admin-dimensions">' + renderDimensions(video.dimensions) + '</div>' +
          '</div>' +

          // Insights
          '<div class="admin-section">' +
            '<h3>洞察 - 亮点 <button class="admin-btn admin-btn-sm admin-btn-add" id="admin-add-highlight">+ 添加</button></h3>' +
            '<div id="admin-highlights">' + renderArrayItems(video.insights.highlights, 'highlight') + '</div>' +
          '</div>' +

          '<div class="admin-section">' +
            '<h3>洞察 - 改进 <button class="admin-btn admin-btn-sm admin-btn-add" id="admin-add-improvement">+ 添加</button></h3>' +
            '<div id="admin-improvements">' + renderArrayItems(video.insights.improvements, 'improvement') + '</div>' +
          '</div>' +

          '<div class="admin-section">' +
            '<h3>洞察 - 总结</h3>' +
            '<div class="admin-field">' +
              '<textarea data-field="summary" rows="5">' + escHtml(video.insights.summary) + '</textarea>' +
            '</div>' +
          '</div>' +

          // Actions
          '<div class="admin-actions">' +
            '<button class="admin-btn admin-btn-primary" id="admin-save">保存修改</button>' +
            '<button class="admin-btn admin-btn-danger" id="admin-reset">恢复默认</button>' +
          '</div>' +

        '</div>' +

        // Preview
        '<div class="admin-preview">' +
          '<h3>结果页预览</h3>' +
          '<div class="admin-preview-card">' +
            '<div class="radar-container" style="max-width:300px;margin:0 auto">' +
              '<canvas id="admin-radar-chart"></canvas>' +
            '</div>' +
            '<div id="admin-preview-insights" class="admin-preview-insights"></div>' +
          '</div>' +
        '</div>' +

      '</div>';

    main.innerHTML = html;

    // Bind events
    bindFormEvents();
    renderPreview(video);
  }

  function renderSubtitles(subtitles) {
    var html = '';
    subtitles.forEach(function (sub, i) {
      html +=
        '<div class="admin-subtitle-row" data-index="' + i + '">' +
          '<div class="admin-field-row">' +
            '<div class="admin-field"><label>start</label><input type="number" data-array="subtitles" data-index="' + i + '" data-key="start" value="' + sub.start + '" style="width:70px" min="0"></div>' +
            '<div class="admin-field"><label>end</label><input type="number" data-array="subtitles" data-index="' + i + '" data-key="end" value="' + sub.end + '" style="width:70px" min="0"></div>' +
          '</div>' +
          '<div class="admin-field"><label>text</label><input type="text" data-array="subtitles" data-index="' + i + '" data-key="text" value="' + escAttr(sub.text) + '"></div>' +
          '<button class="admin-btn admin-btn-xs admin-btn-danger" data-remove="subtitles" data-index="' + i + '">删除</button>' +
        '</div>';
    });
    return html;
  }

  function renderDimensions(dimensions) {
    var html = '';
    dimensions.forEach(function (dim, i) {
      html +=
        '<div class="admin-dimension-row" data-index="' + i + '">' +
          '<div class="admin-field-row">' +
            '<div class="admin-field"><label>id</label><input type="text" data-array="dimensions" data-index="' + i + '" data-key="id" value="' + escAttr(dim.id) + '" style="width:100px"></div>' +
            '<div class="admin-field admin-field-flex">' +
              '<label>aiScore (' + dim.aiScore.toFixed(1) + ')</label>' +
              '<div class="admin-slider-row">' +
                '<input type="range" min="0" max="5" step="0.5" value="' + dim.aiScore + '" data-array="dimensions" data-index="' + i + '" data-key="aiScore" class="admin-range">' +
                '<input type="number" min="0" max="5" step="0.5" value="' + dim.aiScore + '" data-array="dimensions" data-index="' + i + '" data-key="aiScore" class="admin-num-input" style="width:65px">' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="admin-field"><label>label（用户问题）</label><input type="text" data-array="dimensions" data-index="' + i + '" data-key="label" value="' + escAttr(dim.label) + '"></div>' +
          '<div class="admin-field"><label>proLabel（专业名称）</label><input type="text" data-array="dimensions" data-index="' + i + '" data-key="proLabel" value="' + escAttr(dim.proLabel) + '"></div>' +
        '</div>';
    });
    return html;
  }

  function renderArrayItems(items, prefix) {
    var html = '';
    items.forEach(function (text, i) {
      html +=
        '<div class="admin-array-item" data-prefix="' + prefix + '" data-index="' + i + '">' +
          '<textarea data-array="' + prefix + '" data-index="' + i + '" rows="3">' + escHtml(text) + '</textarea>' +
          '<div class="admin-array-item-actions">' +
            '<button class="admin-btn admin-btn-xs" data-move-up="' + prefix + '" data-index="' + i + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button class="admin-btn admin-btn-xs" data-move-down="' + prefix + '" data-index="' + i + '"' + (i === items.length - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button class="admin-btn admin-btn-xs admin-btn-danger" data-remove="' + prefix + '" data-index="' + i + '">删除</button>' +
          '</div>' +
        '</div>';
    });
    return html;
  }

  function bindFormEvents() {
    // Save
    document.getElementById('admin-save').addEventListener('click', function () {
      var data = collectFormData();
      if (data) {
        var custom = getCustomVideos();
        custom[editingVideoId] = data;
        saveCustomVideos(custom);
        showSaveFeedback();
        renderSidebar();
        renderPreview(data);
      }
    });

    // Reset
    document.getElementById('admin-reset').addEventListener('click', function () {
      if (confirm('确定恢复该视频的默认数据？此操作不可撤销。')) {
        var custom = getCustomVideos();
        delete custom[editingVideoId];
        saveCustomVideos(custom);
        renderSidebar();
        renderMain();
      }
    });

    // Add subtitle
    var addSubBtn = document.getElementById('admin-add-subtitle');
    if (addSubBtn) addSubBtn.addEventListener('click', function () {
      addArrayItem('subtitles', { start: 0, end: 3, text: '' });
    });

    // Add highlight
    var addHiBtn = document.getElementById('admin-add-highlight');
    if (addHiBtn) addHiBtn.addEventListener('click', function () {
      addArrayItem('highlight', '');
    });

    // Add improvement
    var addImBtn = document.getElementById('admin-add-improvement');
    if (addImBtn) addImBtn.addEventListener('click', function () {
      addArrayItem('improvement', '');
    });

    // Bind all dynamic buttons via delegation
    var main = document.getElementById('admin-main');
    main.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;

      var removeTarget = btn.getAttribute('data-remove');
      var moveUp = btn.getAttribute('data-move-up');
      var moveDown = btn.getAttribute('data-move-down');

      if (removeTarget) {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        removeArrayItem(removeTarget, idx);
      } else if (moveUp) {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        moveArrayItem(moveUp, idx, -1);
      } else if (moveDown) {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        moveArrayItem(moveDown, idx, 1);
      }
    });

    // Sync range slider and number input for aiScore
    main.addEventListener('input', function (e) {
      if (e.target.classList.contains('admin-range')) {
        var numInput = e.target.parentElement.querySelector('.admin-num-input');
        if (numInput) numInput.value = e.target.value;
        var label = e.target.closest('.admin-field');
        if (label) {
          var lbl = label.querySelector('label');
          if (lbl) lbl.textContent = 'aiScore (' + parseFloat(e.target.value).toFixed(1) + ')';
        }
      }
      if (e.target.classList.contains('admin-num-input')) {
        var rangeInput = e.target.parentElement.querySelector('.admin-range');
        if (rangeInput) rangeInput.value = e.target.value;
        var label = e.target.closest('.admin-field');
        if (label) {
          var lbl = label.querySelector('label');
          if (lbl) lbl.textContent = 'aiScore (' + parseFloat(e.target.value).toFixed(1) + ')';
        }
      }
    });
  }

  function collectFormData() {
    var video = getEffectiveVideo(editingVideoId);
    if (!video) return null;

    // Deep clone
    var data = JSON.parse(JSON.stringify(video));

    // Basic fields
    var titleInput = document.querySelector('[data-field="title"]');
    if (titleInput) data.title = titleInput.value;
    var descInput = document.querySelector('[data-field="description"]');
    if (descInput) data.description = descInput.value;
    var tagInput = document.querySelector('[data-field="tag"]');
    if (tagInput) data.tag = tagInput.value;
    var emojiInput = document.querySelector('[data-field="emoji"]');
    if (emojiInput) data.emoji = emojiInput.value;

    // Subtitles
    data.subtitles = collectArrayData('subtitles', function (i) {
      return {
        start: parseFloat(getArrayInput('subtitles', i, 'start')) || 0,
        end: parseFloat(getArrayInput('subtitles', i, 'end')) || 0,
        text: getArrayInput('subtitles', i, 'text') || ''
      };
    });

    // Dimensions
    data.dimensions = collectArrayData('dimensions', function (i) {
      return {
        id: getArrayInput('dimensions', i, 'id') || ('d' + i),
        label: getArrayInput('dimensions', i, 'label') || '',
        proLabel: getArrayInput('dimensions', i, 'proLabel') || '',
        aiScore: parseFloat(getArrayInput('dimensions', i, 'aiScore')) || 0
      };
    });

    // Highlights
    data.insights.highlights = collectArrayData('highlight', function (i) {
      return getArrayTextarea('highlight', i) || '';
    });

    // Improvements
    data.insights.improvements = collectArrayData('improvement', function (i) {
      return getArrayTextarea('improvement', i) || '';
    });

    // Summary
    var summaryEl = document.querySelector('[data-field="summary"]');
    if (summaryEl) data.insights.summary = summaryEl.value;

    return data;
  }

  function collectArrayData(arrayName, factory) {
    var inputs = document.querySelectorAll('[data-array="' + arrayName + '"]');
    // Find distinct indices
    var indexSet = {};
    inputs.forEach(function (el) {
      indexSet[el.getAttribute('data-index')] = true;
    });
    var indices = Object.keys(indexSet).sort(function (a, b) {
      return parseInt(a, 10) - parseInt(b, 10);
    });
    return indices.map(function (i) { return factory(i); });
  }

  function getArrayInput(arrayName, index, key) {
    var el = document.querySelector('[data-array="' + arrayName + '"][data-index="' + index + '"][data-key="' + key + '"]');
    return el ? el.value : '';
  }

  function getArrayTextarea(arrayName, index) {
    var el = document.querySelector('textarea[data-array="' + arrayName + '"][data-index="' + index + '"]');
    return el ? el.value : '';
  }

  function addArrayItem(arrayName, template) {
    var data = collectFormData();
    if (!data) return;

    if (arrayName === 'subtitles') {
      data.subtitles.push(template);
      var container = document.getElementById('admin-subtitles');
      container.innerHTML = renderSubtitles(data.subtitles);
    } else if (arrayName === 'highlight') {
      data.insights.highlights.push('');
      var container = document.getElementById('admin-highlights');
      container.innerHTML = renderArrayItems(data.insights.highlights, 'highlight');
    } else if (arrayName === 'improvement') {
      data.insights.improvements.push('');
      var container = document.getElementById('admin-improvements');
      container.innerHTML = renderArrayItems(data.insights.improvements, 'improvement');
    }
  }

  function removeArrayItem(arrayName, index) {
    var data = collectFormData();
    if (!data) return;

    if (arrayName === 'subtitles') {
      data.subtitles.splice(index, 1);
      document.getElementById('admin-subtitles').innerHTML = renderSubtitles(data.subtitles);
    } else if (arrayName === 'highlight') {
      data.insights.highlights.splice(index, 1);
      document.getElementById('admin-highlights').innerHTML = renderArrayItems(data.insights.highlights, 'highlight');
    } else if (arrayName === 'improvement') {
      data.insights.improvements.splice(index, 1);
      document.getElementById('admin-improvements').innerHTML = renderArrayItems(data.insights.improvements, 'improvement');
    }
  }

  function moveArrayItem(arrayName, index, direction) {
    var data = collectFormData();
    if (!data) return;

    var arr;
    if (arrayName === 'highlight') arr = data.insights.highlights;
    else if (arrayName === 'improvement') arr = data.insights.improvements;
    else return;

    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return;

    var temp = arr[index];
    arr[index] = arr[newIndex];
    arr[newIndex] = temp;

    var containerId = arrayName === 'highlight' ? 'admin-highlights' : 'admin-improvements';
    document.getElementById(containerId).innerHTML = renderArrayItems(arr, arrayName);
  }

  function renderPreview(video) {
    if (!video || !video.dimensions) return;

    // Radar chart
    if (typeof Chart === 'undefined') return;

    var canvas = document.getElementById('admin-radar-chart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    if (previewChart) {
      previewChart.destroy();
      previewChart = null;
    }

    var labels = video.dimensions.map(function (d) { return d.proLabel; });
    var aiData = video.dimensions.map(function (d) { return d.aiScore; });
    // Simulate user scores 1 point higher
    var userData = video.dimensions.map(function (d) { return Math.min(5, d.aiScore + 1.5); });

    previewChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '模拟用户评分',
            data: userData,
            borderColor: '#5B2C86',
            backgroundColor: 'rgba(91, 44, 134, 0.12)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#5B2C86'
          },
          {
            label: 'AI评估',
            data: aiData,
            borderColor: '#D4A843',
            backgroundColor: 'rgba(212, 168, 67, 0.12)',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 4,
            pointBackgroundColor: '#D4A843'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 5,
            ticks: { stepSize: 1, display: false },
            grid: { color: 'rgba(0,0,0,0.08)' },
            angleLines: { color: 'rgba(0,0,0,0.08)' },
            pointLabels: { font: { size: 11, weight: '600' }, color: '#333' }
          }
        },
        plugins: { legend: { display: false } },
        animation: { duration: 400 }
      }
    });

    // Insights preview
    var insightsEl = document.getElementById('admin-preview-insights');
    if (insightsEl && video.insights) {
      var insightsHtml = '';
      video.insights.highlights.forEach(function (h) {
        insightsHtml += '<div class="insight-item"><span class="insight-icon">✅</span><span>' + escHtml(h) + '</span></div>';
      });
      video.insights.improvements.forEach(function (im) {
        insightsHtml += '<div class="insight-item"><span class="insight-icon">💡</span><span>' + escHtml(im) + '</span></div>';
      });
      insightsHtml += '<p class="insights-summary">' + escHtml(video.insights.summary) + '</p>';
      insightsEl.innerHTML = insightsHtml;
    }
  }

  function exportJSON() {
    var custom = getCustomVideos();
    var blob = new Blob([JSON.stringify(custom, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.download = 'acr_custom_videos_' + new Date().toISOString().slice(0, 10) + '.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importJSON(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (typeof data !== 'object' || Array.isArray(data)) {
          alert('JSON 格式不正确，应为对象 { "v1": {...}, "v2": {...} }');
          return;
        }
        saveCustomVideos(data);
        alert('导入成功！已更新 ' + Object.keys(data).length + ' 个视频的配置。');
        renderSidebar();
        renderMain();
      } catch (err) {
        alert('JSON 解析失败：' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function showSaveFeedback() {
    var btn = document.getElementById('admin-save');
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = '已保存 ✓';
    btn.style.background = '#27AE60';
    setTimeout(function () {
      btn.textContent = orig;
      btn.style.background = '';
    }, 1500);
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Expose
  App.Admin = {
    init: init,
    render: render,
    getCustomVideos: getCustomVideos,
    getEffectiveVideo: getEffectiveVideo
  };
})(window.App);
