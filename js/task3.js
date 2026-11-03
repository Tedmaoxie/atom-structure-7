/* =====================================================================
   task3.js —— 任务三：离子半径与核外电子排布
   数据：常见简单离子，教材常用离子半径 / pm
   核心对比：Mg²⁺ 72 > Al³⁺ 53.5 > Si⁴⁺ 40（三者核外均为 10 电子）
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
    chartTotal: items.length,
    sideHint: '散点横坐标为母元素原子序数，纵坐标为离子半径。同一周期内，阳离子半径随核电荷数增大而减小；阴离子半径明显大于同周期阳离子。',

    chartable: function () { return true; },
    pointsFor: function (item) { return [{ x: item.z, y: item.value, label: item.sym }]; },
    numericValue: function (item) { return item.value; },
    displayValue: function (item) { return item.value; },
    chipValue: function (item) { return item.value; },

    // 叠加对照：已翻面离子对应的原子半径（共价半径），用另一种颜色标出
    overlay: {
      label: '原子半径',
      color: '#c2693c',
      points: function (flipped) {
        return flipped.map(function (item) {
          var el = window.CHEM.byZ[item.z];
          return el && el.covalent ? { x: el.z, y: el.covalent, label: el.sym } : null;
        }).filter(Boolean);
      }
    },

    // 卡片正面：只显示离子符号，母元素序号和中文名留给学生自己判断
    frontHTML: function (item) {
      return '<span class="card-fold"></span>' +
        '<span class="card-sym ion">' + item.sym + '</span>';
    },

    // 卡片背面：离子半径
    backHTML: function (item) {
      return '<div class="card-value">' + item.value + '<small>pm</small></div>' +
        '<div class="card-unit">离子半径</div>' +
        '<div class="card-source">教材常用数据</div>';
    }
  });

  task.init();
})();
