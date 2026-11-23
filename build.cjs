/**
 * 构建两个发行版：GreasyFork 版 / ScriptCat 版
 *
 * 流程：源码 → strip-debug（去调试）→ strip-comments（去注释）→ 去多余空行
 *      → 按平台改写头信息（仅 @homepageURL/@supportURL/@updateURL/@downloadURL 不同）
 *
 * 用法：node build.cjs
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const WB = path.join(ROOT, '..', '.workbuddy');
const SRC = path.join(ROOT, 'yaohuo-next.user.js');
const TMP1 = path.join(ROOT, '.build.nodebug.js');
const TMP2 = path.join(ROOT, '.build.stripped.js');

const GF_URL = 'https://greasyfork.org/zh-CN/scripts/605248-%E5%A6%96%E7%81%AB-next';
const SC_URL = 'https://scriptcat.org/zh-CN/script-show-page/9155';

// 1. 去调试代码
execFileSync(process.execPath, [path.join(WB, 'strip-debug.cjs'), SRC, TMP1], { stdio: 'inherit' });
// 2. 去注释（保留 UserScript 头）
execFileSync(process.execPath, [path.join(WB, 'strip-comments.cjs'), TMP1, TMP2], { stdio: 'inherit' });

// 3. 去多余空行：行尾空白清掉，连续空行折叠成一个
let code = fs.readFileSync(TMP2, 'utf8')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .replace(/^\n+/, '');

const headEnd = code.indexOf('// ==/UserScript==');
if (headEnd < 0) throw new Error('找不到 UserScript 头结尾');
const head = code.slice(0, headEnd);
const body = code.slice(headEnd);
if (!/^\s*\/\/ ==\/UserScript==/.test(body)) throw new Error('头结尾解析异常');

// 4. 按平台改写头字段（值为 null 表示删除该字段）
function buildVariant(fields) {
  let h = head.replace(/\n$/, '');
  for (const [key, val] of Object.entries(fields)) {
    const line = new RegExp('^// @' + key + '  .*\\n?', 'm');
    if (val === null) { h = h.replace(line, ''); continue; }
    if (line.test(h)) h = h.replace(line, '// @' + key + '   ' + val + '\n');
    else h += '\n// @' + key + '   ' + val;   // 追加到 @license 之后
  }
  return h + '\n' + body;
}

const gf = buildVariant({
  homepageURL: GF_URL,
  supportURL: GF_URL + '/feedback',
  updateURL: 'https://update.greasyfork.org/scripts/605248/yaohuo-next.user.js',
  downloadURL: 'https://update.greasyfork.org/scripts/605248/yaohuo-next.user.js',
});

// ScriptCat 版：更新交给 ScriptCat 后台管理（别留 GF 的 update/download 地址）
const sc = buildVariant({
  homepageURL: SC_URL,
  supportURL: SC_URL,
  updateURL: null,
  downloadURL: null,
});

const OUT_GF = path.join(ROOT, 'yaohuo-next-gf.user.js');
const OUT_SC = path.join(ROOT, 'yaohuo-next-sc.user.js');
fs.writeFileSync(OUT_GF, gf);
fs.writeFileSync(OUT_SC, sc);

// 5. 清理临时文件
for (const f of [TMP1, TMP2]) { try { fs.unlinkSync(f); } catch (_) {} }

// 6. 两版代码体必须完全一致（仅头信息不同）
const bodies = [gf, sc].map((t) => t.slice(t.indexOf('// ==/UserScript==')));
console.log('\n[build] 代码体一致性:', bodies[0] === bodies[1] ? 'OK' : '不一致(错误!)');
console.log('[build] GF:', OUT_GF, gf.length, 'chars');
console.log('[build] SC:', OUT_SC, sc.length, 'chars');
