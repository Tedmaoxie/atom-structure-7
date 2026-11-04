/* =====================================================================
   theme.js —— 日间 / 夜间主题切换
   1. 打开页面时先读取上次选择，避免白屏闪一下
   2. 点击任意 [data-theme-toggle] 按钮切换主题
   3. 切换后通知各页面重绘（散点图、原子结构图等用 JS 画的图）
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'chem7.theme';

  // 读取上次保存的主题；浏览器禁用 localStorage 时默认日间模式
  function readSaved() {
    try {
      return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  // 把主题写到 <html data-theme="...">，CSS 全靠这个属性切换配色
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    // 同步所有切换按钮的文字
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = theme === 'dark' ? '日间模式' : '夜间模式';
      btns[i].setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  function set(theme, remember) {
    apply(theme);
    if (remember) {
      try { localStorage.setItem(KEY, theme); } catch (e) { /* 忽略 */ }
    }
    // 通知页面重绘图表与结构示意图
    document.dispatchEvent(new CustomEvent('chemthemechange', { detail: { theme: theme } }));
  }

  // 页面一进来就先套用主题（此时 CSS 还没渲染完，不会闪烁）
  apply(readSaved());

  document.addEventListener('DOMContentLoaded', function () {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        set(next, true);
      });
    }
    // DOM 就绪后再同步一次按钮文字
    apply(document.documentElement.getAttribute('data-theme') || 'light');
  });

  // 供其它脚本读取当前主题
  window.ChemTheme = {
    current: function () {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    },
    /* 读取 CSS 变量，让图表/画布的颜色跟随主题 */
    color: function (name, fallback) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = (v || '').trim();
      return v || fallback;
    }
  };
})();
