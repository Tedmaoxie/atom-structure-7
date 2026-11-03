/* =====================================================================
   card-task.js —— 任务二、三、四共用的卡片探究引擎
   功能：
     1. 卡片凌乱悬浮（缓慢柔和的漂浮，悬停或按住暂停）
     2. 轻点翻面（3D 纸质翻面），记录翻面次数与顺序
     3. 拖拽到周期表格子归位；放错先放入、格子标红、可拖出重放
     4. 散点图逐点点亮（按任务配置去重）
     5. 计算器（可选）与任务四柱状图
     6. 历史记录：点击顺序、翻面次数、停留时间、重复点击
     7. 一键展开记录面板（适合截图投屏）
   ===================================================================== */
(function () {
  'use strict';

  var CARD_W = 96;
  var CARD_H = 124;

  // Fisher–Yates 洗牌：卡片池初始顺序随机，学生不能靠序号直接归位
  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function CardTask(config) {
    this.config = config;
    this.key = config.storageKey;
    this.items = shuffle(config.items); // 打乱卡片顺序，避免按原子序数排好队
    this.itemById = {};
    this.items.forEach(function (it) { this.itemById[it.id] = it; }, this);

    this.records = {};   // 每张卡片的历史记录
    this.orderCount = 0; // 点击顺序计数器
    this.pos = {};       // 卡片在池中的位置与漂浮速度
    this.cardEls = {};   // 卡片 DOM
    this.cells = {};     // 周期表格子 DOM
    this.dragging = null;
    this.lastSelected = null;
  }

  /* ================= 初始化 ================= */
  CardTask.prototype.init = function () {
    var data = window.App.load(this.key) || {};
    this.records = data.records || {};
    this.orderCount = data.orderCount || 0;

    this.pool = document.getElementById('pool');
    this.stage = document.getElementById('stage');

    // 拖拽层：卡片拖出卡片池后临时放到这里，才能跟着指针越过周期表
    this.dragLayer = document.createElement('div');
    this.dragLayer.className = 'drag-layer';
    this.dragLayer.id = 'drag-layer';
    this.stage.appendChild(this.dragLayer);

    // 周期表：1—36 号元素，18 列 × 4 行
    var built = window.App.buildPeriodicTable(document.getElementById('periodic'), {
      cell: 58,
      onCell: this.onCellClick.bind(this)
    });
    this.cells = built.cells;

    this.buildCards();
    this.buildSide();
    this.restore();

    this.bindButtons();
    this.bindDrag();

    this.renderAll();
    this.startLoop();

    // 页面标题与任务说明
    var meta = this.config.meta;
    document.getElementById('page-title').textContent = meta.subtitle;
    document.getElementById('eyebrow').textContent = this.config.eyebrow;
    document.title = meta.title + ' · 元素周期律';
    document.getElementById('pool-watermark').textContent = '待整理 · ' + this.items.length + ' 张';
  };

  /* ================= 卡片：创建与漂浮 ================= */
  CardTask.prototype.buildCards = function () {
    var self = this;
    var pool = this.pool;
    var poolW = pool.clientWidth;
    var poolH = pool.clientHeight;
    var cols = Math.min(8, this.items.length);
    var rows = Math.ceil(this.items.length / cols);
    var gapX = (poolW - 32 - cols * CARD_W) / Math.max(cols - 1, 1);
    var gapY = (poolH - 32 - rows * CARD_H) / Math.max(rows - 1, 1);
    gapX = Math.max(gapX, 6);
    gapY = Math.max(gapY, 6);

    this.items.forEach(function (item, index) {
      var col = index % cols;
      var row = Math.floor(index / cols);

      // 网格定位 + 小幅抖动：看起来凌乱，但每张卡的中心都露得出来，方便点按
      var jitterX = (Math.random() - 0.5) * Math.min(12, gapX * 0.6 + 4);
      var jitterY = (Math.random() - 0.5) * Math.min(10, gapY * 0.5 + 3);
      var x = 16 + col * (CARD_W + gapX) + jitterX;
      var y = 16 + row * (CARD_H + gapY) + jitterY;

      x = Math.max(10, Math.min(poolW - CARD_W - 10, x));
      y = Math.max(10, Math.min(poolH - CARD_H - 10, y));

      // 每张卡围绕自己的初始位置缓慢转小圈：既有漂浮感，又不会慢慢聚成一堆
      self.pos[item.id] = {
        x: x,
        y: y,
        homeX: x,
        homeY: y,
        rot: (Math.random() - 0.5) * 6,
        rotBase: (Math.random() - 0.5) * 6,
        phase: Math.random() * Math.PI * 2,
        orbitR: 12 + Math.random() * 8,
        orbitSpeed: 0.6 + Math.random() * 0.3,
        paused: false,
        placed: false
      };

      var el = document.createElement('div');
      el.className = 'chem-card';
      el.dataset.id = item.id;
      el.style.zIndex = String(2 + index);
      el.innerHTML =
        '<div class="card-inner">' +
          '<div class="card-face front">' + self.config.frontHTML(item) + '</div>' +
          '<div class="card-face back">' + self.config.backHTML(item) + '</div>' +
        '</div>';

      pool.appendChild(el);
      self.cardEls[item.id] = el;
      self.setTransform(item.id);

      // 鼠标悬停 / 手指按住时暂停漂浮，便于抓取
      el.addEventListener('pointerenter', function () {
        if (self.pos[item.id]) self.pos[item.id].paused = true;
      });
      el.addEventListener('pointerleave', function () {
        if (self.pos[item.id] && !self.dragging) self.pos[item.id].paused = false;
      });

      el.addEventListener('pointerdown', function (ev) {
        self.beginDrag(el, item, ev);
      });
    });
  };

  CardTask.prototype.setTransform = function (id) {
    var p = this.pos[id];
    var el = this.cardEls[id];
    if (!p || !el) return;
    el.style.transform =
      'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + p.rot.toFixed(2) + 'deg)';
  };

  // 漂浮动画循环
  CardTask.prototype.startLoop = function () {
    var self = this;
    var last = performance.now();

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      self.items.forEach(function (item) {
        var p = self.pos[item.id];
        if (!p || p.paused || p.placed) return;
        if (self.dragging && self.dragging.item.id === item.id) return;

        // 预留 10px 给卡片旋转后的外扩，避免卡角被面板裁掉
        var pad = 10;
        var maxX = self.pool.clientWidth - CARD_W - pad;
        var maxY = self.pool.clientHeight - CARD_H - pad;

        // 围绕自己的“家”位置缓慢转小圈（约 30 秒一圈），柔和且不会聚堆
        p.phase += p.orbitSpeed * dt;
        p.x = p.homeX + Math.cos(p.phase) * p.orbitR;
        p.y = p.homeY + Math.sin(p.phase * 0.85) * p.orbitR * 0.65;
        p.rot = p.rotBase + Math.sin(p.phase * 0.6) * 3.2;

        p.x = Math.max(pad, Math.min(maxX, p.x));
        p.y = Math.max(pad, Math.min(maxY, p.y));

        var el = self.cardEls[item.id];
        el.style.transform =
          'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + p.rot.toFixed(2) + 'deg)';
      });

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* ================= 拖拽与翻面 ================= */
  CardTask.prototype.getScale = function () {
    return this.stage.getBoundingClientRect().width / 1920 || 1;
  };

  CardTask.prototype.beginDrag = function (el, item, ev) {
    if (this.dragging) return;
    ev.preventDefault();

    var scale = this.getScale();
    var stageRect = this.stage.getBoundingClientRect();
    var cardRect = el.getBoundingClientRect();
    var p = this.pos[item.id];

    // 记录卡片当前在舞台坐标系里的位置（舞台左上角为原点）
    var stageX = (cardRect.left - stageRect.left) / scale;
    var stageY = (cardRect.top - stageRect.top) / scale;
    var rot = p ? p.rot : 0;

    this.dragging = {
      el: el,
      item: item,
      moved: false,
      startX: ev.clientX,
      startY: ev.clientY,
      offsetX: (ev.clientX - cardRect.left) / scale,
      offsetY: (ev.clientY - cardRect.top) / scale,
      scale: scale,
      stageX: stageX,
      stageY: stageY,
      rot: rot
    };

    // 把卡片移到拖拽层：这样它可以跟着指针越过卡片池边框，一直到周期表
    if (el.parentNode !== this.dragLayer) this.dragLayer.appendChild(el);
    el.classList.add('is-dragging');
    el.style.zIndex = '80';
    el.style.transform = 'translate3d(' + stageX + 'px,' + stageY + 'px,0) rotate(' + rot + 'deg)';

    if (p) p.paused = true;

    // 捕获指针：即使手指短暂移出元素，后续移动与抬起仍然可追踪
    try { el.setPointerCapture(ev.pointerId); } catch (err) { /* 部分环境不支持，忽略即可 */ }
  };

  CardTask.prototype.bindDrag = function () {
    var self = this;

    window.addEventListener('pointermove', function (ev) {
      var d = self.dragging;
      if (!d) return;

      var dist = Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY);
      // 阈值取 8 像素：手指轻微抖动仍然算“点击翻面”，避免误触变成拖拽
      if (!d.moved && dist > 8) d.moved = true;
      if (!d.moved) return;

      // 拖拽时只用舞台坐标，不再限制在卡片池范围内
      var stageRect = self.stage.getBoundingClientRect();
      d.stageX = (ev.clientX - stageRect.left) / d.scale - d.offsetX;
      d.stageY = (ev.clientY - stageRect.top) / d.scale - d.offsetY;
      d.el.style.transform = 'translate3d(' + d.stageX + 'px,' + d.stageY + 'px,0) rotate(' + d.rot + 'deg)';

      // 指针经过的格子高亮，提示可放置位置
      self.highlightCellAt(ev.clientX, ev.clientY);
    }, { passive: false });

    window.addEventListener('pointerup', function (ev) {
      var d = self.dragging;
      if (!d) return;
      self.dragging = null;

      d.el.classList.remove('is-dragging');
      d.el.style.zIndex = String(2 + self.items.indexOf(d.item));
      self.clearCellHighlight();

      if (self.pos[d.item.id]) self.pos[d.item.id].paused = false;

      if (!d.moved) {
        // 轻点：先回到卡片池，再翻面
        self.returnToPool(d.item, d.stageX, d.stageY);
        self.flip(d.item);
      } else {
        var placed = self.tryPlace(d.item, ev.clientX, ev.clientY);
        if (!placed) self.returnToPool(d.item, d.stageX, d.stageY);
      }
    });

    window.addEventListener('pointercancel', function () {
      var d = self.dragging;
      if (!d) return;
      self.dragging = null;
      d.el.classList.remove('is-dragging');
      self.clearCellHighlight();
      self.returnToPool(d.item, d.stageX, d.stageY);
    });
  };

  // 拖拽结束但没放进周期表：把卡片放回卡片池，并换算回卡片池坐标
  CardTask.prototype.returnToPool = function (item, stageX, stageY) {
    var el = this.cardEls[item.id];
    var p = this.pos[item.id];
    if (!el || !p) return;
    if (p.placed) return; // 已经归位的卡片不再回到池中

    var scale = this.getScale();
    var stageRect = this.stage.getBoundingClientRect();
    var poolRect = this.pool.getBoundingClientRect();

    p.x = stageX - (poolRect.left - stageRect.left) / scale;
    p.y = stageY - (poolRect.top - stageRect.top) / scale;

    // 落在池内，并把这里记为新的“家”位置，之后围绕它缓慢漂浮
    p.x = Math.max(10, Math.min(this.pool.clientWidth - CARD_W - 10, p.x));
    p.y = Math.max(10, Math.min(this.pool.clientHeight - CARD_H - 10, p.y));
    p.homeX = p.x;
    p.homeY = p.y;
    p.phase = Math.random() * Math.PI * 2;

    this.pool.appendChild(el);
    this.setTransform(item.id);
    p.paused = false;
  };

  // 找到指针所在的周期表格子
  CardTask.prototype.cellAt = function (clientX, clientY) {
    var found = null;
    Object.keys(this.cells).forEach(function (z) {
      var cell = this.cells[z];
      var r = cell.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        found = cell;
      }
    }, this);
    return found;
  };

  CardTask.prototype.highlightCellAt = function (clientX, clientY) {
    this.clearCellHighlight();
    var cell = this.cellAt(clientX, clientY);
    if (cell) cell.classList.add('is-hover');
  };

  CardTask.prototype.clearCellHighlight = function () {
    Object.keys(this.cells).forEach(function (z) {
      this.cells[z].classList.remove('is-hover');
    }, this);
  };

  /* ================= 翻面 ================= */
  CardTask.prototype.flip = function (item) {
    var rec = this.records[item.id];
    if (!rec) {
      rec = this.records[item.id] = {
        order: ++this.orderCount,
        flipCount: 0,
        firstFlipAt: 0,
        lastFlipAt: 0,
        placed: false,
        slotZ: null,
        correct: false,
        timeSpent: null
      };
    }

    rec.flipCount += 1;
    var now = Date.now();
    if (!rec.firstFlipAt) rec.firstFlipAt = now; // 停留计时起点：首次翻面
    rec.lastFlipAt = now;

    var el = this.cardEls[item.id];
    // 再次点击翻回正面：来回翻面，方便学生反复对比正反面
    el.classList.toggle('is-flipped');
    this.lastSelected = item;

    this.save();
    this.renderAll();
  };

  /* ================= 归位 ================= */
  CardTask.prototype.tryPlace = function (item, clientX, clientY) {
    var cell = this.cellAt(clientX, clientY);
    if (!cell) return false; // 没放到格子里，卡片回到卡片池

    var slot = cell.querySelector('.pt-slot');
    if (slot.querySelector('.placed-card')) {
      window.App.toast('该格子已有卡片，请先把它拖出');
      return false;
    }

    var targetZ = Number(cell.dataset.z);
    var correct = targetZ === item.z;
    var rec = this.records[item.id];

    // 未翻面直接拖入也允许，但没有停留时间；散点仍不点亮
    if (!rec) {
      rec = this.records[item.id] = {
        order: ++this.orderCount,
        flipCount: 0,
        firstFlipAt: 0,
        lastFlipAt: 0,
        placed: false,
        slotZ: null,
        correct: false,
        timeSpent: null
      };
    }

    rec.placed = true;
    rec.slotZ = targetZ;
    rec.correct = correct;

    if (correct) {
      // 停留时间：首次翻面 → 正确归位
      rec.timeSpent = rec.firstFlipAt ? (Date.now() - rec.firstFlipAt) / 1000 : null;
      window.App.toast('归位正确 · ' + item.sym);
    } else {
      rec.timeSpent = null;
      window.App.toast('放错了格子，格子标红，可再拖出重放');
    }

    this.renderPlaced(item, cell, correct);
    this.hideFloatingCard(item.id);
    this.save();
    this.renderAll();
    return true;
  };

  CardTask.prototype.renderPlaced = function (item, cell, correct) {
    var self = this;
    var slot = cell.querySelector('.pt-slot');
    slot.innerHTML = '';

    var chip = document.createElement('div');
    chip.className = 'placed-card' + (correct ? '' : ' is-wrong');
    chip.innerHTML =
      '<span class="pc-sym">' + item.sym + '</span>' +
      '<span class="pc-value">' + this.config.chipValue(item) + '</span>';

    // 已归位的卡片可以再次拖出重放
    chip.addEventListener('pointerdown', function (ev) {
      self.pullOut(item, cell, chip, ev);
    });

    slot.appendChild(chip);
    cell.classList.toggle('is-correct', correct);
    cell.classList.toggle('is-wrong', !correct);
  };

  CardTask.prototype.hideFloatingCard = function (id) {
    var el = this.cardEls[id];
    if (el) el.style.display = 'none';
    if (this.pos[id]) this.pos[id].placed = true;
  };

  CardTask.prototype.showFloatingCard = function (id) {
    var el = this.cardEls[id];
    if (el) el.style.display = '';
    if (this.pos[id]) this.pos[id].placed = false;
  };

  // 把已归位的卡片拖出格子，重新进入拖拽状态
  CardTask.prototype.pullOut = function (item, cell, chip, ev) {
    if (this.dragging) return;
    ev.preventDefault();

    var rec = this.records[item.id];
    if (rec) {
      rec.placed = false;
      rec.slotZ = null;
      rec.correct = false;
    }

    cell.classList.remove('is-wrong', 'is-correct');

    // 先记住小卡片在屏幕上的位置，再移除它
    var chipRect = chip.getBoundingClientRect();
    chip.remove();

    var el = this.cardEls[item.id];
    this.showFloatingCard(item.id);
    el.classList.add('is-flipped');

    var scale = this.getScale();
    var stageRect = this.stage.getBoundingClientRect();

    // 卡片出现在小卡片原来的位置，然后继续跟随指针拖拽
    this.dragLayer.appendChild(el);
    el.style.transform = 'translate3d(' +
      ((chipRect.left - stageRect.left) / scale) + 'px,' +
      ((chipRect.top - stageRect.top) / scale) + 'px,0)';

    this.beginDrag(el, item, ev);
  };

  /* ================= 恢复上次记录 ================= */
  CardTask.prototype.restore = function () {
    var self = this;
    var latest = null;

    Object.keys(this.records).forEach(function (id) {
      var rec = self.records[id];
      var item = self.itemById[id];
      if (!item) return;

      if (rec.flipCount > 0) {
        self.cardEls[id].classList.add('is-flipped');
        if (!latest || rec.lastFlipAt > latest.rec.lastFlipAt) {
          latest = { item: item, rec: rec };
        }
      }

      if (rec.placed) {
        var cell = self.cells[item.z] && rec.correct ? self.cells[item.z] : self.cells[rec.slotZ];
        if (cell) {
          self.renderPlaced(item, cell, rec.correct);
          self.hideFloatingCard(id);
        }
      }

      if (rec.order > self.orderCount) self.orderCount = rec.order;
    });

    if (latest) this.lastSelected = latest.item;
  };

  /* ================= 右侧：周期表格子点击 ================= */
  CardTask.prototype.onCellClick = function (el) {
    window.App.toast(el.z + ' · ' + el.sym + ' ' + el.name);
  };

  /* ================= 底部面板 ================= */
  CardTask.prototype.buildSide = function () {
    var side = document.getElementById('side-body');
    var self = this;

    side.innerHTML =
      '<div class="stat-row" id="stat-row"></div>' +
      '<div class="recent-line" id="recent-info">最近翻面：—</div>' +
      '<div class="side-hint-text">' + this.config.sideHint + '</div>';

    // 计算器收进右下角浮层：任务二、三才有 calc-body
    var calc = document.getElementById('calc-body');
    if (!calc) return;

    calc.innerHTML =
      '<div class="calc-formula">| r<sub>x</sub> − r<sub>' + this.config.refLabel + '</sub> | ÷ r<sub>' +
        this.config.refLabel + '</sub> × 100%</div>' +
      '<div class="calc-row"><select class="calc-select" id="calc-select"></select></div>' +
      '<div class="calc-result"><span class="r-label">半径差值</span><span class="r-value" id="calc-value">—</span></div>' +
      '<div class="calc-foot">r<sub>' + this.config.refLabel + '</sub> = ' + this.config.refValue + ' pm</div>';

    document.getElementById('calc-select').addEventListener('change', function () {
      self.renderCalc();
    });

    var toggle = document.getElementById('calc-toggle');
    var pop = document.getElementById('calc-pop');
    var close = document.getElementById('calc-close');

    function setOpen(open) {
      pop.hidden = !open;
      if (toggle) toggle.classList.toggle('is-on', open);
    }

    if (toggle && pop) {
      toggle.addEventListener('click', function () {
        setOpen(pop.hidden);
      });
    }
    if (close && pop) {
      close.addEventListener('click', function () {
        setOpen(false);
      });
    }
  };

  CardTask.prototype.renderAll = function () {
    this.renderProgress();
    this.renderScatter();
    this.renderStats();
    this.renderSide();
    this.renderCalc();
  };

  CardTask.prototype.flippedItems = function () {
    var self = this;
    return this.items.filter(function (it) {
      return self.records[it.id] && self.records[it.id].flipCount > 0;
    }).sort(function (a, b) {
      return self.records[a.id].order - self.records[b.id].order;
    });
  };

  CardTask.prototype.renderProgress = function () {
    var chip = document.getElementById('progress-chip');
    chip.textContent = '已翻面 ' + this.flippedItems().length + ' / ' + this.items.length;
  };

  CardTask.prototype.scatterPoints = function () {
    var self = this;
    var pts = [];
    this.items.forEach(function (item) {
      var rec = self.records[item.id];
      if (!rec || rec.flipCount <= 0) return;
      if (!self.config.chartable(item)) return;
      self.config.pointsFor(item).forEach(function (p) {
        pts.push(p);
      });
    });
    return pts;
  };

  // 统计“已点亮”的元素个数（任务四一个元素有多个价态点，按元素计数）
  CardTask.prototype.litElementCount = function () {
    var self = this;
    return this.items.filter(function (item) {
      var rec = self.records[item.id];
      return rec && rec.flipCount > 0 && self.config.chartable(item);
    }).length;
  };

  CardTask.prototype.renderScatter = function () {
    var meta = this.config.meta;
    var pts = this.scatterPoints();
    var total = this.config.chartTotal;
    window.Charts.scatter(document.getElementById('scatter'), {
      width: 880,
      height: 300,
      xMin: 0.5,
      xMax: 36.5,
      yMin: meta.yMin,
      yMax: meta.yMax,
      yTicks: meta.yTicks || 5,
      xTicks: [1, 5, 10, 15, 20, 25, 30, 35],
      xLabel: meta.scatterX,
      yLabel: meta.scatterY,
      unit: this.config.unit,
      formatY: this.config.formatY,
      points: pts,
      counterText: '已点亮 ' + this.litElementCount() + ' / ' + total
    });
  };

  CardTask.prototype.renderStats = function () {
    var self = this;
    var flipped = this.flippedItems().length;
    var placed = Object.keys(this.records).filter(function (id) {
      return self.records[id].placed && self.records[id].correct;
    }).length;
    var repeats = Object.keys(this.records).reduce(function (sum, id) {
      var n = self.records[id].flipCount;
      return sum + Math.max(0, n - 1);
    }, 0);

    var row = document.getElementById('stat-row');
    if (!row) return;
    row.innerHTML =
      '<div class="mini-stat"><div class="ms-label">已翻面</div><div class="ms-value">' + flipped + '<small>/' + this.items.length + '</small></div></div>' +
      '<div class="mini-stat"><div class="ms-label">已归位</div><div class="ms-value">' + placed + '</div></div>' +
      '<div class="mini-stat"><div class="ms-label">重复点击</div><div class="ms-value">' + repeats + '</div></div>';
  };

  CardTask.prototype.renderSide = function () {
    var info = document.getElementById('recent-info');
    if (!info) return;
    if (!this.lastSelected) {
      info.textContent = '最近翻面：—';
      return;
    }
    var item = this.lastSelected;
    info.innerHTML = '最近翻面：<b>' + item.sym + '</b> · ' +
      this.config.displayValue(item) + ' ' + this.config.unit + '（' + item.name + '）';
  };

  CardTask.prototype.renderCalc = function () {
    var self = this;
    var select = document.getElementById('calc-select');
    var valueBox = document.getElementById('calc-value');
    if (!select || !valueBox) return;

    var flipped = this.flippedItems();
    var keep = select.value;

    if (!flipped.length) {
      select.innerHTML = '<option value="">先翻面一张卡片</option>';
      select.disabled = true;
      valueBox.textContent = '—';
      return;
    }

    select.disabled = false;
    select.innerHTML = flipped.map(function (item) {
      return '<option value="' + item.id + '">' + item.sym + ' · ' +
        self.config.displayValue(item) + ' ' + self.config.unit + '</option>';
    }).join('');

    if (keep && this.itemById[keep]) select.value = keep;

    var item = this.itemById[select.value] || flipped[0];
    if (!item) {
      valueBox.textContent = '—';
      return;
    }

    var value = this.config.numericValue(item);
    if (value === null || isNaN(value)) {
      valueBox.textContent = '—';
      return;
    }

    var diff = Math.abs(value - this.config.refValue) / this.config.refValue * 100;
    valueBox.innerHTML = diff.toFixed(1) + '<small>%</small>';
  };

  /* ================= 记录面板 ================= */
  CardTask.prototype.bindButtons = function () {
    var self = this;
    var overlay = document.getElementById('record-overlay');

    document.getElementById('btn-records').addEventListener('click', function () {
      self.openRecords();
    });
    document.getElementById('btn-record-close').addEventListener('click', function () {
      overlay.classList.remove('is-open');
    });
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) overlay.classList.remove('is-open');
    });
    document.getElementById('btn-record-reset').addEventListener('click', function () {
      self.reset();
    });
    document.getElementById('btn-reset').addEventListener('click', function () {
      self.reset();
    });
  };

  CardTask.prototype.openRecords = function () {
    var self = this;
    var flipped = this.flippedItems();

    document.getElementById('record-title').textContent =
      this.config.meta.title + ' · 探究记录';

    // 统计
    var placedCount = Object.keys(this.records).filter(function (id) {
      return self.records[id].placed && self.records[id].correct;
    }).length;
    var repeats = Object.keys(this.records).reduce(function (sum, id) {
      return sum + Math.max(0, self.records[id].flipCount - 1);
    }, 0);
    var times = Object.keys(this.records).map(function (id) {
      return self.records[id].timeSpent;
    }).filter(function (t) { return typeof t === 'number'; });
    var avg = times.length ? times.reduce(function (a, b) { return a + b; }, 0) / times.length : null;

    document.getElementById('record-stats').innerHTML =
      '<div class="stat-box"><div class="stat-label">已翻面</div><div class="stat-value">' +
        flipped.length + '<small>/ ' + this.items.length + '</small></div></div>' +
      '<div class="stat-box"><div class="stat-label">已正确归位</div><div class="stat-value">' +
        placedCount + '<small>/ ' + this.items.length + '</small></div></div>' +
      '<div class="stat-box"><div class="stat-label">平均停留</div><div class="stat-value">' +
        (avg === null ? '—' : avg.toFixed(1) + '<small>s</small>') + '</div></div>' +
      '<div class="stat-box"><div class="stat-label">重复点击</div><div class="stat-value">' +
        repeats + '<small>次</small></div></div>';

    // 历史表格：按首次点击顺序
    var table = document.getElementById('record-table');
    if (!flipped.length) {
      table.innerHTML = '<tr><td class="record-empty">还没有翻面记录，先回页面翻一张卡片吧。</td></tr>';
    } else {
      var rows = flipped.map(function (item, index) {
        var rec = self.records[item.id];
        var state = rec.correct ? '<span class="done">已归位</span>'
          : (rec.placed ? '<span class="undone">放错待纠正</span>' : '<span class="muted">未归位</span>');
        var stay = rec.timeSpent === null || rec.timeSpent === undefined
          ? (rec.firstFlipAt ? '<span class="muted">计时中</span>' : '—')
          : window.App.formatSeconds(rec.timeSpent);

        return '<tr>' +
          '<td class="num">' + (index + 1) + '</td>' +
          '<td>' + item.sym + '　<span class="muted">' + item.name + '</span></td>' +
          '<td class="num">' + rec.flipCount + '</td>' +
          '<td class="num">' + Math.max(0, rec.flipCount - 1) + '</td>' +
          '<td class="num">' + stay + '</td>' +
          '<td>' + state + '</td>' +
        '</tr>';
      }).join('');

      table.innerHTML =
        '<thead><tr>' +
          '<th>点击顺序</th><th>卡片</th><th>翻面次数</th><th>重复点击</th><th>停留时间</th><th>归位状态</th>' +
        '</tr></thead><tbody>' + rows + '</tbody>';
    }

    // 记录面板里的散点图（独立渲染，尺寸更大）
    var meta = this.config.meta;
    window.Charts.scatter(document.getElementById('record-chart'), {
      width: 620,
      height: 640,
      xMin: 0.5,
      xMax: 36.5,
      yMin: meta.yMin,
      yMax: meta.yMax,
      yTicks: 7,
      xTicks: [1, 5, 10, 15, 20, 25, 30, 35],
      xLabel: meta.scatterX,
      yLabel: meta.scatterY,
      unit: this.config.unit,
      formatY: this.config.formatY,
      points: this.scatterPoints(),
      counterText: '已点亮 ' + this.litElementCount() + ' / ' + this.config.chartTotal
    });

    document.getElementById('record-overlay').classList.add('is-open');
    // 打开后按当前窗口重新缩放记录面板
    window.App.fitStage();
  };

  /* ================= 存储与重置 ================= */
  CardTask.prototype.save = function () {
    window.App.save(this.key, {
      records: this.records,
      orderCount: this.orderCount
    });
  };

  CardTask.prototype.reset = function () {
    if (!confirm('确定重置本任务的记录吗？卡片、归位与散点都会回到初始状态。')) return;
    window.App.clear(this.key);
    location.reload();
  };

  window.CardTask = CardTask;
})();
