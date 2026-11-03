/* =====================================================================
   task2.js —— 任务二：原子半径卡片探究
   数据：1—36 号非稀有气体元素卡片（32 张），共价半径 / pm
   ===================================================================== */
(function () {
  'use strict';

  var meta = window.CHEM.meta.task2;

  // 卡片数据：任务二使用共价半径
  var items = window.CHEM.elementCards.map(function (el) {
    return {
      id: 'e' + el.z,
      z: el.z,
      sym: el.sym,
      name: el.name,
      value: el.covalent,
      block: el.block
    };
  });

  var task = new window.CardTask({
    storageKey: 'task2',
    eyebrow: '任务二 · 原子半径',
    meta: meta,
    items: items,
    unit: 'pm',
    refLabel: meta.refLabel,
    refValue: meta.refValue,
    chartTotal: 22, // 散点图只统计主族非稀有元素
    sideType: 'info',
    sideHint: '过渡金属卡片只用于整理周期表，不进入散点图。散点横坐标为原子序数，纵坐标为共价半径，坐标轴固定不缩放。',

    // 只有主族（含 0 族以外的非稀有）元素进入散点图
    chartable: function (item) { return item.block === 'main'; },
    pointsFor: function (item) { return [{ x: item.z, y: item.value, label: item.sym }]; },
    numericValue: function (item) { return item.value; },
    displayValue: function (item) { return item.value; },
    chipValue: function (item) { return item.value; },

    // 卡片正面：只显示元素符号，序数和中文名都留给学生自己判断
    frontHTML: function (item) {
      return '<span class="card-fold"></span>' +
        '<span class="card-sym">' + item.sym + '</span>';
    },

    // 卡片背面：只留数值，数据来源统一写在各页"数据口径"里，避免每张卡重复说明
    backHTML: function (item) {
      return '<div class="card-value">' + item.value + '<small>pm</small></div>';
    },

    tableNote: '<b>共价半径 / pm</b> · Cordero 等，2008（单键共价半径）。把卡片拖回周期表后，观察同一周期、同一主族内半径的变化趋势。'
  });

  task.init();
})();
