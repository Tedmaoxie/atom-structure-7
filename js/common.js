/* =====================================================================
   common.js —— 公共工具
   1. 舞台缩放：固定 1920×1080 设计稿，整体等比缩放到当前窗口
   2. 本地存储：每个任务一份记录，刷新不丢失
   3. 周期表：任务一至四统一使用同一套规整网格
   4. 小提示条（不弹窗打断）
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- 舞台自适应 ---------------- */
  function fitStage() {
    var stage = document.getElementById('stage');
    if (stage) {
      var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    }

    // 记录面板同样是固定尺寸，按窗口大小整体缩放，iPad 上也能看全
    var sheet = document.querySelector('.record-sheet');
    if (sheet) {
      var s = Math.min(window.innerWidth / 1700, window.innerHeight / 940, 1);
      sheet.style.transform = 'scale(' + s + ')';
    }
  }

  /* ---------------- 本地存储 ---------------- */
  function keyOf(task) { return 'chem7.' + task + '.v1'; }

  function load(task) {
    try {
      var raw = localStorage.getItem(keyOf(task));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function save(task, data) {
    try {
      localStorage.setItem(keyOf(task), JSON.stringify(data));
    } catch (e) {
      /* 存储不可用时静默忽略，课堂仍可继续使用当前页面 */
    }
  }

  function clear(task) {
    try { localStorage.removeItem(keyOf(task)); } catch (e) { /* 忽略 */ }
  }

  /* ---------------- 小提示条 ---------------- */
  var toastTimer = null;
  function toast(msg, ms) {
    var box = document.getElementById('toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      box.className = 'toast';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('show'); }, ms || 2200);
  }

  /* ---------------- 周期表 ---------------- */
  // 族标签：过渡金属列不标字，保持规整留白
  var GROUP_LABELS = ['IA', 'IIA', '', '', '', '', '', '', '', '', '', '', 'IIIA', 'IVA', 'VA', 'VIA', 'VIIA', '0'];

  /**
   * 生成 1—36 号元素的规整周期表（18 列 × 4 行）
   * @param {HTMLElement} container 容器
   * @param {Object} options { cell: 格子尺寸, onCell: 点击格子回调, showEmpty: 是否画出空白格 }
   * @returns {Object} { cells: { z: 格子元素 }, root: 周期表元素 }
   */
  function buildPeriodicTable(container, options) {
    options = options || {};
    var cellSize = options.cell || 58;

    // 用闭包把当前元素固定住，否则所有格子都会拿到循环结束时的最后一个元素
    function bindCellClick(cell, element) {
      cell.addEventListener('click', function () {
        // 已有卡片归位时不触发格子点击，避免与卡片拖拽冲突
        if (cell.querySelector('.pt-slot .placed-card')) return;
        options.onCell(element, cell);
      });
    }
    var root = document.createElement('div');
    root.className = 'ptable';
    root.style.setProperty('--cell', cellSize + 'px');

    // 左上角留白，与族标签对齐
    var corner = document.createElement('div');
    corner.className = 'pt-corner';
    root.appendChild(corner);

    // 族标签
    GROUP_LABELS.forEach(function (label) {
      var g = document.createElement('div');
      g.className = 'pt-group' + (label ? '' : ' is-blank');
      g.textContent = label;
      root.appendChild(g);
    });

    var cells = {};
    for (var p = 1; p <= 4; p++) {
      // 行首的周期号
      var pLabel = document.createElement('div');
      pLabel.className = 'pt-period';
      pLabel.textContent = p;
      root.appendChild(pLabel);

      for (var col = 1; col <= 18; col++) {
        var el = window.CHEM.elements.find(function (item) {
          return item.period === p && item.col === col;
        });

        var cell = document.createElement('div');
        cell.className = 'pt-cell';

        if (el) {
          cell.dataset.z = el.z;
          cell.dataset.block = el.block;
          if (el.noble) cell.classList.add('is-noble');
          if (!el.covalent) cell.classList.add('no-covalent');
          cell.innerHTML =
            '<span class="pt-num">' + el.z + '</span>' +
            '<span class="pt-sym">' + el.sym + '</span>' +
            '<span class="pt-name">' + el.name + '</span>' +
            '<div class="pt-slot"></div>';
          if (typeof options.onCell === 'function') {
            bindCellClick(cell, el);
          }
        } else {
          cell.classList.add('is-empty');
        }

        root.appendChild(cell);
        if (el) cells[el.z] = cell;
      }
    }

    container.innerHTML = '';
    container.appendChild(root);
    return { cells: cells, root: root };
  }

  /* ---------------- 其他小工具 ---------------- */
  // 把秒数格式化为“12.3 s”，未完成显示“—”
  function formatSeconds(sec) {
    if (sec === null || sec === undefined || isNaN(sec)) return '—';
    return (Math.round(sec * 10) / 10).toFixed(1) + ' s';
  }

  // 把毫秒时间差转成秒
  function elapsedSeconds(from, to) {
    if (!from) return null;
    return Math.max(0, ((to || Date.now()) - from) / 1000);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.App = {
    fitStage: fitStage,
    load: load,
    save: save,
    clear: clear,
    toast: toast,
    buildPeriodicTable: buildPeriodicTable,
    formatSeconds: formatSeconds,
    elapsedSeconds: elapsedSeconds,
    escapeHtml: escapeHtml
  };

  window.addEventListener('resize', fitStage);
  document.addEventListener('DOMContentLoaded', fitStage);
})();
