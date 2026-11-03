/* =====================================================================
   chart.js —— 本地 SVG 图表（不依赖任何外部库，可离线运行）
   · scatter：散点图，横坐标固定为原子序数（或母元素原子序数）
   ===================================================================== */
(function () {
  'use strict';

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtTick(v) {
    // 去掉多余的小数位，例如 53.5 保留一位
    return Math.round(v * 10) / 10;
  }

  /* ------------------------------------------------------------------
     散点图
     points: [{ x, y, label }]
     yMin / yMax / yTicks 固定预设，不随数据自动缩放
     ------------------------------------------------------------------ */
  function scatter(target, cfg) {
    var W = cfg.width || 640;
    var H = cfg.height || 240;
    var pad = { l: 52, r: 20, t: 30, b: 38 };
    var xMin = cfg.xMin !== undefined ? cfg.xMin : 0.5;
    var xMax = cfg.xMax !== undefined ? cfg.xMax : 36.5;
    var yMin = cfg.yMin;
    var yMax = cfg.yMax;
    var yTicks = cfg.yTicks || 5;
    var xTicks = cfg.xTicks || [1, 5, 10, 15, 20, 25, 30, 35];

    function px(x) { return pad.l + (x - xMin) / (xMax - xMin) * (W - pad.l - pad.r); }
    function py(y) { return H - pad.b - (y - yMin) / (yMax - yMin) * (H - pad.t - pad.b); }

    var out = [];
    out.push('<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" xmlns="' + 'http://www.w3.org/2000/svg' + '">');

    // 横向网格线与 y 轴刻度
    for (var i = 0; i <= yTicks; i++) {
      var val = yMin + (yMax - yMin) * i / yTicks;
      var y = py(val);
      out.push('<line x1="' + pad.l + '" y1="' + y + '" x2="' + (W - pad.r) + '" y2="' + y + '" stroke="#e3eeeb" stroke-width="1"' + (i === 0 ? '' : ' stroke-dasharray="3 4"') + '/>');
      out.push('<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="13" fill="#7c8783">' + fmtTick(val) + '</text>');
    }

    // 纵向网格线与 x 轴刻度
    xTicks.forEach(function (t) {
      var x = px(t);
      out.push('<line x1="' + x + '" y1="' + pad.t + '" x2="' + x + '" y2="' + (H - pad.b) + '" stroke="#eef5f3" stroke-width="1" stroke-dasharray="2 5"/>');
      out.push('<text x="' + x + '" y="' + (H - pad.b + 20) + '" text-anchor="middle" font-size="13" fill="#7c8783">' + t + '</text>');
    });

    // 坐标轴
    out.push('<line x1="' + pad.l + '" y1="' + pad.t + '" x2="' + pad.l + '" y2="' + (H - pad.b) + '" stroke="#b6d2ca" stroke-width="1.2"/>');
    out.push('<line x1="' + pad.l + '" y1="' + (H - pad.b) + '" x2="' + (W - pad.r) + '" y2="' + (H - pad.b) + '" stroke="#b6d2ca" stroke-width="1.2"/>');

    // 轴标题
    out.push('<text x="' + pad.l + '" y="' + (pad.t - 12) + '" font-size="14" fill="#065f46" letter-spacing="1">' + esc(cfg.yLabel || '') + '</text>');
    out.push('<text x="' + (W - pad.r) + '" y="' + (H - 3) + '" text-anchor="end" font-size="12" fill="#5a6360" letter-spacing="1">' + esc(cfg.xLabel || '') + '</text>');

    // 数据点：逐点点亮，已点亮的才绘制
    var labeled = {};
    (cfg.points || []).forEach(function (p) {
      if (p.y === null || p.y === undefined || isNaN(p.y)) return;
      var cx = px(p.x);
      var cy = py(p.y);
      // 同名的标签只绘制一次，避免多价态元素重复标注
      var showLabel = !!p.label && !labeled[p.label];
      if (showLabel) labeled[p.label] = true;

      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="4.6" fill="#0d9488" stroke="#fffef8" stroke-width="1.4"><title>' +
        esc(p.label + '：' + (cfg.formatY ? cfg.formatY(p.y) : p.y) + (cfg.unit ? ' ' + cfg.unit : '')) + '</title></circle>');
      if (showLabel) {
        out.push('<text x="' + (cx + 7) + '" y="' + (cy - 6) + '" font-size="12" fill="#3f5a54">' + esc(p.label) + '</text>');
      }
    });

    // 已点亮数量角标
    if (cfg.counterText) {
      out.push('<text x="' + (W - pad.r) + '" y="' + (pad.t - 12) + '" text-anchor="end" font-size="13" fill="#0f766e">' + esc(cfg.counterText) + '</text>');
    }

    out.push('</svg>');
    target.innerHTML = out.join('');
  }

  window.Charts = { scatter: scatter };
})();
