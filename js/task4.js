/* =====================================================================
   task4.js —— 任务四：常见化合价卡片探究
   数据：1—20 号非稀有气体共 17 张，高中常见价态（含负价）
   重点：最高正价与最低负价分色标注，与周期表位置建立联系
   ===================================================================== */
(function () {
  'use strict';

  var meta = window.CHEM.meta.task4;

  var items = window.CHEM.valenceCards.map(function (el) {
    return {
      id: 'e' + el.z,
      z: el.z,
      sym: el.sym,
      name: el.name,
      valences: el.valences
    };
  });

  // 价态写法：正价带“+”，负价保留“−”
  function valenceText(v) {
    if (v > 0) return '+' + v;
    return String(v);
  }

  // 找出最高正价与最低负价，用于分色
  function bounds(list) {
    var maxPos = 0;
    var minNeg = 0;
    list.forEach(function (v) {
      if (v > maxPos) maxPos = v;
      if (v < minNeg) minNeg = v;
    });
    return { maxPos: maxPos, minNeg: minNeg };
  }

  // 每张卡片的价态颜色：最高正价深青、最低负价橙色、其余浅青
  function valenceClass(v, b) {
    if (v > 0 && v === b.maxPos) return 'max-pos';
    if (v < 0 && v === b.minNeg) return 'min-neg';
    return '';
  }

  // 周期表格子里显示价态范围，例如 -3~+5
  function chipValue(item) {
    var list = item.valences;
    if (list.length === 1) return valenceText(list[0]);
    return valenceText(list[0]) + '~' + valenceText(list[list.length - 1]);
  }

  var task = new window.CardTask({
    storageKey: 'task4',
    eyebrow: '任务四 · 常见化合价',
    meta: meta,
    items: items,
    unit: '价',
    chartTotal: items.length,
    sideHint: '散点横坐标为原子序数，纵坐标为常见价态。深青点为最高正价，橙色点为最低负价，浅青点为其他常见价态。',

    chartable: function () { return true; },
    // 一个元素的全部常见价态同时点亮，并按“最高正价 / 最低负价 / 其他”着色
    pointsFor: function (item) {
      var b = bounds(item.valences);
      return item.valences.map(function (v) {
        var color = '#7fa8a0';
        if (v > 0 && v === b.maxPos) color = '#0f766e';
        else if (v < 0 && v === b.minNeg) color = '#c2693c';
        return { x: item.z, y: v, label: item.sym, color: color };
      });
    },
    numericValue: function (item) { return item.valences[0]; },
    displayValue: function (item) { return item.valences.map(valenceText).join('、'); },
    formatY: valenceText,
    chipValue: chipValue,

    // 卡片正面：只显示元素符号，序数和中文名都留给学生自己判断
    frontHTML: function (item) {
      return '<span class="card-fold"></span>' +
        '<span class="card-sym">' + item.sym + '</span>';
    },

    // 卡片背面：常见价态，最高正价与最低负价用不同底色标出
    backHTML: function (item) {
      var b = bounds(item.valences);
      var tags = item.valences.map(function (v) {
        var cls = valenceClass(v, b);
        return '<span class="val-tag' + (cls ? ' ' + cls : '') + '">' + valenceText(v) + '</span>';
      }).join('');
      return '<div class="card-unit" style="margin:0 0 6px">' + item.name + ' · 常见价态</div>' +
        '<div class="card-valences">' + tags + '</div>' +
        '<div class="card-source" style="width:86%">1—20 号元素</div>';
    }
  });

  task.init();
})();
