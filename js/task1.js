/* =====================================================================
   task1.js —— 任务一：构造原子结构示意图
   规则：
     · 质子数决定元素
     · 电子数 = 质子数 才是中性原子
     · 电子层排布符合 2、8、18… 且最外层不超过 8
     · 三项同时满足才能点亮周期表
     · 从铝开始，点亮铝之后解锁自由探索
   ===================================================================== */
(function () {
  'use strict';

  var MAX_Z = 36;
  var state = { protons: 13, electrons: 13 };
  var lit = [];       // 已点亮元素的原子序数（按点亮顺序）
  var litAt = {};     // 点亮时间戳
  var cells = {};

  /* ---------------- 电子层排布 ---------------- */
  // 中性原子的真实排布直接取数据表；离子状态按规则示意填充
  function fillShells(n) {
    var caps = [2, 8, 18, 32];
    var out = [];
    var rest = n;
    var i = 0;

    while (rest > 0 && i < caps.length) {
      var cap = caps[i];
      if (rest <= cap) {
        // 本层就是最外层：最多 8 个（K 层最多 2 个）
        if (rest <= 8 || i === 0) {
          out.push(rest);
          rest = 0;
          break;
        }
        // 超过 8 的部分留给下一层
        out.push(8);
        rest -= 8;
      } else {
        out.push(cap);
        rest -= cap;
      }
      i++;
    }
    return out;
  }

  // 校验：每层不超过 2n²，最外层不超过 8，次外层不超过 18
  function checkShells(shells) {
    if (!shells.length) return false;
    for (var i = 0; i < shells.length; i++) {
      var max = 2 * (i + 1) * (i + 1);
      if (shells[i] > max) return false;
      if (i === 0 && shells[i] > 2) return false;
    }
    if (shells[shells.length - 1] > 8) return false;
    if (shells.length >= 2 && shells[shells.length - 2] > 18) return false;
    return true;
  }

  /* ---------------- 结构示意图 SVG ---------------- */
  // 按教材画法：原子核在左侧（圆心），电子层用右侧半圆弧表示，弧顶端标该层电子数
  function structureSVG(shells, z, size, mini) {
    var cy = size / 2;
    var cx = size * (mini ? 0.26 : 0.28);
    var coreR = size * (mini ? 0.1 : 0.085);
    // 上限 0.44：保证最外层半圆弧的上下端点都落在画布内，不被裁切
    var maxR = size * 0.44;
    var step = (maxR - coreR) / Math.max(shells.length, 1);
    var parts = [];

    parts.push('<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg">');

    // 电子层：右半圆弧（核在圆心偏左，弧线向右展开）
    shells.forEach(function (n, i) {
      var r = coreR + step * (i + 1);
      parts.push('<path d="M ' + cx + ' ' + (cy - r) + ' A ' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy + r) +
        '" fill="none" stroke="#0d9488" stroke-width="' + (mini ? 1.1 : 1.8) + '" opacity="0.92"/>');
      if (!mini) {
        // 电子数标在弧线最右端外侧，字号放大到投屏可读
        var fs = size * 0.055;
        parts.push('<text x="' + (cx + r + 8) + '" y="' + (cy + fs * 0.36) + '" font-size="' + fs +
          '" fill="#047857" font-family="serif">' + n + '</text>');
      }
    });

    // 原子核：圆心标核电荷数
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + coreR +
      '" fill="#fffef8" stroke="#065f46" stroke-width="' + (mini ? 1.2 : 2) + '"/>');
    var coreFs = mini ? coreR * 0.9 : coreR * 0.62;
    parts.push('<text x="' + cx + '" y="' + (cy + coreFs * 0.36) + '" text-anchor="middle" font-size="' + coreFs +
      '" fill="#065f46" font-family="serif">+' + z + '</text>');

    parts.push('</svg>');
    return parts.join('');
  }

  /* ---------------- 三维原子模型（Canvas 手绘，离线可用） ----------------
     用 2D 画布模拟 3D：电子在倾斜的分层轨道上匀速运动，
     靠近观察者的电子更大更亮，远离的更小更淡，形成空间感。
     -------------------------------------------------------------------- */
  function createAtom3D(canvas) {
    var ctx = canvas.getContext('2d');
    var z = 13;
    var shells = [2, 8, 3];
    var w = 300;
    var h = 300;
    var t0 = performance.now();
    var raf = null;

    // 适配高分屏，保证 iPad 上不发虚
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || 300;
      h = canvas.clientHeight || 300;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // 三维点投影：先绕 X 轴倾斜，再绕 Y 轴旋转
    function project(x, y, zz, tilt, yaw) {
      var y1 = y * Math.cos(tilt) - zz * Math.sin(tilt);
      var z1 = y * Math.sin(tilt) + zz * Math.cos(tilt);
      var x2 = x * Math.cos(yaw) + z1 * Math.sin(yaw);
      var z2 = -x * Math.sin(yaw) + z1 * Math.cos(yaw);
      return { x: x2, y: y1, z: z2 };
    }

    // 电子小球：外圈柔光 + 内圈亮点
    function drawDot(d) {
      var k = 1 + d.z * 0.0012;
      var r = 3 * k;
      ctx.beginPath();
      ctx.fillStyle = d.z > 0 ? 'rgba(34,211,238,0.22)' : 'rgba(94,234,212,0.18)';
      ctx.arc(d.x, d.y, r * 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = d.z > 0 ? '#22d3ee' : '#5eead4';
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      var cx = w / 2;
      var cy = h / 2;
      var maxR = Math.min(w, h) * 0.42;
      var coreR = Math.max(14, maxR * 0.2);

      // 每一层电子一个倾斜的圆轨道
      var layers = shells.map(function (n, i) {
        return {
          n: n,
          r: coreR + (maxR - coreR) * (i + 1) / Math.max(shells.length, 1),
          tilt: 1.02 - i * 0.2,
          yaw: t * 0.18 + i * 0.8,
          speed: 0.5 - i * 0.07
        };
      });

      // 轨道线
      layers.forEach(function (L) {
        ctx.beginPath();
        for (var k = 0; k <= 72; k++) {
          var a = k / 72 * Math.PI * 2;
          var p = project(Math.cos(a) * L.r, 0, Math.sin(a) * L.r, L.tilt, L.yaw);
          if (k === 0) ctx.moveTo(cx + p.x, cy + p.y);
          else ctx.lineTo(cx + p.x, cy + p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(13,148,136,0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 计算所有电子的位置，按深度排序（远的先画）
      var dots = [];
      layers.forEach(function (L, li) {
        for (var i = 0; i < L.n; i++) {
          var a = i / L.n * Math.PI * 2 + t * L.speed + li * 0.6;
          var p = project(Math.cos(a) * L.r, 0, Math.sin(a) * L.r, L.tilt, L.yaw);
          dots.push({ x: cx + p.x, y: cy + p.y, z: p.z });
        }
      });
      dots.sort(function (a, b) { return a.z - b.z; });

      // 轨道后方的电子
      dots.forEach(function (d) { if (d.z < 0) drawDot(d); });

      // 原子核光晕
      var glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, coreR * 3);
      glow.addColorStop(0, 'rgba(16,185,129,0.5)');
      glow.addColorStop(0.45, 'rgba(13,148,136,0.14)');
      glow.addColorStop(1, 'rgba(13,148,136,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
      ctx.fill();

      // 原子核：径向渐变球
      var core = ctx.createRadialGradient(cx - coreR * 0.35, cy - coreR * 0.4, coreR * 0.15, cx, cy, coreR);
      core.addColorStop(0, '#8bf5dd');
      core.addColorStop(0.5, '#0d9488');
      core.addColorStop(1, '#065f46');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // 核电荷数
      ctx.fillStyle = '#f0fdfa';
      ctx.font = '600 ' + (coreR * 0.82) + 'px "PingFang SC", "Microsoft YaHei", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+' + z, cx, cy + 1);

      // 轨道前方的电子
      dots.forEach(function (d) { if (d.z >= 0) drawDot(d); });

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return {
      // 学生改变质子或电子时同步更新模型
      set: function (newZ, newShells) {
        z = newZ;
        shells = newShells.slice();
      }
    };
  }

  /* ---------------- 周期表 ---------------- */
  function groupName(el) {
    if (el.block === 'transition') return '过渡元素';
    if (el.col === 18) return '0 族';
    var map = { 1: 'ⅠA 族', 2: 'ⅡA 族', 13: 'ⅢA 族', 14: 'ⅣA 族', 15: 'ⅤA 族', 16: 'ⅥA 族', 17: 'ⅦA 族' };
    return map[el.col] || '';
  }

  function paintTable() {
    window.CHEM.mainGroupElements.forEach(function (el) {
      var cell = cells[el.z];
      if (!cell) return;

      var isLit = lit.indexOf(el.z) >= 0;
      var slot = cell.querySelector('.pt-slot');
      cell.classList.toggle('is-lit', isLit);
      cell.title = el.z + ' ' + el.sym + ' ' + el.name +
        '　电子层：' + el.shells.join(', ');

      if (isLit) {
        slot.innerHTML = structureSVG(el.shells, el.z, 56, true);
      } else {
        slot.innerHTML = '';
      }
    });

    // 已点亮清单
    var board = document.getElementById('lit-board-list');
    if (!lit.length) {
      board.innerHTML = '<span class="lit-empty">还没有点亮的元素</span>';
    } else {
      var sorted = lit.slice().sort(function (a, b) { return a - b; });
      board.innerHTML = sorted.map(function (z) {
        var el = window.CHEM.byZ[z];
        return '<span class="lit-chip">' + el.sym + '</span>';
      }).join('');
    }

    document.getElementById('progress-chip').textContent =
      '已点亮 ' + lit.length + ' / ' + window.CHEM.mainGroupElements.length;

    // 顶部右侧信息卡的计数
    var hint = document.getElementById('lit-count-hint');
    if (hint) {
      hint.textContent = lit.length + ' / ' + window.CHEM.mainGroupElements.length;
    }
  }

  /* ---------------- 主渲染 ---------------- */
  function render() {
    var p = state.protons;
    var e = state.electrons;
    var el = window.CHEM.byZ[p];
    var neutral = p === e;
    var shells = (neutral && el) ? el.shells : fillShells(e);
    var ruleOk = checkShells(shells);
    var transition = el && el.block === 'transition';
    var unlocked = lit.indexOf(13) >= 0;
    var alreadyLit = lit.indexOf(p) >= 0;
    var canLight = !!el && neutral && ruleOk && !transition && !alreadyLit && (p === 13 || unlocked);

    document.getElementById('proton-value').textContent = p;
    document.getElementById('electron-value').textContent = e;
    document.getElementById('proton-minus').disabled = p <= 1;
    document.getElementById('proton-plus').disabled = p >= MAX_Z;
    document.getElementById('electron-minus').disabled = e <= 1;
    document.getElementById('electron-plus').disabled = e >= MAX_Z;

    // 结构示意图（平面）+ 三维模型同步更新
    document.getElementById('atom-graphic').innerHTML = structureSVG(shells, p, 340, false);
    if (view3d) view3d.set(p, shells);

    // 元素信息
    if (el) {
      document.getElementById('element-symbol').innerHTML = el.sym + ' <small>' + el.name + '</small>';
      document.getElementById('element-pos').textContent =
        '第 ' + el.period + ' 周期 · ' + groupName(el);
    } else {
      document.getElementById('element-symbol').innerHTML = '—';
      document.getElementById('element-pos').textContent = '超出 1—36 号范围';
    }

    // 三项判定
    setCheck(1, !!el, '质子数决定元素：' + p + ' 号 → ' +
      (el ? el.name + '（' + el.sym + '）' : '未知元素'));

    setCheck(2, neutral,
      neutral
        ? '电子数 = 质子数：' + e + ' = ' + p + ' → 中性原子'
        : '电子数 ' + e + ' ≠ 质子数 ' + p + ' → 当前为离子');

    setCheck(3, ruleOk,
      '电子层排布：' + shells.join(', ') + ' → ' +
      (ruleOk ? '符合 2、8、18… 且最外层不超过 8' : '不符合排布规则'));

    // 状态提示
    var status = document.getElementById('status-text');
    var bar = document.getElementById('status-bar');
    var text = '';
    var tone = '';

    if (!el) {
      text = '质子数超出 1—36 号范围。';
    } else if (!neutral) {
      text = '当前为离子：电子数 ≠ 质子数，请调整回中性原子后再点亮。';
      tone = 'is-bad';
    } else if (transition) {
      text = '21—30 号过渡金属原子结构较复杂，本课时暂不点亮。';
    } else if (!ruleOk) {
      text = '电子层排布不符合规则，请检查电子数。';
      tone = 'is-bad';
    } else if (alreadyLit) {
      text = el.name + '（' + el.sym + '）的结构示意图已点亮，可以继续探索其他元素。';
      tone = 'is-ok';
    } else if (!unlocked) {
      text = '先完成铝原子结构示意图，再解锁自由探索。';
    } else {
      text = '三项均满足，可以把结构示意图点亮到右侧周期表。';
      tone = 'is-ok';
    }

    status.textContent = text;
    bar.className = 'status-bar' + (tone ? ' ' + tone : '');

    var btn = document.getElementById('btn-lightup');
    btn.disabled = !canLight;
    btn.textContent = alreadyLit ? '已点亮 ✓' : '点亮到周期表';
    if (canLight) btn.disabled = false;
  }

  function setCheck(index, ok, text) {
    var item = document.getElementById('check-' + index);
    item.className = 'check-item' + (ok ? ' ok' : ' bad');
    document.getElementById('check-' + index + '-text').textContent = text;
    var dot = item.querySelector('.check-dot');
    dot.textContent = ok ? '✓' : '!';
  }

  /* ---------------- 点亮 ---------------- */
  function lightUp() {
    var p = state.protons;
    var e = state.electrons;
    var el = window.CHEM.byZ[p];
    if (!el || p !== e || el.block === 'transition') return;
    if (lit.indexOf(p) >= 0) return;

    lit.push(p);
    litAt[p] = Date.now();
    save();
    paintTable();
    render();
    window.App.toast(el.sym + '（' + el.name + '）的结构示意图已点亮');
  }

  /* ---------------- 存储 ---------------- */
  function save() {
    window.App.save('task1', { lit: lit, litAt: litAt });
  }

  function load() {
    var data = window.App.load('task1');
    if (!data) return;
    if (Array.isArray(data.lit)) lit = data.lit.slice();
    litAt = data.litAt || {};
  }

  /* ---------------- 记录面板 ---------------- */
  function formatTime(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function openRecords() {
    var total = window.CHEM.mainGroupElements.length;
    var latest = lit.length ? lit[lit.length - 1] : null;

    document.getElementById('record-stats').innerHTML =
      '<div class="stat-box"><div class="stat-label">已点亮</div><div class="stat-value">' +
        lit.length + '<small>/ ' + total + '</small></div></div>' +
      '<div class="stat-box"><div class="stat-label">尚未点亮</div><div class="stat-value">' +
        (total - lit.length) + '</div></div>' +
      '<div class="stat-box"><div class="stat-label">最近点亮</div><div class="stat-value" style="font-size:22px">' +
        (latest ? window.CHEM.byZ[latest].sym : '—') + '</div></div>' +
      '<div class="stat-box"><div class="stat-label">自由探索</div><div class="stat-value" style="font-size:22px">' +
        (lit.indexOf(13) >= 0 ? '已解锁' : '未解锁') + '</div></div>';

    var table = document.getElementById('record-table');
    if (!lit.length) {
      table.innerHTML = '<tr><td class="record-empty">还没有点亮的元素，先构造铝原子的结构示意图吧。</td></tr>';
    } else {
      var rows = lit.map(function (z, index) {
        var el = window.CHEM.byZ[z];
        return '<tr>' +
          '<td class="num">' + (index + 1) + '</td>' +
          '<td>' + el.sym + '　<span class="muted">' + el.name + '</span></td>' +
          '<td class="num">+' + el.z + '</td>' +
          '<td class="num">' + el.shells.join(', ') + '</td>' +
          '<td class="num">' + formatTime(litAt[z]) + '</td>' +
        '</tr>';
      }).join('');

      table.innerHTML =
        '<thead><tr><th>点亮顺序</th><th>元素</th><th>核电荷</th><th>电子层排布</th><th>点亮时间</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>';
    }

    // 结构示意图墙（按原子序数排列，便于对比同周期、同主族）
    var wall = document.getElementById('record-chart');
    if (!lit.length) {
      wall.innerHTML = '<div class="wall-empty">还没有点亮的原子结构示意图</div>';
    } else {
      var sorted = lit.slice().sort(function (a, b) { return a - b; });
      wall.innerHTML = sorted.map(function (z) {
        var el = window.CHEM.byZ[z];
        return '<div class="wall-item">' + structureSVG(el.shells, el.z, 56, true) +
          '<span>' + el.sym + '</span></div>';
      }).join('');
    }

    document.getElementById('record-overlay').classList.add('is-open');
    // 打开后按当前窗口重新缩放记录面板
    window.App.fitStage();
  }

  /* ---------------- 绑定事件 ---------------- */
  function bind() {
    function stepProton(delta) {
      state.protons = Math.max(1, Math.min(MAX_Z, state.protons + delta));
      render();
    }
    function stepElectron(delta) {
      state.electrons = Math.max(1, Math.min(MAX_Z, state.electrons + delta));
      render();
    }

    document.getElementById('proton-minus').addEventListener('click', function () { stepProton(-1); });
    document.getElementById('proton-plus').addEventListener('click', function () { stepProton(1); });
    document.getElementById('electron-minus').addEventListener('click', function () { stepElectron(-1); });
    document.getElementById('electron-plus').addEventListener('click', function () { stepElectron(1); });
    document.getElementById('btn-lightup').addEventListener('click', lightUp);

    document.getElementById('btn-records').addEventListener('click', openRecords);
    document.getElementById('btn-record-close').addEventListener('click', function () {
      document.getElementById('record-overlay').classList.remove('is-open');
    });
    document.getElementById('record-overlay').addEventListener('click', function (ev) {
      if (ev.target === this) this.classList.remove('is-open');
    });

    function reset() {
      if (!confirm('确定重置任务一的点亮记录吗？')) return;
      window.App.clear('task1');
      location.reload();
    }
    document.getElementById('btn-reset').addEventListener('click', reset);
    document.getElementById('btn-record-reset').addEventListener('click', reset);
  }

  /* ---------------- 启动 ---------------- */
  load();

  // 三维原子模型：只在任务一页面创建一次，之后随粒子数更新
  var canvas3d = document.getElementById('atom-canvas');
  var view3d = canvas3d ? createAtom3D(canvas3d) : null;

  var built = window.App.buildPeriodicTable(document.getElementById('periodic'), {
    cell: 58,
    onCell: function (el) {
      // 点击周期表格子，快速载入该元素的质子数与电子数，方便自由探索
      state.protons = el.z;
      state.electrons = el.z;
      render();
      window.App.toast('已载入 ' + el.sym + '（' + el.name + '）');
    }
  });
  cells = built.cells;

  bind();
  paintTable();
  render();
})();
