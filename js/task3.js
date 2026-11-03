/* =====================================================================
   task3.js —— 任务三：离子半径卡片探究
   数据：主族常见离子，六配位（CN = 6）Shannon 离子半径 / pm
   核心对比：Mg²⁺ 72 > Al³⁺ 53.5 > Si⁴⁺ 40
   ===================================================================== */
(function () {
  'use strict';

  var meta = window.CHEM.meta.task3;

  var items = window.CHEM.ions.map(function (ion) {
    return {
      id: 'i' + ion.id,
      z: ion.z,       // 母元素原子序数，也是归位格子位置
      sym: ion.sym,
      name: ion.name,
      value: ion.r
    };
  });

  var task = new window.CardTask({
    storageKey: 'task3',
    eyebrow: '任务三 · 离子半径',
    meta: meta,
    items: items,
    unit: 'pm',
    refLabel: meta.refLabel,   // Al³⁺
    refValue: meta.refValue,   // 53.5 pm
    chartTotal: items.length,
    sideType: 'info',
    sideHint: '散点横坐标为母元素原子序数，纵坐标为六配位离子半径。可重点比较 Na⁺、Mg²⁺、Al³⁺ 与 O²⁻、F⁻ 等离子的半径关系。',

    chartable: function () { return true; },
    pointsFor: function (item) { return [{ x: item.z, y: item.value, label: item.sym }]; },
    numericValue: function (item) { return item.value; },
    displayValue: function (item) { return item.value; },
    chipValue: function (item) { return item.value; },

    // 卡片正面：只显示离子符号，母元素序号和中文名留给学生自己判断
    frontHTML: function (item) {
      return '<span class="card-fold"></span>' +
        '<span class="card-sym ion">' + item.sym + '</span>';
    },

    // 卡片背面：六配位离子半径 + 数据口径
    backHTML: function (item) {
      return '<div class="card-value">' + item.value + '<small>pm</small></div>' +
        '<div class="card-unit">六配位离子半径</div>' +
        '<div class="card-source">Shannon，1976<br>CN = 6</div>';
    },

    tableNote: '<b>六配位离子半径 / pm</b> · Shannon，1976（CN = 6）。离子卡片归位到母元素所在的周期表格子，便于比较同一周期内阳离子、阴离子的半径变化。'
  });

  task.init();
})();
