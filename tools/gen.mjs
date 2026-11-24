// 生成主页用的自制 SVG（全部为深色面板，浅色/深色主题下都可见）
// 用法：node tools/gen.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'tools/data.json'), 'utf8'));
const outDir = path.join(root, 'assets');

const T = {
  bg0: '#080a0e',
  bg1: '#101520',
  ink: '#ece7e0',
  ink2: '#a79e93',
  ink3: '#6f675c',
  warm: '#e8a06a',
  cool: '#7f9dc9',
  lav: '#a996c4',
  line: 'rgba(255,255,255,0.08)',
};
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function panel(w, h, { rx = 16, id = 'p' } = {}) {
  return `<defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#121722"/><stop offset="0.55" stop-color="#0c1017"/><stop offset="1" stop-color="#0a0d13"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="url(#${id}bg)" stroke="${T.line}"/>`;
}

const label = (x, y, text, { size = 10.5, fill = T.ink3, spacing = 1.6, anchor = 'start' } = {}) =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" letter-spacing="${spacing}" fill="${fill}" text-anchor="${anchor}">${esc(text)}</text>`;

const text = (x, y, s, { size = 13, fill = T.ink, weight = 400, anchor = 'start', font = SANS, opacity = 1, ls = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" letter-spacing="${ls}">${esc(s)}</text>`;

// ---------- 派生统计 ----------
const weeks = data.contributions.weeks;
const days = weeks.flat();
const activeDays = days.filter((d) => d.count > 0).length;
const activeWeeks = weeks.filter((w) => w.some((d) => d.count > 0)).length;
let longest = 0, run = 0;
for (const d of days) { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
const byWeekday = [0, 0, 0, 0, 0, 0, 0];
for (const d of days) byWeekday[d.weekday] += d.count;
const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const busiest = WD[byWeekday.indexOf(Math.max(...byWeekday))];
const maxDay = Math.max(...days.map((d) => d.count), 1);
const total = data.contributions.total;
const repoTotal = data.user.publicRepos;
const langEntries = Object.entries(data.languages).sort((a, b) => b[1] - a[1]);
const langSum = langEntries.reduce((s, [, v]) => s + v, 0);
const langs = langEntries.slice(0, 6).map(([n, v]) => ({ n, pct: (v / langSum) * 100 }));

// ---------- 1. 概览数字 ----------
function statsSvg() {
  const w = 1000, h = 132;
  const cols = [
    { k: total.toLocaleString('en-US'), v: 'CONTRIBUTIONS · 过去一年' },
    { k: `${activeWeeks}/${weeks.length}`, v: 'ACTIVE WEEKS · 活跃周' },
    { k: `${longest}`, v: 'LONGEST STREAK · 最长连续天' },
    { k: `${repoTotal}`, v: 'PUBLIC REPOS · 公开仓库' },
  ];
  const cw = (w - 96) / cols.length;
  let body = '';
  cols.forEach((c, i) => {
    const x = 48 + i * cw;
    if (i > 0) body += `<rect x="${x - 24}" y="36" width="1" height="60" fill="${T.line}"/>`;
    body += text(x, 74, c.k, { size: 38, weight: 300, fill: T.ink, ls: -0.5 });
    body += label(x, 98, c.v, { size: 10, fill: T.ink3 });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="GitHub 概览数字">
${panel(w, h, { id: 'st' })}
${label(48, 26, 'THIS YEAR · AS OF ' + new Date(data.generatedAt).toISOString().slice(0, 10))}
${body}
</svg>`;
}

// ---------- 2. 贡献热力图 ----------
function activitySvg() {
  const w = 1000, h = 236;
  const cell = 13, gap = 4.5, step = cell + gap;
  const x0 = 62, y0 = 76;
  let grid = '';
  const months = [];
  let lastMonth = '';
  weeks.forEach((week, wi) => {
    week.forEach((d) => {
      const x = x0 + wi * step;
      const y = y0 + d.weekday * step;
      const t = d.count === 0 ? 0 : Math.min(1, Math.log1p(d.count) / Math.log1p(maxDay));
      const fill = d.count === 0 ? 'rgba(255,255,255,0.055)' : mix(t);
      grid += `<rect x="${x.toFixed(1)}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${fill}"/>`;
    });
    const m = week[0].date.slice(5, 7);
    if (m !== lastMonth) { lastMonth = m; months.push({ x: x0 + wi * step, m }); }
  });
  const monthLabels = (() => {
    const out = [];
    let lastX = -999;
    for (const mo of months.slice(1)) {
      if (mo.x - lastX < 44) continue;
      if (mo.x > w - 90) continue;
      out.push(label(mo.x, y0 - 10, `${Number(mo.m)}月`, { size: 9, fill: T.ink3, spacing: 0 }));
      lastX = mo.x;
    }
    return out.join('');
  })();
  const wd = [1, 3, 5].map((i) => label(x0 - 10, y0 + i * step + cell - 3, ['一', '三', '五'][[1, 3, 5].indexOf(i)], { size: 9, fill: T.ink3, spacing: 0, anchor: 'end' })).join('');
  const legendX = w - 48 - 5 * (12 + 4);
  let legend = '';
  for (let i = 0; i < 5; i++) legend += `<rect x="${legendX + i * 16}" y="${h - 34}" width="12" height="12" rx="3" fill="${i === 0 ? 'rgba(255,255,255,0.055)' : mix(i / 4)}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="过去一年贡献热力图">
${panel(w, h, { id: 'ac' })}
${label(48, 34, 'CONTRIBUTION HEATMAP · 过去 12 个月')}
${text(w - 48, 34, `${total.toLocaleString('en-US')} contributions`, { size: 13, fill: T.ink2, anchor: 'end' })}
${label(48, 56, `ACTIVE ${activeDays} DAYS · BUSIEST ${busiest}`, { size: 10, fill: T.ink3 })}
${monthLabels}
${wd}
${grid}
${legend}
${label(legendX - 34, h - 24, '少', { size: 9, fill: T.ink3, spacing: 0, anchor: 'end' })}
${label(legendX + 5 * 16 + 4, h - 24, '多', { size: 9, fill: T.ink3, spacing: 0 })}
</svg>`;
}

function mix(t) {
  // 0..1 -> 从暗到暖橙
  const a = [40, 42, 48], b = [232, 160, 106];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c.join(',')})`;
}

// ---------- 3. 语言构成 ----------
function langsSvg() {
  const w = 1000, h = 168;
  const barX = 48, barW = w - 96, barY = 84, barH = 10;
  const colors = ['#e8a06a', '#7f9dc9', '#a996c4', '#8fb08a', '#c98f9b', '#8a8f9c'];
  let x = barX, bar = '';
  langs.forEach((l, i) => {
    const segW = Math.max(2, (l.pct / 100) * barW);
    bar += `<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(1, segW - 2).toFixed(1)}" height="${barH}" rx="4" fill="${colors[i]}"/>`;
    x += segW;
  });
  let legend = '';
  langs.forEach((l, i) => {
    const col = i < 3 ? i : i - 3;
    const row = Math.floor(i / 3);
    const lx = barX + col * ((w - 96) / 3);
    const ly = barY + 46 + row * 30;
    legend += `<rect x="${lx}" y="${ly - 9}" width="8" height="8" rx="2" fill="${colors[i]}"/>`;
    legend += text(lx + 14, ly, l.n, { size: 12.5, fill: T.ink, font: MONO });
    legend += label(lx + 14 + 14 + l.n.length * 7.6, ly, `${l.pct.toFixed(1)}%`, { size: 11, fill: T.ink2, spacing: 0 });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="语言构成">
${panel(w, h, { id: 'lg' })}
${label(48, 36, 'LANGUAGES · 按代码体积')}
${text(w - 48, 36, `${langEntries.length} languages`, { size: 13, fill: T.ink2, anchor: 'end' })}
${text(48, 66, '四个仓里，Python 装了世界，JS 装了界面。', { size: 13.5, fill: T.ink2 })}
${bar}
${legend}
</svg>`;
}

// ---------- 4. 愿景三支柱 ----------
function visionSvg() {
  const w = 1000, h = 452;
  const cols = [
    {
      n: '01', t: '能住进去的世界',
      lines: ['有房间、有街、有人的作息和光影。', '坐下喝杯茶；也能把现实里放不下的', '东西，带进来放一会儿。'],
      c: T.warm,
    },
    {
      n: '02', t: '落回现实的福利',
      lines: ['社区、医疗、住房、学业。', '同一套账本，写得清、查得到；', '不靠口号，靠真花出去的钱。'],
      c: T.cool,
    },
    {
      n: '03', t: '住在这里的人',
      lines: ['这里的人不是流量。', '规则一起写，收益一起分；', '不满意，可以改。'],
      c: T.lav,
    },
  ];
  let body = '';
  cols.forEach((c, i) => {
    const x = 48 + i * 306;
    body += label(x, 108, c.n, { size: 10, fill: c.c, spacing: 2 });
    body += text(x, 146, c.t, { size: 25, weight: 300, fill: T.ink });
    body += `<rect x="${x}" y="162" width="26" height="1" fill="${c.c}" opacity="0.75"/>`;
    c.lines.forEach((l, li) => { body += text(x, 190 + li * 24, l, { size: 13, fill: T.ink2 }); });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="愿景：能住进去的世界、落回现实的福利、住在这里的人">
${panel(w, h, { id: 'vi' })}
<defs>
  <linearGradient id="vline" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${T.warm}" stop-opacity="0"/><stop offset="0.35" stop-color="${T.warm}" stop-opacity="0.55"/><stop offset="1" stop-color="${T.cool}" stop-opacity="0"/>
  </linearGradient>
</defs>
${label(48, 40, 'THE WORLD · 三根柱子')}
${text(w - 48, 40, '缺一根都撑不住', { size: 13, fill: T.ink3, anchor: 'end' })}
<rect x="48" y="60" width="${w - 96}" height="1" fill="url(#vline)"/>
${body}
${text(48, 336, '先让人过得好一点，再谈这个世界能有多大。', { size: 19, weight: 300, fill: '#d9d2c8' })}
${label(w - 48, 336, '2026 · 第一年', { size: 10, fill: T.ink3, anchor: 'end' })}
<rect x="48" y="360" width="${w - 96}" height="1" fill="${T.line}"/>
${text(48, 392, 'AI 让「亲身经历」可以按需定制：剑与魔法、龙与地下城、重来一次的人生，或者再见一面没来得及告别的人。', { size: 13, fill: T.ink2 })}
${text(48, 414, '它也确实能让人躲一会儿。我不打算美化这件事，只希望躲完还能回去把日子过下去。', { size: 13, fill: T.ink2 })}
</svg>`;
}

// ---------- 5. 资产管线 ----------
function pipelineSvg() {
  const w = 1000, h = 356;
  const lanes = [
    {
      k: 'A', t: '体素原生', c: T.warm,
      d: '地形、建筑、墙体、可破坏物 —— 服务器权威',
      r: '体素编辑器 + MCP 结构化工具（get / set / fill / extrude / preview / commit）',
    },
    {
      k: 'B', t: '网格原生', c: T.cool,
      d: '家具、角色、Hero 道具 —— 客户端渲染',
      r: 'Tripo / Blender → glTF，只同步 UUID 与 Transform',
    },
    {
      k: 'C', t: '混合', c: T.lav,
      d: '可破坏的家具、箱子 —— 轮廓用体素，细节用网格',
      r: 'Remesh → 调色板量化 → 体素校验',
    },
  ];
  let body = '';
  lanes.forEach((l, i) => {
    const y = 104 + i * 74;
    body += `<rect x="48" y="${y}" width="2" height="46" fill="${l.c}" opacity="0.7"/>`;
    body += label(66, y + 14, l.k, { size: 10, fill: l.c, spacing: 2 });
    body += text(66, y + 40, l.t, { size: 18, weight: 300, fill: T.ink });
    body += text(178, y + 40, l.d, { size: 13, fill: T.ink2 });
    body += text(560, y + 40, l.r, { size: 12, fill: T.ink3 });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="资产管线：体素、网格、混合">
${panel(w, h, { id: 'pl' })}
${label(48, 40, 'ASSET PIPELINE · 世界怎么被造出来')}
${text(w - 48, 40, '工具可换，契约不换', { size: 13, fill: T.ink3, anchor: 'end' })}
<rect x="48" y="60" width="${w - 96}" height="1" fill="${T.line}"/>
${body}
<rect x="48" y="298" width="${w - 96}" height="1" fill="${T.line}"/>
${text(48, 330, '同一份 MaterialPalette + AssetManifest：材质、预算、碰撞、许可都写进清单，缺一项就进不了官方房间。', { size: 12.5, fill: T.ink2 })}
</svg>`;
}

fs.writeFileSync(path.join(outDir, 'stats.svg'), statsSvg());
fs.writeFileSync(path.join(outDir, 'activity.svg'), activitySvg());
fs.writeFileSync(path.join(outDir, 'langs.svg'), langsSvg());
fs.writeFileSync(path.join(outDir, 'vision-2.svg'), visionSvg());
fs.writeFileSync(path.join(outDir, 'pipeline.svg'), pipelineSvg());

console.log(JSON.stringify({ total, activeDays, activeWeeks, longest, busiest, repoTotal, langs: langs.map((l) => `${l.n} ${l.pct.toFixed(1)}%`) }, null, 2));
