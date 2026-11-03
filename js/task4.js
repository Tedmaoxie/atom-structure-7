/* =====================================================================
   task4.js —— 任务四：常见化合价卡片探究
   数据：1—36 号非稀有气体共 32 张（含过渡金属），高中常见价态（含负价）
   ===================================================================== */
(function () {
  'use strict';

  var meta = window.CHEM.meta.task4;

  var items = window.CHEM.elementCards.map(function (el) {
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
    refLabel: 'Al',
    refValue: 121,
    chartTotal: items.length,
    sideHint: '散点图：横坐标原子序数，纵坐标常见价态，一个元素可以有多个点，翻面后同时点亮。',

    chartable: function () { return true; },
    // 一个元素的全部常见价态同时点亮
    pointsFor: function (item) {
      return item.valences.map(function (v) {
        return { x: item.z, y: v, label: item.sym };
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

    // 卡片背面：该元素的常见价态（含负价）
    backHTML: function (item) {
      var tags = item.valences.map(function (v) {
        return '<span class="val-tag' + (v < 0 ? ' neg' : '') + '">' + valenceText(v) + '</span>';
      }).join('');
      return '<div class="card-unit" style="margin:0 0 6px">' + item.name + ' · 常见价态</div>' +
        '<div class="card-valences">' + tags + '</div>' +
        '<div class="card-source" style="width:86%">高中常见价态</div>';
    },

    tableNote: '<b>高中常见价态</b>（含负价）。翻面后该元素的所有常见价态会在散点图中同时点亮；柱状图只显示当前选中元素，不汇总所有元素。'
  });

  task.init();
})();
