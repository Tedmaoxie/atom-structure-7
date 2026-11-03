/* =====================================================================
   统一数据表 —— 本项目唯一数据源
   说明：所有数值均为本地预设，课堂使用时不联网、不实时生成。
   数据口径：
     · 共价半径：Cordero 等，2008（单键共价半径），单位 pm
     · 离子半径：Shannon，1976，六配位（CN = 6），单位 pm
     · 化合价：高中常见价态（人教版必修一范围）
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1—36 号元素
       z        原子序数
       sym      元素符号
       name     中文名
       period   周期
       col      周期表列号（1—18，用于排布周期表格子）
       shells   电子层排布（任务一判定用，按基态真实排布）
       covalent 共价半径 / pm
       valences 高中常见价态（含负价）
       block    main = 主族与 0 族；transition = 过渡金属
       noble    是否稀有气体（不进任务二、四卡片池）
     ------------------------------------------------------------------ */
  var elements = [
    { z: 1,  sym: 'H',  name: '氢', period: 1, col: 1,  shells: [1],             covalent: 31,  valences: [-1, 1],             block: 'main',       noble: false },
    { z: 2,  sym: 'He', name: '氦', period: 1, col: 18, shells: [2],             covalent: null, valences: [0],                block: 'main',       noble: true  },
    { z: 3,  sym: 'Li', name: '锂', period: 2, col: 1,  shells: [2, 1],          covalent: 128, valences: [1],                block: 'main',       noble: false },
    { z: 4,  sym: 'Be', name: '铍', period: 2, col: 2,  shells: [2, 2],          covalent: 96,  valences: [2],                block: 'main',       noble: false },
    { z: 5,  sym: 'B',  name: '硼', period: 2, col: 13, shells: [2, 3],          covalent: 84,  valences: [3],                block: 'main',       noble: false },
    { z: 6,  sym: 'C',  name: '碳', period: 2, col: 14, shells: [2, 4],          covalent: 76,  valences: [-4, 2, 4],         block: 'main',       noble: false },
    { z: 7,  sym: 'N',  name: '氮', period: 2, col: 15, shells: [2, 5],          covalent: 71,  valences: [-3, 2, 4, 5],      block: 'main',       noble: false },
    { z: 8,  sym: 'O',  name: '氧', period: 2, col: 16, shells: [2, 6],          covalent: 66,  valences: [-2],               block: 'main',       noble: false },
    { z: 9,  sym: 'F',  name: '氟', period: 2, col: 17, shells: [2, 7],          covalent: 57,  valences: [-1],               block: 'main',       noble: false },
    { z: 10, sym: 'Ne', name: '氖', period: 2, col: 18, shells: [2, 8],          covalent: null, valences: [0],               block: 'main',       noble: true  },
    { z: 11, sym: 'Na', name: '钠', period: 3, col: 1,  shells: [2, 8, 1],       covalent: 166, valences: [1],                block: 'main',       noble: false },
    { z: 12, sym: 'Mg', name: '镁', period: 3, col: 2,  shells: [2, 8, 2],       covalent: 141, valences: [2],                block: 'main',       noble: false },
    { z: 13, sym: 'Al', name: '铝', period: 3, col: 13, shells: [2, 8, 3],       covalent: 121, valences: [3],                block: 'main',       noble: false },
    { z: 14, sym: 'Si', name: '硅', period: 3, col: 14, shells: [2, 8, 4],       covalent: 111, valences: [-4, 4],            block: 'main',       noble: false },
    { z: 15, sym: 'P',  name: '磷', period: 3, col: 15, shells: [2, 8, 5],       covalent: 107, valences: [-3, 3, 5],         block: 'main',       noble: false },
    { z: 16, sym: 'S',  name: '硫', period: 3, col: 16, shells: [2, 8, 6],       covalent: 105, valences: [-2, 4, 6],         block: 'main',       noble: false },
    { z: 17, sym: 'Cl', name: '氯', period: 3, col: 17, shells: [2, 8, 7],       covalent: 102, valences: [-1, 1, 5, 7],       block: 'main',       noble: false },
    { z: 18, sym: 'Ar', name: '氩', period: 3, col: 18, shells: [2, 8, 8],       covalent: null, valences: [0],               block: 'main',       noble: true  },
    { z: 19, sym: 'K',  name: '钾', period: 4, col: 1,  shells: [2, 8, 8, 1],    covalent: 203, valences: [1],                block: 'main',       noble: false },
    { z: 20, sym: 'Ca', name: '钙', period: 4, col: 2,  shells: [2, 8, 8, 2],    covalent: 176, valences: [2],                block: 'main',       noble: false },
    { z: 21, sym: 'Sc', name: '钪', period: 4, col: 3,  shells: [2, 8, 9, 2],    covalent: 170, valences: [3],                block: 'transition', noble: false },
    { z: 22, sym: 'Ti', name: '钛', period: 4, col: 4,  shells: [2, 8, 10, 2],   covalent: 160, valences: [2, 3, 4],          block: 'transition', noble: false },
    { z: 23, sym: 'V',  name: '钒', period: 4, col: 5,  shells: [2, 8, 11, 2],   covalent: 153, valences: [2, 3, 4, 5],       block: 'transition', noble: false },
    { z: 24, sym: 'Cr', name: '铬', period: 4, col: 6,  shells: [2, 8, 13, 1],   covalent: 139, valences: [2, 3, 6],          block: 'transition', noble: false },
    { z: 25, sym: 'Mn', name: '锰', period: 4, col: 7,  shells: [2, 8, 13, 2],   covalent: 139, valences: [2, 3, 4, 6, 7],    block: 'transition', noble: false },
    { z: 26, sym: 'Fe', name: '铁', period: 4, col: 8,  shells: [2, 8, 14, 2],   covalent: 132, valences: [2, 3],             block: 'transition', noble: false },
    { z: 27, sym: 'Co', name: '钴', period: 4, col: 9,  shells: [2, 8, 15, 2],   covalent: 126, valences: [2, 3],             block: 'transition', noble: false },
    { z: 28, sym: 'Ni', name: '镍', period: 4, col: 10, shells: [2, 8, 16, 2],   covalent: 124, valences: [2],                block: 'transition', noble: false },
    { z: 29, sym: 'Cu', name: '铜', period: 4, col: 11, shells: [2, 8, 18, 1],   covalent: 132, valences: [1, 2],             block: 'transition', noble: false },
    { z: 30, sym: 'Zn', name: '锌', period: 4, col: 12, shells: [2, 8, 18, 2],   covalent: 122, valences: [2],                block: 'transition', noble: false },
    { z: 31, sym: 'Ga', name: '镓', period: 4, col: 13, shells: [2, 8, 18, 3],   covalent: 122, valences: [3],                block: 'main',       noble: false },
    { z: 32, sym: 'Ge', name: '锗', period: 4, col: 14, shells: [2, 8, 18, 4],   covalent: 120, valences: [2, 4],             block: 'main',       noble: false },
    { z: 33, sym: 'As', name: '砷', period: 4, col: 15, shells: [2, 8, 18, 5],   covalent: 119, valences: [-3, 3, 5],         block: 'main',       noble: false },
    { z: 34, sym: 'Se', name: '硒', period: 4, col: 16, shells: [2, 8, 18, 6],   covalent: 120, valences: [-2, 4, 6],         block: 'main',       noble: false },
    { z: 35, sym: 'Br', name: '溴', period: 4, col: 17, shells: [2, 8, 18, 7],   covalent: 120, valences: [-1, 1, 3, 5, 7],    block: 'main',       noble: false },
    { z: 36, sym: 'Kr', name: '氪', period: 4, col: 18, shells: [2, 8, 18, 8],   covalent: null, valences: [0],               block: 'main',       noble: true  }
  ];

  /* ------------------------------------------------------------------
     任务三离子卡片池：常见简单离子，正负离子都有
     数据为教材常用离子半径 / pm
     核心对比：Mg²⁺ 72 > Al³⁺ 53.5 > Si⁴⁺ 40
     ------------------------------------------------------------------ */
  var ions = [
    { id: 'Li+',  z: 3,  sym: 'Li⁺',  name: '锂离子',  r: 76  },
    { id: 'Be2+', z: 4,  sym: 'Be²⁺', name: '铍离子',  r: 45  },
    { id: 'N3-',  z: 7,  sym: 'N³⁻',  name: '氮离子',  r: 146 },
    { id: 'O2-',  z: 8,  sym: 'O²⁻',  name: '氧离子',  r: 140 },
    { id: 'F-',   z: 9,  sym: 'F⁻',   name: '氟离子',  r: 133 },
    { id: 'Na+',  z: 11, sym: 'Na⁺',  name: '钠离子',  r: 102 },
    { id: 'Mg2+', z: 12, sym: 'Mg²⁺', name: '镁离子',  r: 72  },
    { id: 'Al3+', z: 13, sym: 'Al³⁺', name: '铝离子',  r: 53.5 },
    { id: 'Si4+', z: 14, sym: 'Si⁴⁺', name: '硅离子',  r: 40  },
    { id: 'P3-',  z: 15, sym: 'P³⁻',  name: '磷离子',  r: 212 },
    { id: 'S2-',  z: 16, sym: 'S²⁻',  name: '硫离子',  r: 184 },
    { id: 'Cl-',  z: 17, sym: 'Cl⁻',  name: '氯离子',  r: 181 },
    { id: 'K+',   z: 19, sym: 'K⁺',   name: '钾离子',  r: 138 },
    { id: 'Ca2+', z: 20, sym: 'Ca²⁺', name: '钙离子',  r: 100 },
    { id: 'Ga3+', z: 31, sym: 'Ga³⁺', name: '镓离子',  r: 62  },
    { id: 'Ge4+', z: 32, sym: 'Ge⁴⁺', name: '锗离子',  r: 53  },
    { id: 'As3+', z: 33, sym: 'As³⁺', name: '砷离子',  r: 58  },
    { id: 'Se2-', z: 34, sym: 'Se²⁻', name: '硒离子',  r: 198 },
    { id: 'Br-',  z: 35, sym: 'Br⁻',  name: '溴离子',  r: 196 }
  ];

  // 按原子序数快速取元素
  var byZ = {};
  elements.forEach(function (el) { byZ[el.z] = el; });

  // 任务二、四卡片池：1—36 号排除稀有气体，共 32 张
  var elementCards = elements.filter(function (el) { return !el.noble; });

  // 任务四卡片池：只取 1—20 号非稀有气体，共 17 张（不涉及过渡金属）
  var valenceCards = elements.filter(function (el) {
    return el.z <= 20 && !el.noble;
  });

  // 任务二散点点亮范围：主族非稀有元素，共 22 个
  var scatterElements = elements.filter(function (el) {
    return el.block === 'main' && !el.noble;
  });

  // 任务一点亮范围：主族与 0 族（1—20、31—36），共 26 个
  var mainGroupElements = elements.filter(function (el) {
    return el.block === 'main';
  });

  // 各任务的文案与数据口径（页面统一从这里取，避免各处写死）
  var meta = {
    task1: {
      title: '构造原子结构示意图',
      subtitle: '质子数决定元素，电子层排布决定位置',
      statement: '不显示中子，本节课不讨论同位素'
    },
    task2: {
      title: '原子半径卡片探究',
      subtitle: '寻找与铝原子半径相似的元素原子',
      source: 'Cordero 等，2008 · 单键共价半径',
      unitNote: '共价半径 / pm',
      refLabel: 'Al',
      refValue: 121,
      scatterX: '原子序数',
      scatterY: '共价半径 / pm',
      yMin: 0,
      yMax: 220
    },
    task3: {
      title: '离子半径与核外电子排布',
      subtitle: 'Mg²⁺ 与 Al³⁺ 都是 10 电子，半径为何不同？',
      source: '离子半径 / pm · 教材常用数据',
      unitNote: '离子半径 / pm',
      scatterX: '母元素原子序数',
      scatterY: '离子半径 / pm',
      yMin: 0,
      yMax: 240
    },
    task4: {
      title: '常见化合价卡片探究',
      subtitle: '从镁、铝出发，寻找化合价与周期表位置的联系',
      source: '1—20 号元素 · 高中常见价态',
      unitNote: '高中常见价态',
      scatterX: '原子序数',
      scatterY: '常见价态',
      xMin: 0.5,
      xMax: 20.5,
      xTicks: [1, 5, 10, 15, 20],
      yMin: -6,
      yMax: 8,
      yTicks: 7
    }
  };

  // 挂到全局，供各页面脚本共用
  window.CHEM = {
    elements: elements,
    byZ: byZ,
    ions: ions,
    elementCards: elementCards,
    valenceCards: valenceCards,
    scatterElements: scatterElements,
    mainGroupElements: mainGroupElements,
    meta: meta
  };
})();
