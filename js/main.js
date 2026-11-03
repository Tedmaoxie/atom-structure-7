/* =====================================================================
   main.js —— 主网页：读取各任务进度、支持单任务清空记录
   ===================================================================== */
(function () {
  'use strict';

  var TOTAL = {
    task1: 26, // 任务一可点亮的主族与 0 族元素（1—20、31—36），共 26 个
    task2: 32, // 任务二卡片池 32 张
    task3: 19, // 任务三离子卡片 19 张
    task4: 32  // 任务四卡片池 32 张
  };

  // 统计已翻面的卡片数量（任务二、三、四）
  function flippedCount(records) {
    if (!records) return 0;
    return Object.keys(records).filter(function (id) {
      return records[id] && records[id].flipCount > 0;
    }).length;
  }

  function readProgress(task) {
    var data = window.App.load(task);
    if (!data) return 0;

    if (task === 'task1') {
      return Array.isArray(data.lit) ? data.lit.length : 0;
    }
    return flippedCount(data.records);
  }

  function paint(task) {
    var done = Math.min(readProgress(task), TOTAL[task]);
    var bar = document.querySelector('[data-bar="' + task + '"]');
    var label = document.querySelector('[data-progress="' + task + '"]');
    var name = { task1: '已点亮', task2: '已翻面', task3: '已翻面', task4: '已翻面' }[task];

    if (bar) bar.style.width = Math.round(done / TOTAL[task] * 100) + '%';
    if (label) label.textContent = name + ' ' + done + ' / ' + TOTAL[task];
  }

  function paintAll() {
    Object.keys(TOTAL).forEach(paint);
  }

  // 单任务清空记录
  document.querySelectorAll('.task-reset').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      // 阻止点击穿透到外层卡片链接
      event.preventDefault();
      event.stopPropagation();

      var task = btn.dataset.reset;
      if (!confirm('确定清空该任务的本地记录吗？卡片与散点会回到初始状态。')) return;

      window.App.clear(task);
      paint(task);
      window.App.toast('该任务记录已清空');
    });
  });

  // 全部清空
  document.getElementById('btn-reset-all').addEventListener('click', function () {
    if (!confirm('确定清空全部四个任务的记录吗？此操作不可撤销。')) return;
    Object.keys(TOTAL).forEach(function (task) { window.App.clear(task); });
    paintAll();
    window.App.toast('全部记录已清空');
  });

  // 盲选任务：默认只显示背面，点击封面才翻到正面
  document.querySelectorAll('.flip-card').forEach(function (card) {
    var cover = card.querySelector('.flip-cover');
    if (!cover) return;
    cover.addEventListener('click', function () {
      card.classList.add('is-flipped');
    });
  });

  // 正面右上角的“翻回背面”，方便下一组重新盲选
  document.querySelectorAll('.flip-back').forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var card = btn.closest('.flip-card');
      if (card) card.classList.remove('is-flipped');
    });
  });

  paintAll();
})();
