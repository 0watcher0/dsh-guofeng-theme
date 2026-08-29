// dsh-guofeng-theme — 国风主题插件（DSH Web 皮肤）
// 一个极小的 host 插件：向 webServer 注册两条静态路由（背景图、样式表），
// 并通过 tapIndex 在每次返回的 index.html 的 <head> 末尾注入样式表链接；
// 浏览器半 client.js 也会幂等注入（宿主已注入则跳过）。
// 加载方式：profile 的 dsh.profile.bundles 通过本包的 cordis.patch.yml（bundle 层）加载。
//
// 注意 Cordis 语义：ctx.effect(callback) 立即执行 callback，
// callback 的【返回值】才是销毁函数——绝不能在 callback 体内做清理。
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), 'assets');
const cache = new Map();
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

async function serveFile(res, file, maxAge = 3600) {
  let body = cache.get(file);
  if (body === undefined) {
    body = await readFile(join(ASSETS, file));
    cache.set(file, body);
  }
  res.writeHead(200, {
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': `public, max-age=${maxAge}`,
  });
  res.end(body);
}

/** 在 <head> 末尾注入样式表链接（幂等：已注入则原样返回）。 */
function injectStylesheet(html) {
  const link = '<link rel="stylesheet" href="/guofeng/guofeng.css">';
  if (html.includes(link)) return html;
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) return `${html}\n${link}`;
  return `${html.slice(0, headEnd)}${link}${html.slice(headEnd)}`;
}

export function apply(ctx) {
  // 等待 webServer 服务就绪后注册路由与 index 注入。
  ctx.inject(['webServer'], (serverCtx) => {
    // effect 立即执行注册；返回值是 teardown（随插件生命周期自动清理）。
    serverCtx.effect(() => {
      const disposers = [
        serverCtx.webServer.register({
          kind: 'exact',
          path: '/guofeng/taiji.jpg',
          handler: (req, res) => serveFile(res, 'taiji.jpg'),
        }),
        serverCtx.webServer.register({
          kind: 'exact',
          path: '/guofeng/guofeng.css',
          handler: (req, res) => serveFile(res, 'guofeng.css', 600),
        }),
        serverCtx.webServer.tapIndex((html) => injectStylesheet(html)),
      ];
      return () => {
        for (const dispose of disposers) dispose();
      };
    }, 'guofeng-theme: routes + stylesheet injection');
  });
}
