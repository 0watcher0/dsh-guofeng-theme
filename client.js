/**
 * dsh-guofeng-theme — 国风太极主题 browser half（loader 格式，零构建）。
 * 作用：在页面 <head> 注入指向宿主 /guofeng/guofeng.css 的样式表链接。
 * 宿主半 index.js 负责注册 /guofeng/guofeng.css 与 /guofeng/taiji.jpg 路由；
 * 本半负责在浏览器端幂等注入样式表（宿主 tapIndex 已注入时不再重复）。
 */
window.__ModuleLoader__.load({
  id: 'dsh-guofeng-theme',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var STYLESHEET_HREF = '/guofeng/guofeng.css';

    function injectStylesheet() {
      if (typeof document === 'undefined') return;
      var existing = document.querySelector('link[href="' + STYLESHEET_HREF + '"]');
      if (existing) return existing;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = STYLESHEET_HREF;
      link.dataset.plugin = 'dsh-guofeng-theme';
      document.head.appendChild(link);
      return link;
    }

    function apply(ctx) {
      ctx.effect(() => {
        var link = injectStylesheet();
        return () => {
          if (link && link.parentNode) link.parentNode.removeChild(link);
        };
      }, 'dsh-guofeng-theme: inject stylesheet');
    }

    module.exports = { name: 'dsh-guofeng-theme', inject: [], apply: apply };
    return module.exports;
  }
});
