// ==UserScript==
// @name         妖火 · Next
// @namespace    https://yaohuo.me/
// @version      3.0.2
// @description  妖火论坛可扩展增强脚本：帖子悬浮预览、用户名片、一键收藏表情、自动吃肉、首页搜索类型选择、跳过外站跳转提示、关键词屏蔽、回复复读机、打赏自定义金额、自定义表情、UBB实时渲染、自动吃肉、跳过外链提示、关键词屏蔽帖子等。
// @author       yaohuo@39874
// @match        *://yaohuo.me/*
// @match        *://*.yaohuo.me/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @homepageURL   https://greasyfork.org/zh-CN/scripts/605248-%E5%A6%96%E7%81%AB-next
// @supportURL   https://greasyfork.org/zh-CN/scripts/605248-%E5%A6%96%E7%81%AB-next/feedback
// @updateURL   https://update.greasyfork.org/scripts/605248/yaohuo-next.user.js
// @downloadURL   https://update.greasyfork.org/scripts/605248/yaohuo-next.user.js
// @license      MIT
// ==/UserScript==
(function () {
  'use strict';
  if (window.__yhxLoaded) return;
  window.__yhxLoaded = true;
  const W = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
  const VERSION = '3.0.2';
  const NS = 'yhx';
  const Store = {
    prefix: 'yhx:v1:',
    get(key, fallback) {
      const full = this.prefix + key;
      try {
        if (typeof GM_getValue === 'function') {
          const raw = GM_getValue(full, null);
          if (raw != null) return typeof raw === 'string' ? JSON.parse(raw) : raw;
          try {
            const ls = localStorage.getItem(full);
            if (ls != null) {
              GM_setValue(full, ls);
              return JSON.parse(ls);
            }
          } catch (_) {}
          return fallback;
        }
      } catch (e) { }
      try {
        const raw = localStorage.getItem(full);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (_) { return fallback; }
    },
    set(key, value) {
      const full = this.prefix + key;
      let raw;
      try { raw = JSON.stringify(value); } catch (_) { return false; }
      let ok = false;
      try {
        if (typeof GM_setValue === 'function') { GM_setValue(full, raw); ok = true; }
      } catch (e) { }
      if (!ok) {
        try { localStorage.setItem(full, raw); ok = true; } catch (e) { }
      }
      return ok;
    },
    del(key) {
      const full = this.prefix + key;
      try { if (typeof GM_deleteValue === 'function') GM_deleteValue(full); } catch (_) {}
      try { localStorage.removeItem(full); } catch (_) {}
    },
  };
  const Bus = (() => {
    const map = new Map();
    return {
      on(type, fn) {
        if (!map.has(type)) map.set(type, new Set());
        map.get(type).add(fn);
        return () => map.get(type).delete(fn);
      },
      emit(type, payload) {
        const set = map.get(type);
        if (!set) return;
        set.forEach((fn) => { try { fn(payload); } catch (e) { } });
      },
    };
  })();
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else el.setAttribute(k, v);
      }
    }
    kids.flat(3).forEach((k) => {
      if (k == null || k === false) return;
      el.appendChild(typeof k === 'string' || typeof k === 'number'
        ? document.createTextNode(String(k)) : k);
    });
    return el;
  }
  const isNarrowScreen = () => !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);
  function debounce(fn, wait) {
    let t = 0;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  const ICON = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>',
    smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r=".7" fill="currentColor"/><circle cx="15" cy="10" r=".7" fill="currentColor"/><path d="M8.5 14c1 1.8 2.3 2.6 3.5 2.6s2.5-.8 3.5-2.6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 12S5.8 5.4 12 5.4 21.8 12 21.8 12 18.2 18.6 12 18.6 2.2 12 2.2 12z"/><circle cx="12" cy="12" r="2.9"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10.5 9.5v5l4-2.5z"/></svg>',
    scrollUpDown: '<svg viewBox="0 0 1024 1024"><path d="M512 341.333333H341.376L341.333333 853.333333H256V341.333333H85.333333l213.333334-213.333333 213.333333 213.333333z m426.666667 341.333334l-213.333334 213.333333-213.333333-213.333333h170.666667V170.666667h85.333333v512h170.666667z" fill="currentColor"></path></svg>',
    eat: '<svg viewBox="0 0 1024 1024"><path d="M960 179.712c0-36.352-32.256-68.608-91.136-90.624-51.712-19.456-120.32-30.208-192.512-30.208-72.192 0-140.8 10.752-192.512 30.208C424.448 111.104 392.192 143.36 392.192 179.712V353.28c-22.528-2.048-46.08-3.584-70.144-3.584-72.192 0-140.8 10.752-192.512 30.208C70.656 402.432 38.4 434.688 38.4 471.04V844.288c0 36.352 32.256 68.608 91.136 90.624 51.712 19.456 120.32 30.208 192.512 30.208 72.192 0 140.8-10.752 192.512-30.208 51.2-19.456 82.432-46.08 89.6-76.8 23.552 2.56 47.616 3.584 71.68 3.584 72.192 0 140.8-10.752 192.512-30.208 58.88-22.016 91.136-54.272 91.136-90.624v-1.536-1.536l0.512-558.08z m-45.568 422.4c0 31.232-93.184 75.776-238.592 75.776-24.064 0-47.616-1.024-70.144-3.584v-93.184c23.04 2.56 46.08 3.584 70.144 3.584 72.192 0 140.8-10.752 192.512-30.208 17.92-6.656 33.28-14.336 46.08-22.528v70.144z m-353.792-1.024c0 31.232-93.184 75.776-238.592 75.776-145.408 0-238.592-45.056-238.592-75.776v-61.952c12.8 8.192 28.16 15.872 46.08 22.528 51.712 19.456 120.32 30.208 192.512 30.208 72.192 0 140.8-10.752 192.512-30.208 17.92-6.656 33.28-14.336 46.08-22.528v61.952z m-477.184 68.096c12.8 8.192 28.16 15.872 46.08 22.528 51.712 19.456 120.32 30.208 192.512 30.208 72.192 0 140.8-10.752 192.512-30.208 17.92-6.656 33.28-14.336 46.08-22.528v53.76c0 31.232-93.184 75.776-238.592 75.776-145.408 0-238.592-45.056-238.592-75.776v-53.76z m830.976-205.312c0 31.232-93.184 75.776-238.592 75.776-24.064 0-47.616-1.024-70.144-3.584V471.04c0-9.728-2.56-19.456-7.168-28.672 25.088 2.56 50.688 4.096 77.312 4.096 72.192 0 140.8-10.752 192.512-30.208 17.92-6.656 33.28-14.336 46.08-22.528v70.144z m0-138.752c0 31.232-93.184 75.776-238.592 75.776-145.408 0-238.592-45.056-238.592-75.776V247.808c12.8 8.192 28.16 15.872 46.08 22.528 51.712 19.456 120.32 30.208 192.512 30.208s140.8-10.752 192.512-30.208c17.92-6.656 33.28-14.336 46.08-22.528v77.312zM675.84 103.424c145.408 0 238.592 45.056 238.592 75.776S821.76 255.488 675.84 255.488c-145.408 0-238.592-45.056-238.592-75.776s93.184-76.288 238.592-76.288zM322.048 394.752c32.256 0 61.44 2.048 88.064 6.144 1.024 0 1.536 0.512 2.56 0.512 92.16 13.312 147.968 45.568 147.968 69.632 0 31.232-93.184 75.776-238.592 75.776-145.408 0-238.592-45.056-238.592-75.776s92.672-76.288 238.592-76.288z m0 525.824c-145.408 0-238.592-45.056-238.592-75.776v-1.536V791.04c12.8 8.192 28.16 15.872 46.08 22.528 51.712 19.456 120.32 30.208 192.512 30.208 72.192 0 140.8-10.752 192.512-30.208 17.92-6.656 33.28-14.336 46.08-22.528V844.8c0 30.72-93.184 75.776-238.592 75.776z m353.792-103.936c-24.064 0-47.616-1.024-70.144-3.584v-93.184c23.04 2.56 46.08 3.584 70.144 3.584 72.192 0 140.8-10.752 192.512-30.208 17.92-6.656 33.28-14.336 46.08-22.528v70.656c0 30.208-92.672 75.264-238.592 75.264z" fill="currentColor"></path></svg>',
    loadMore: '<svg viewBox="0 0 1024 1024"><path d="M121.00300001 512.873c13.001 0 26.314 4.437 36.93799999 13.722l353.413 303.264 353.412-303.264c23.523-20.223 59.126-17.847 79.557 5.574 20.42800001 23.319 17.95099999 58.61-5.675 78.72900001l-390.249 335.04699999c-21.26 18.262-52.834 18.262-74.091 0l-390.248-335.048c-23.63-20.119-26.209-55.41-5.773-78.729 11.142-12.795 26.932-19.29400001 42.717-19.293v0zM121.00300001 512.873z" fill="currentColor"></path><path d="M121.00300001 66.078c13.001 0 26.313 4.438 36.93799999 13.72399999l353.413 303.26800001 353.412-303.27c23.523-20.227 59.126-17.847 79.557 5.574 20.428 23.314 17.951 58.608-5.675 78.72900001l-390.25 335.04799999c-21.255 18.262-52.834 18.262-74.091 0l-390.248-335.048c-23.63-20.12-26.206-55.414-5.77300001-78.729 11.142-12.795 26.932-19.295 42.71700001-19.295v0zM121.00300001 66.078z" fill="currentColor"></path></svg>',
    notify: '<svg viewBox="0 0 1024 1024"><path d="M643.072 97.28c-20.48-12.8-45.568-14.848-70.656-3.072l-322.56 188.928h-158.72c-36.864 0-67.072 30.208-67.072 67.072v340.48c0 36.864 30.208 67.072 67.072 67.072h158.72l325.12 190.464c9.216 4.608 19.456 6.656 29.696 6.656 13.312 0 26.624-3.584 37.888-11.264 20.48-12.8 32.768-35.328 32.768-59.392v-727.04c0-24.576-12.288-47.104-32.256-59.904zM225.28 689.664l-133.12 1.024-1.024-338.944H225.28v337.92z m381.44 197.632l-313.344-183.808V336.896l312.32-182.784 1.536 730.112-0.512 3.072z m389.12-377.344c0 18.944-15.36 34.304-34.304 34.304h-155.648a34.304 34.304 0 0 1 0-68.608h155.648c18.944 0 34.304 15.36 34.304 34.304z m-218.624-174.08c-10.24-15.872-6.144-36.864 9.216-47.104L921.6 198.656c15.872-10.752 36.864-6.144 47.104 9.216 10.24 15.872 6.144 36.864-9.216 47.104L824.32 345.088c-5.632 4.096-12.288 5.632-18.944 5.632-10.752 0.512-21.504-4.608-28.16-14.848z m182.272 428.544c15.872 10.24 19.968 31.744 9.216 47.104-6.656 9.728-17.408 15.36-28.672 15.36-6.656 0-13.312-2.048-18.944-5.632l-135.168-90.112c-15.872-10.24-19.968-31.744-9.216-47.104 10.24-15.872 31.744-19.968 47.104-9.216l135.68 89.6z" fill="currentColor"></path></svg>',
    newReplies: '<svg viewBox="0 0 1080 1024"><path d="M750.933333 113.777778C659.911111 62.577778 551.822222 39.822222 455.111111 56.888889c-22.755556 5.688889-39.822222 22.755556-28.444444 45.511111 5.688889 17.066667 22.755556 28.444444 39.822222 28.444444 85.333333-11.377778 170.666667 5.688889 250.311111 51.2 182.044444 102.4 250.311111 329.955556 164.977778 512-5.688889 17.066667-17.066667 28.444444-17.066667 28.444445l-79.644444-45.511111-17.066667 256c5.688889 5.688889 244.622222-119.466667 244.622222-119.466667l-79.644444-45.511111 17.066666-34.133333c96.711111-227.555556 11.377778-494.933333-199.111111-620.088889zM312.888889 870.4C119.466667 762.311111 56.888889 517.688889 164.977778 324.266667l85.333333 45.511111 17.066667-250.311111L22.755556 238.933333l79.644444 45.511111c-130.844444 233.244444-39.822222 523.377778 170.666667 648.533334 96.711111 56.888889 204.8 73.955556 307.2 56.888889 22.755556-5.688889 34.133333-22.755556 28.444444-45.511111-5.688889-17.066667-22.755556-28.444444-39.822222-28.444445-85.333333 17.066667-176.355556 0-256-45.511111z" fill="currentColor"></path></svg>',
    selWrap: '<svg viewBox="0 0 1114 1024"><path d="M363.613577 943.791123H181.806789V101.597911h181.806788v61.493473H259.342037v721.879895h104.27154v58.819844zM751.289817 884.971279H855.561358v-721.879895h-104.271541V101.597911h181.806789v844.866841h-181.806789v-61.493473z" fill="currentColor"></path></svg>',
    fileReply: '<svg viewBox="0 0 1024 1024"><path d="M516.373333 375.978667l136.576-136.576a147.797333 147.797333 0 0 1 208.853334-0.021334 147.690667 147.690667 0 0 1-0.042667 208.832l-204.8 204.778667v0.021333l-153.621333 153.6c-85.973333 85.973333-225.28 85.973333-311.253334 0.021334-85.994667-85.973333-85.973333-225.216 0.149334-311.36L431.146667 256.362667a21.333333 21.333333 0 0 0-30.165334-30.165334L162.069333 465.066667c-102.805333 102.826667-102.826667 269.056-0.149333 371.733333 102.613333 102.613333 268.970667 102.613333 371.584 0l153.6-153.642667h0.021333l0.021334-0.021333 204.778666-204.778667c74.325333-74.325333 74.346667-194.858667 0.021334-269.184-74.24-74.24-194.88-74.24-269.162667 0.042667l-136.576 136.554667-187.626667 187.626666a117.845333 117.845333 0 0 0-0.106666 166.826667 118.037333 118.037333 0 0 0 166.826666-0.106667l255.850667-255.829333a21.333333 21.333333 0 0 0-30.165333-30.165333L435.136 669.973333a75.370667 75.370667 0 0 1-106.496 0.106667 75.178667 75.178667 0 0 1 0.128-106.496l187.605333-187.605333z" fill="currentColor"></path></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    read: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7 9h10M7 12.5h10M7 16h6"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 12l6-6 6 6"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v13M6 12l6 6 6-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.4"/><path d="M15 6.2V5.4A2.4 2.4 0 0 0 12.6 3H5.4A2.4 2.4 0 0 0 3 5.4v7.2A2.4 2.4 0 0 0 5.4 15h.8"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 7.2l3.4 3.4L12 14l-3.4-3.4 3.4-3.4z"/><path d="M8.6 16.2h6.8"/></svg>',
    paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2.6" width="8" height="4" rx="1.2"/><path d="M8 4.6H6.4A2.4 2.4 0 0 0 4 7v12.6A2.4 2.4 0 0 0 6.4 22h11.2a2.4 2.4 0 0 0 2.4-2.4V7a2.4 2.4 0 0 0-2.4-2.4H16"/><path d="M9 13.5l2.2 2.2L15.5 11"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8L21 21"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="3.7"/><path d="M4.6 20.2c1.2-3.7 4-5.6 7.4-5.6s6.2 1.9 7.4 5.6"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3.6L10.4 13.7M21 3.6l-6.7 16.9-3.9-6.8-7-3.4 17.6-6.7z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 8.5-7 10-4-1.5-7-5.4-7-10V6l7-3z"/><path d="M9.2 12l2 2 3.6-3.6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 10.6L12 3.5l8.4 7.1"/><path d="M5.6 9.4V20h12.8V9.4"/></svg>',
  };
  const DEFAULT_CONFIG = { v: 1, features: {}, options: {}, global: { master: true, showDock: true } };
  const Config = {
    data: (() => {
      const raw = Store.get('config', null);
      if (!raw || typeof raw !== 'object') return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      const merged = Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), raw);
      if (!merged.features || typeof merged.features !== 'object') merged.features = {};
      if (!merged.options || typeof merged.options !== 'object') merged.options = {};
      if (!merged.global || typeof merged.global !== 'object') merged.global = JSON.parse(JSON.stringify(DEFAULT_CONFIG.global));
      if (merged.global.master === undefined) merged.global.master = true;
      if (merged.global.showDock === undefined) merged.global.showDock = true;
      return merged;
    })(),
    global(key, fallback) {
      const g = this.data.global || {};
      return g[key] !== undefined ? !!g[key] : !!fallback;
    },
    setGlobal(key, val) {
      if (!this.data.global) this.data.global = {};
      this.data.global[key] = !!val;
      Store.set('config', this.data);
      Bus.emit('global:change', { key: key, value: !!val });
    },
    isOn(id, fallback) {
      return this.data.features[id] !== undefined ? !!this.data.features[id] : !!fallback;
    },
    setOn(id, on) {
      this.data.features[id] = !!on;
      Store.set('config', this.data);
      Bus.emit('config:change', { id, on: !!on });
    },
    opt(fid, key, fallback) {
      const group = this.data.options[fid];
      return group && group[key] !== undefined ? !!group[key] : !!fallback;
    },
    num(fid, key, fallback, min, max) {
      const group = this.data.options[fid];
      const raw = group ? Number(group[key]) : NaN;
      let v = Number.isFinite(raw) ? raw : fallback;
      if (min != null && v < min) v = min;
      if (max != null && v > max) v = max;
      return v;
    },
    setOpt(fid, key, val) {
      if (!this.data.options[fid]) this.data.options[fid] = {};
      const stored = typeof val === 'number' && Number.isFinite(val) ? val : !!val;
      this.data.options[fid][key] = stored;
      Store.set('config', this.data);
      Bus.emit('option:change', { id: fid, key, value: stored, on: stored === true });
    },
    reset() {
      this.data = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      Store.set('config', this.data);
      Bus.emit('config:reset');
    },
  };
  const Registry = {
    map: new Map(),
    register(def) {
      if (!def || !def.id) { return; }
      if (this.map.has(def.id)) { return; }
      this.map.set(def.id, Object.assign({
        group: '通用', order: 100, defaultEnabled: false, icon: ICON.gear,
      }, def));
      return def.id;
    },
    list() {
      const pos = this.customPos();
      return Array.from(this.map.values()).sort((a, b) => {
        const ia = pos[a.id], ib = pos[b.id];
        if (ia !== undefined && ib !== undefined) return ia - ib;
        if (ia !== undefined) return -1;
        if (ib !== undefined) return 1;
        if (a.group !== b.group) return a.group.localeCompare(b.group, 'zh');
        return (a.order || 100) - (b.order || 100);
      });
    },
    customPos() {
      const raw = Store.get('featureOrder', null);
      const pos = {};
      if (Array.isArray(raw)) {
        raw.forEach((id, i) => { pos[id] = i; });
      } else if (raw && typeof raw === 'object') {
        const flat = [];
        Object.keys(raw).sort().forEach((g) => { (raw[g] || []).forEach((id) => flat.push(id)); });
        Store.set('featureOrder', flat);
        flat.forEach((id, i) => { pos[id] = i; });
      }
      return pos;
    },
    setOrder(ids) {
      Store.set('featureOrder', ids);
    },
    isOn(id) {
      const def = this.map.get(id);
      if (!def) return false;
      const dft = typeof def.defaultEnabled === 'function' ? def.defaultEnabled() : def.defaultEnabled;
      return Config.isOn(id, dft);
    },
    ctx() {
      return {
        W, Store, Bus, Config, Registry,
        toast: (msg, type) => UI.toast(msg, type),
        openManager: (id) => UI.openSubPanel(id),
      };
    },
    boot() {
      if (!Config.global('master', true)) { return; }
      this.list().forEach((def) => {
        if (!this.isOn(def.id)) return;
        try { def.init && def.init(this.ctx()); }
        catch (e) { }
      });
    },
    shutdown() {
      this.list().forEach((def) => {
        try { def.destroy && def.destroy(this.ctx()); }
        catch (e) { }
      });
    },
    setEnabled(id, on) {
      const def = this.map.get(id);
      if (!def) return false;
      Config.setOn(id, on);
      try {
        if (Config.global('master', true)) {
          if (on) def.init && def.init(this.ctx());
          else def.destroy && def.destroy(this.ctx());
        }
      } catch (e) {
        UI.toast('切换失败：' + (e && e.message ? e.message : e), 'error');
      }
      Bus.emit('feature:toggle', { id, on });
      return true;
    },
    setOption(id, key, on) {
      const def = this.map.get(id);
      if (!def) return false;
      Config.setOpt(id, key, on);
      return true;
    },
    status(id) {
      const def = this.map.get(id);
      if (!def) return '';
      try { return def.status ? String(def.status(this.ctx()) || '') : ''; } catch (_) { return ''; }
    },
  };
  const CSS = `
#yhx-root{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;font-size:14px;line-height:1.6;letter-spacing:0;color:#333;text-align:left;-webkit-font-smoothing:antialiased}
#yhx-root *{box-sizing:border-box}
#yhx-root button{letter-spacing:0}
#yhx-root{
  --yhx-accent:#1abc9c;--yhx-accent-d:#16a085;--yhx-accent-soft:rgba(26,188,156,.12);
  --yhx-bg:#fff;--yhx-bg-2:#f7f8f9;--yhx-bg-3:#f1f2f4;
  --yhx-text:#222;--yhx-text-2:#6b7280;--yhx-text-3:#9aa0a6;
  --yhx-border:#e6e8eb;--yhx-border-2:#d8dbe0;
  --yhx-danger:#e5534b;--yhx-shadow:0 12px 40px rgba(17,24,39,.16);
}
html.yh-theme-dark #yhx-root{
  --yhx-bg:#1f2023;--yhx-bg-2:#26282c;--yhx-bg-3:#2e3135;
  --yhx-text:#e8eaed;--yhx-text-2:#a8adb5;--yhx-text-3:#7c828b;
  --yhx-border:#33363b;--yhx-border-2:#3f434a;
  --yhx-accent-soft:rgba(26,188,156,.16);
  --yhx-shadow:0 12px 40px rgba(0,0,0,.5);
}
@media (prefers-color-scheme:dark){
  html.yh-theme-system #yhx-root{
    --yhx-bg:#1f2023;--yhx-bg-2:#26282c;--yhx-bg-3:#2e3135;
    --yhx-text:#e8eaed;--yhx-text-2:#a8adb5;--yhx-text-3:#7c828b;
    --yhx-border:#33363b;--yhx-border-2:#3f434a;
    --yhx-accent-soft:rgba(26,188,156,.16);
    --yhx-shadow:0 12px 40px rgba(0,0,0,.5);
  }
}
/* ---------- 回复复读机的「+1」 ---------- */
/* 站点有 .subtitle2 a{padding:0 5px 0 2px} 这类规则，特异性比单个类高，
   所以这里用 a.yhx-plus，并把尺寸相关的属性写死 !important，避免被站点挤变形 */
a.yhx-plus{display:inline-flex!important;align-items:center;justify-content:center;flex:none;position:relative;z-index:3;margin:0 0 0 8px!important;width:22px!important;height:22px!important;min-width:0!important;padding:0!important;border:1px solid rgba(26,188,156,.5);border-radius:50%;background:rgba(26,188,156,.1);color:#12a58a!important;font-size:10.5px!important;font-weight:700;line-height:1!important;letter-spacing:0;font-variant-numeric:tabular-nums;text-decoration:none!important;cursor:pointer;vertical-align:middle;white-space:nowrap;user-select:none;-webkit-user-select:none;box-shadow:0 1px 3px rgba(26,188,156,.16);transition:background-color .16s,color .16s,border-color .16s,box-shadow .16s,transform .12s cubic-bezier(.22,.61,.36,1);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
/* 楼层右下角的回复按钮（气泡图标）与 +1 圆钮垂直居中对齐：图标在按钮内居中，
 * 两者在同一操作行里都居中，视觉上成为一条中线 */
.operate a.replyicon{display:flex;align-items:center;align-self:center;margin-top:0!important}
.operate a.replyicon img{transform:translateY(-1.2px)}
/* 带 +1 的操作行留足高度：桌面 22px 按钮、移动端 28px，行高不够时按钮底部会压在楼层的分割线下面 */
.yhx-plus-host{position:relative;z-index:3;min-height:24px;margin-bottom:0!important;transform:none!important}
a.yhx-plus:hover,a.yhx-plus:focus-visible{background:#1abc9c;border-color:#1abc9c;color:#fff!important;box-shadow:0 3px 10px rgba(26,188,156,.34);transform:translateY(-1px);outline:0}
a.yhx-plus:active{transform:translateY(0) scale(.95);box-shadow:0 1px 2px rgba(26,188,156,.2)}
html.yh-theme-dark a.yhx-plus{background:rgba(72,213,184,.13);border-color:rgba(72,213,184,.36);color:#48d5b8!important;box-shadow:none}
html.yh-theme-dark a.yhx-plus:hover{background:#2f9c85;border-color:#2f9c85;color:#fff!important}
/* ---------- 一键到顶 / 到底 ---------- */
/* ---------- 悬浮按钮组：设置 / 到顶 / 到底（毛玻璃） ---------- */
.yhx-dock{position:fixed;right:16px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:2;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}
.yhx-dock[hidden]{display:none}
.yhx-glass{position:relative;width:44px;height:44px;padding:0;border:1px solid rgba(255,255,255,.62);border-radius:50%;background:rgba(255,255,255,.44);-webkit-backdrop-filter:blur(16px) saturate(1.7);backdrop-filter:blur(16px) saturate(1.7);color:#3f4b53;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;box-shadow:0 6px 18px rgba(16,35,45,.14),inset 0 1px 0 rgba(255,255,255,.65);transition:opacity .2s,transform .2s,background-color .16s,color .16s,border-color .16s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.yhx-glass svg{width:20px;height:20px;display:block}
.yhx-glass:hover{background:rgba(255,255,255,.66);color:#1abc9c;border-color:rgba(26,188,156,.5)}
.yhx-glass:active{transform:scale(.93)}
.yhx-glass:focus-visible{outline:2px solid #1abc9c;outline-offset:2px}
/* 到顶/到底滚到位后淡出，但仍占位，避免按钮组跳动 */
.yhx-glass.is-off{opacity:0;transform:translateY(6px) scale(.9);pointer-events:none}
.yhx-glass-set svg{transition:transform .4s cubic-bezier(.22,.61,.36,1)}
@media (hover:hover){.yhx-glass-set:hover svg{transform:rotate(60deg)}}
html.yh-theme-dark .yhx-glass{background:rgba(38,42,47,.52);border-color:rgba(255,255,255,.13);color:#c9cdd3;box-shadow:0 6px 18px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.09)}
html.yh-theme-dark .yhx-glass:hover{background:rgba(52,58,64,.72);color:#48d5b8;border-color:rgba(72,213,184,.45)}
/* ---------- 遮罩 ---------- */
.yhx-mask{position:fixed;inset:0;pointer-events:auto;background:rgba(17,24,39,.42);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);opacity:0;transition:opacity .24s ease;display:flex;align-items:center;justify-content:center;padding:20px}
.yhx-mask.is-open{opacity:1}
.yhx-mask[hidden]{display:none}
/* ---------- 面板 ---------- */
.yhx-sheet{position:relative;width:560px;max-width:100%;min-height:340px;max-height:min(84vh,760px);display:flex;flex-direction:column;background:var(--yhx-bg);border-radius:16px;box-shadow:var(--yhx-shadow);overflow:hidden;transform:translateY(14px) scale(.985);opacity:0;transition:transform .26s cubic-bezier(.22,.61,.36,1),opacity .26s}
.yhx-mask.is-open .yhx-sheet{transform:none;opacity:1}
.yhx-hd{display:flex;align-items:center;gap:10px;padding:16px 18px 14px;background:linear-gradient(160deg,var(--yhx-accent-soft),transparent 62%);border-bottom:1px solid var(--yhx-border);flex:none}
.yhx-hd-title{font-size:16px;font-weight:600;color:var(--yhx-text);display:flex;align-items:center;gap:8px}
.yhx-hd-title svg{width:18px;height:18px;color:var(--yhx-accent)}
.yhx-hd-badge{font-size:11px;font-weight:500;color:var(--yhx-accent);background:var(--yhx-accent-soft);padding:2px 7px;border-radius:20px;letter-spacing:.2px}
.yhx-grow{flex:1}
.yhx-iconbtn{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:transparent;color:var(--yhx-text-2);display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;transition:background-color .15s,color .15s}
.yhx-iconbtn svg{width:18px;height:18px}
.yhx-iconbtn:active{background:var(--yhx-bg-3)}
@media (hover:hover){.yhx-iconbtn:hover{background:var(--yhx-bg-3);color:var(--yhx-text)}}
.yhx-body{flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:10px 12px 6px}
.yhx-body::-webkit-scrollbar{width:8px}
.yhx-body::-webkit-scrollbar-thumb{background:var(--yhx-border-2);border-radius:8px}
.yhx-body::-webkit-scrollbar-track{background:transparent}
.yhx-group{font-size:12px;font-weight:600;color:var(--yhx-text-3);letter-spacing:.6px;padding:12px 8px 6px;text-transform:uppercase}
/* 总开关关闭时的提示条 */
.yhx-paused{margin:6px 8px 2px;padding:10px 12px;border-radius:10px;background:rgba(230,126,34,.1);border:1px solid rgba(230,126,34,.28);color:#b9770e;font-size:12.5px;line-height:1.6}
html.yh-theme-dark .yhx-paused{background:rgba(230,126,34,.14);border-color:rgba(230,126,34,.34);color:#e5a44a}
/* ---------- 功能条目 ---------- */
.yhx-item{display:flex;align-items:flex-start;gap:12px;padding:13px 12px;border-radius:12px;position:relative}
.yhx-drag{flex:none;align-self:center;width:16px;margin-left:-6px;color:var(--yhx-text-3);opacity:.45;cursor:grab;font-size:13px;letter-spacing:-2px;user-select:none;-webkit-user-select:none;touch-action:none}
.yhx-drag:hover{opacity:1;color:var(--yhx-accent)}
.yhx-item-wrap.is-dragging{opacity:.4}
.yhx-item-wrap.is-over-before{box-shadow:inset 0 2px 0 var(--yhx-accent)}
.yhx-item-wrap.is-over-after{box-shadow:inset 0 -2px 0 var(--yhx-accent)}
.yhx-item-ico{flex:none;width:38px;height:38px;border-radius:11px;background:var(--yhx-accent-soft);color:var(--yhx-accent);display:flex;align-items:center;justify-content:center}
.yhx-item-ico svg{width:20px;height:20px}
.yhx-item-main{flex:1;min-width:0}
.yhx-item-name{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:600;color:var(--yhx-text);line-height:1.35;margin-bottom:3px}
.yhx-pill{font-size:11px;font-weight:500;padding:1px 7px;border-radius:20px;background:var(--yhx-bg-3);color:var(--yhx-text-3);line-height:1.6}
.yhx-pill.on{background:var(--yhx-accent-soft);color:var(--yhx-accent)}
.yhx-item-desc{font-size:12.5px;color:var(--yhx-text-2);line-height:1.55;word-break:break-word}
.yhx-item-stat{margin-top:5px;font-size:11.5px;color:var(--yhx-text-3)}
.yhx-item-act{flex:none;display:flex;align-items:center;gap:8px;align-self:center}
.yhx-link{background:transparent;border:0;color:var(--yhx-accent);font-size:12.5px;padding:6px 4px;cursor:pointer;border-radius:8px}
.yhx-link:active{background:var(--yhx-accent-soft)}
/* ---------- 开关 ---------- */
.yhx-switch{position:relative;flex:none;width:46px;height:27px;border:0;border-radius:20px;background:var(--yhx-border-2);cursor:pointer;padding:0;pointer-events:auto;transition:background-color .22s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.yhx-switch::after{content:"";position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.24);transition:transform .22s cubic-bezier(.22,.61,.36,1)}
.yhx-switch[aria-checked="true"]{background:var(--yhx-accent)}
.yhx-switch[aria-checked="true"]::after{transform:translateX(19px)}
.yhx-switch:active::after{width:23px}
/* ---------- 功能子开关（如 UBB 预览的图片/超链接） ---------- */
.yhx-item-wrap{position:relative}
.yhx-suboptions{margin:-6px 12px 10px 62px;padding:4px 12px;border-radius:10px;background:var(--yhx-bg-2);border:1px solid var(--yhx-border)}
.yhx-suboption{display:flex;align-items:center;gap:12px;padding:8px 0}
.yhx-suboption + .yhx-suboption{border-top:1px solid var(--yhx-border)}
.yhx-suboption-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.yhx-suboption-name{font-size:13.5px;color:var(--yhx-text);line-height:1.4}
.yhx-suboption-hint{font-family:Consolas,Menlo,monospace;font-size:11px;color:var(--yhx-text-3);background:transparent;padding:0;line-height:1.4}
/* 数值型子选项：输入框 + 单位 */
.yhx-numfield{flex:none;display:flex;align-items:center;gap:5px}
.yhx-num{width:62px;height:30px;padding:0 6px;border:1px solid var(--yhx-border-2);border-radius:8px;background:var(--yhx-bg);color:var(--yhx-text);font-size:13px;font-weight:600;line-height:28px;text-align:center;outline:0;box-sizing:border-box;-moz-appearance:textfield;appearance:textfield;pointer-events:auto}
.yhx-num:focus{border-color:var(--yhx-accent)}
.yhx-num::-webkit-outer-spin-button,.yhx-num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.yhx-numfield-unit{font-size:12px;color:var(--yhx-text-3);flex:none}
.yhx-mini-switch{position:relative;flex:none;width:38px;height:22px;border:0;border-radius:20px;background:var(--yhx-border-2);cursor:pointer;padding:0;pointer-events:auto;transition:background-color .2s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.yhx-mini-switch::after{content:"";position:absolute;top:2.5px;left:2.5px;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.22);transition:transform .2s cubic-bezier(.22,.61,.36,1)}
.yhx-mini-switch[aria-checked="true"]{background:var(--yhx-accent)}
.yhx-mini-switch[aria-checked="true"]::after{transform:translateX(16px)}
.yhx-mini-switch:active::after{width:19px}
/* ---------- 底部工具条 ---------- */
.yhx-ft{flex:none;display:flex;gap:8px;padding:12px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--yhx-border);background:var(--yhx-bg)}
.yhx-hint{padding:0 16px 10px;font-size:11.5px;color:var(--yhx-text-3);text-align:center;line-height:1.5}
.yhx-btn{flex:1;height:40px;border:1px solid var(--yhx-border-2);border-radius:10px;background:var(--yhx-bg);color:var(--yhx-text-2);font-size:13px;cursor:pointer;pointer-events:auto;transition:background-color .15s,border-color .15s,color .15s}
.yhx-btn:active{background:var(--yhx-bg-3)}
@media (hover:hover){.yhx-btn:hover{border-color:var(--yhx-accent);color:var(--yhx-accent)}}
.yhx-btn.primary{background:var(--yhx-accent);border-color:var(--yhx-accent);color:#fff;font-weight:600}
.yhx-btn.primary:active{background:var(--yhx-accent-d)}
@media (hover:hover){.yhx-btn.primary:hover{background:var(--yhx-accent-d);border-color:var(--yhx-accent-d);color:#fff}}
.yhx-btn.danger{color:var(--yhx-danger);border-color:var(--yhx-border-2)}
@media (hover:hover){.yhx-btn.danger:hover{border-color:var(--yhx-danger);color:var(--yhx-danger)}}
.yhx-btn[disabled]{opacity:.5;pointer-events:none}
/* ---------- 表情管理弹窗 ---------- */
.yhx-sheet.yhx-modal{width:540px;max-height:min(88vh,800px)}
.yhx-tabs{display:flex;gap:6px;padding:12px 16px 0;flex:none;overflow-x:auto;scrollbar-width:none}
.yhx-tabs::-webkit-scrollbar{display:none}
.yhx-tab{flex:none;border:0;border-radius:14px;padding:6px 14px;font-size:13px;background:var(--yhx-bg-3);color:var(--yhx-text-2);cursor:pointer;pointer-events:auto;transition:background-color .15s,color .15s;touch-action:manipulation}
.yhx-tab.is-on{background:var(--yhx-accent);color:#fff}
.yhx-tab:active{opacity:.85}
.yhx-pane{padding:14px 16px 4px}
.yhx-pane[hidden]{display:none}
.yhx-field{display:block;width:100%;height:42px;margin-bottom:10px;padding:0 12px;border:1px solid var(--yhx-border-2);border-radius:10px;background:var(--yhx-bg-2);color:var(--yhx-text);font-size:14px;font-family:inherit;outline:0;transition:border-color .15s,background-color .15s;-webkit-appearance:none;appearance:none}
.yhx-field:focus{border-color:var(--yhx-accent);background:var(--yhx-bg)}
.yhx-field::placeholder{color:var(--yhx-text-3)}
.yhx-row{display:flex;gap:10px}
.yhx-row .yhx-field{margin-bottom:0}
.yhx-preview{margin-top:10px;min-height:0;border-radius:10px;overflow:hidden;display:none}
.yhx-preview.has{display:block;border:1px solid var(--yhx-border)}
.yhx-preview img{display:block;max-width:100%;max-height:130px;margin:0 auto;object-fit:contain;background:var(--yhx-bg-3)}
.yhx-drop{margin-top:2px;border:1.5px dashed var(--yhx-border-2);border-radius:12px;padding:26px 16px;text-align:center;color:var(--yhx-text-2);font-size:13px;cursor:pointer;pointer-events:auto;transition:border-color .18s,background-color .18s;touch-action:manipulation}
.yhx-drop svg{width:26px;height:26px;color:var(--yhx-accent);display:block;margin:0 auto 8px}
.yhx-drop.drag{border-color:var(--yhx-accent);background:var(--yhx-accent-soft)}
.yhx-drop b{color:var(--yhx-text);font-weight:600}
.yhx-drop small{display:block;margin-top:5px;font-size:11.5px;color:var(--yhx-text-3)}
.yhx-listhd{display:flex;align-items:center;gap:8px;padding:16px 16px 8px;font-size:12.5px;color:var(--yhx-text-3);flex:none}
.yhx-listhd b{color:var(--yhx-text);font-weight:600}
.yhx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;padding:0 16px 8px}
.yhx-cell{position:relative;border:1px solid var(--yhx-border);border-radius:10px;background:var(--yhx-bg-2);padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:border-color .16s}
@media (hover:hover){.yhx-cell:hover{border-color:var(--yhx-accent)}}
.yhx-cell img{width:100%;height:54px;object-fit:contain;border-radius:6px;display:block}
.yhx-cell span{font-size:10.5px;color:var(--yhx-text-3);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.3}
.yhx-del{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border:0;border-radius:50%;background:var(--yhx-danger);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;opacity:0;transform:scale(.8);transition:opacity .15s,transform .15s;box-shadow:0 1px 4px rgba(0,0,0,.24)}
.yhx-del svg{width:12px;height:12px}
.yhx-cell:hover .yhx-del,.yhx-grid[data-editing="1"] .yhx-del{opacity:1;transform:none}
@media (hover:none){.yhx-del{opacity:1;transform:none}}
.yhx-empty{padding:30px 16px;text-align:center;color:var(--yhx-text-3);font-size:13px;line-height:1.8}
.yhx-empty svg{width:34px;height:34px;display:block;margin:0 auto 8px;color:var(--yhx-border-2)}
/* 空态提示挂在站点的 .ubb-emoji-pane 里，用固定色避免依赖变量 */
.yhx-emoji-empty{padding:22px 8px 26px;text-align:center;font-size:13px;line-height:1.9;color:#999}
.yhx-emoji-empty a{color:#1abc9c;cursor:pointer;text-decoration:none;font-size:12.5px}
.yhx-emoji-empty a:hover{text-decoration:underline}
/* ---------- UBB 就地渲染：富文本层替换 textarea 显示（不在 #yhx-root 内，颜色写死） ---------- */
/* 文件回帖：把 a.reply-file-link 做成与「快速回复」按钮一致的外观（点击仍走原链接）。
 * 取值照抄 input.btn.reply-submit-btn 的计算样式：浅灰渐变底、sans-serif 11px、
 * 左右 5px 外边距、文字居中——深浅主题都是这套浅色按钮（站点按钮不随主题变暗） */
html.yhx-file-reply-btn a.reply-file-link{display:inline-block;margin:0 5px;padding:5.5px 11px;font-family:sans-serif;font-size:11px;line-height:normal;text-align:center;color:#333;background-image:linear-gradient(#f4f4f4,#ececec);border:1px solid #d4d4d4;border-radius:5px;text-decoration:none;box-sizing:border-box;vertical-align:middle;position:relative;user-select:text}
/* 站点原有 #replyActions.has-sort .reply-file-link{top:1px}（纯链接时代的下移补偿），
 * 变成按钮后要清零——用更高特异性覆盖 */
html.yhx-file-reply-btn #replyActions.has-sort a.reply-file-link{top:0}
/* 焦点/悬停与快速回复按钮保持一致：站点按钮没有 hover/focus 变色，
 * 也没有 browser 默认焦点环（深色 outline），这里一并去掉；
 */
html.yhx-file-reply-btn a.reply-file-link:hover,html.yhx-file-reply-btn a.reply-file-link:focus{background-image:linear-gradient(#599bdc,#3072b3);border-color:#3072b3;color:#fff;outline:0}
.yhx-rich-wrap{position:relative}
.yhx-rich{display:block;width:100%;min-height:110px;padding:5px 6px;box-sizing:border-box;font-family:inherit;font-size:15px;line-height:1.7;color:#333;outline:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;cursor:text;overflow-y:auto;letter-spacing:0}
.yhx-rich:focus{outline:0}
.yhx-rich.is-empty::before{content:attr(data-placeholder);position:absolute;left:6px;top:5px;color:#9aa0a6;pointer-events:none;white-space:pre-wrap}
/* textarea 退成影子字段：保留尺寸占位但完全不可见、不接收事件 */
.ubb-box textarea.yhx-shadow-ta{position:absolute!important;left:0;top:0;width:100%!important;height:100%!important;min-height:0!important;opacity:0!important;pointer-events:none!important;z-index:-1;margin:0!important;padding:0!important;border:0!important;resize:none!important}
.yhx-rich-item{display:inline-block;position:relative;vertical-align:middle;margin:3px 6px 3px 0;max-width:100%;line-height:0}
.yhx-rich-item[data-type="img"] img{display:inline-block;max-width:100%;max-height:180px;border-radius:8px;border:1px solid #eef0f2;background:#f7f8f9;vertical-align:middle}
.yhx-rich-item[data-type="link"]{line-height:1.5;vertical-align:baseline}
.yhx-rich-link{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:2px 23px 2px 7px;border:1px solid #dbe6f5;border-radius:6px;background:#f2f7ff;color:#3d68a8;font-size:14px;text-decoration:none;line-height:1.5;vertical-align:middle}
.yhx-rich-link span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:420px}
.yhx-rich-link svg{width:13px;height:13px;flex:none;opacity:.75}
.yhx-rich-broken{display:inline-block;padding:6px 10px;border-radius:6px;border:1px dashed #e6b3ae;background:#fdf2f1;color:#c0392b;font-size:12px;line-height:1.4}
/* 编辑图标：钉在图片/链接的右下角，仍在编辑区内 */
.yhx-rich-edit{position:absolute;right:1px;bottom:1px;width:20px;height:20px;padding:0;border:2px solid #fff;border-radius:50%;background:#1abc9c;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:.92;transition:opacity .15s,transform .15s;box-shadow:0 1px 4px rgba(0,0,0,.2);line-height:0;z-index:2}
.yhx-rich-edit svg{width:10px;height:10px}
.yhx-rich-item:hover .yhx-rich-edit,.yhx-rich-edit:focus-visible{opacity:1;transform:scale(1.08)}
@media (hover:none){.yhx-rich-edit{opacity:1}}
html.yh-theme-dark .yhx-rich{color:#c9cdd3}
html.yh-theme-dark .yhx-rich.is-empty::before{color:#6f7680}
html.yh-theme-dark .yhx-rich-link{background:#26303c;border-color:#33404f;color:#79a6e6}
html.yh-theme-dark .yhx-rich-item[data-type="img"] img{border-color:#33363b;background:#2a2d31}
html.yh-theme-dark .yhx-rich-edit{border-color:#26282c}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-rich{color:#c9cdd3}
  html.yh-theme-system .yhx-rich.is-empty::before{color:#6f7680}
  html.yh-theme-system .yhx-rich-link{background:#26303c;border-color:#33404f;color:#79a6e6}
  html.yh-theme-system .yhx-rich-item[data-type="img"] img{border-color:#33363b;background:#2a2d31}
  html.yh-theme-system .yhx-rich-edit{border-color:#26282c}
}
/* 编辑弹窗（表单形态，只让人填地址和文字，不暴露 UBB 源码） */
.yhx-editdlg{width:440px;min-height:0}
.yhx-editbody{padding:16px 16px 6px}
.yhx-field-row{display:block;margin-bottom:14px}
.yhx-field-label{display:block;font-size:12px;color:var(--yhx-text-2);margin-bottom:6px;letter-spacing:.2px}
.yhx-editinput{display:block;width:100%;height:42px;padding:0 12px;border:1px solid var(--yhx-border-2);border-radius:10px;background:var(--yhx-bg-2);color:var(--yhx-text);font-family:inherit;font-size:14px;outline:0;box-sizing:border-box;transition:border-color .15s,background-color .15s;-webkit-appearance:none;appearance:none}
.yhx-editinput:focus{border-color:var(--yhx-accent);background:var(--yhx-bg)}
.yhx-editinput::placeholder{color:var(--yhx-text-3);font-size:13px}
.yhx-editprev{margin:-4px 0 14px;padding:8px;border:1px solid var(--yhx-border);border-radius:10px;background:var(--yhx-bg-2);text-align:center}
.yhx-editprev[hidden]{display:none}
.yhx-editprev img{display:block;max-width:100%;max-height:150px;margin:0 auto;border-radius:6px}
.yhx-editft{display:flex;gap:10px;justify-content:flex-end;padding:12px 16px calc(14px + env(safe-area-inset-bottom))}
.yhx-editft .yhx-btn{flex:none;min-width:84px}
/* ---------- 帖子悬浮预览（挂在 body 下，不在 #yhx-root 里，颜色写死） ---------- */
.yhx-tp{position:fixed;z-index:2147483647;display:none;flex-direction:column;border:1px solid #e3e3e3;border-radius:12px;background:#fff;box-shadow:0 14px 40px rgba(17,24,39,.2);overflow:hidden;font:14px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;letter-spacing:0;color:#333;text-align:left}
.yhx-tp.show{display:flex}
/* 没有标题栏：浮层里只有正文，高度由 JS 按剩余空间算 */
.yhx-tp-body{flex:1 1 auto;min-height:0;max-height:none;padding:12px 14px;overflow-y:auto;overscroll-behavior:contain;font-size:13.5px;line-height:1.78;color:#3d4450;word-break:break-word;overflow-wrap:anywhere}
.yhx-tp-content{font-size:13.5px;line-height:1.78;color:inherit;word-break:break-word;overflow-wrap:anywhere}
.yhx-tp-content p{margin:0 0 9px}
.yhx-tp-content img{display:block!important;max-width:100%!important;height:auto!important;margin:10px 0!important;border-radius:8px!important;background:#f4f5f7;opacity:1!important;visibility:visible!important}
.yhx-tp-content video{display:block!important;width:100%!important;max-width:100%!important;max-height:300px!important;height:auto!important;margin:10px 0!important;border-radius:8px!important;background:#000;opacity:1!important}
.yhx-tp-content audio{display:block!important;width:100%!important;margin:10px 0!important;opacity:1!important}
.yhx-tp-content iframe{display:block!important;width:100%!important;max-width:100%!important;border:0!important;border-radius:8px!important;margin:10px 0!important;background:#000;opacity:1!important}
.yhx-tp-content embed,.yhx-tp-content object{display:block!important;width:100%!important;max-width:100%!important;height:200px;margin:10px 0!important}
.yhx-tp-content blockquote{margin:10px 0!important;padding:8px 12px!important;border-left:3px solid #dfe3e8;background:#fafbfc;color:#5b6270;font-style:normal}
.yhx-tp-content table{max-width:100%;border-collapse:collapse}
.yhx-tp-content pre{white-space:pre-wrap;word-break:break-all;background:#f6f8fa;padding:10px;border-radius:8px;font-size:12.5px;line-height:1.6}
.yhx-tp-content code{font-family:Consolas,Menlo,monospace;font-size:12.5px}
.yhx-tp-body::-webkit-scrollbar{width:8px}
.yhx-tp-body::-webkit-scrollbar-thumb{background:#dcdfe3;border-radius:8px}
.yhx-tp-body a{color:#3d68a8;text-decoration:none;word-break:break-all}
.yhx-tp-body p{margin:0 0 8px}
.yhx-tp-body blockquote{margin:8px 0;padding:6px 10px;border-left:3px solid #e3e3e3;color:#6b7280;background:#fafafa}
.yhx-tp-loading{padding:26px 8px;text-align:center;color:#9aa0a6;font-size:13px}
html.yh-theme-dark .yhx-tp{background:#1f2023;border-color:#33363b;color:#c9cdd3;box-shadow:0 14px 40px rgba(0,0,0,.55)}
html.yh-theme-dark .yhx-tp-body{color:#b9bec6}
html.yh-theme-dark .yhx-tp-body blockquote{background:#26282c;border-color:#3a3d42;color:#9aa0a6}
html.yh-theme-dark .yhx-tp-body img{background:#2a2d31}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-tp{background:#1f2023;border-color:#33363b;color:#c9cdd3;box-shadow:0 14px 40px rgba(0,0,0,.55)}
  html.yh-theme-system .yhx-tp-body{color:#b9bec6}
  html.yh-theme-system .yhx-tp-body blockquote{background:#26282c;border-color:#3a3d42;color:#9aa0a6}
  html.yh-theme-system .yhx-tp-body img{background:#2a2d31}
}
@media (max-width:640px){.yhx-tp{max-width:calc(100vw - 16px)!important}}
/* ---------- 用户名片 ----------
   点击用户名（userinfo.aspx?touserid=xxx）后在链接旁弹出的资料卡。
   结构：头像+昵称头区 / 可滚动的中部（统计块、字段行、签名）/ 底部按钮条。 */
.yhx-uc{position:fixed;z-index:2147483647;display:none;flex-direction:column;width:320px;border:1px solid #e3e3e3;border-radius:14px;background:#fff;box-shadow:0 14px 40px rgba(17,24,39,.2);overflow:hidden;font:13px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;letter-spacing:0;color:#333;text-align:left}
.yhx-uc.show{display:flex}
/* 毛玻璃：半透明背景 + backdrop 模糊。
 * 内表面统一用中性深色调（不是白色叠加），卡片透明度高的时候
 * 统计格/签名/按钮条与底之间的边界才看得出来。 */
.yhx-uc.is-glass{background:rgba(255,255,255,.45);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%)}
.yhx-uc.is-glass .yhx-uc-stat{background:rgba(15,23,42,.10)}
.yhx-uc.is-glass .yhx-uc-sign{background:rgba(15,23,42,.08)}
.yhx-uc.is-glass .yhx-uc-foot{background:rgba(15,23,42,.05)}
.yhx-uc.is-glass .yhx-uc-mid::-webkit-scrollbar-thumb{background:rgba(0,0,0,.25)}
html.yh-theme-dark .yhx-uc.is-glass{background:rgba(24,26,29,.55);border-color:#3f434a}
html.yh-theme-dark .yhx-uc.is-glass .yhx-uc-ava{background:rgba(0,0,0,.3)}
html.yh-theme-dark .yhx-uc.is-glass .yhx-uc-stat{background:rgba(0,0,0,.32)}
html.yh-theme-dark .yhx-uc.is-glass .yhx-uc-sign{background:rgba(0,0,0,.28)}
html.yh-theme-dark .yhx-uc.is-glass .yhx-uc-foot{background:rgba(0,0,0,.24)}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-uc.is-glass{background:rgba(24,26,29,.55);border-color:#3f434a}
  html.yh-theme-system .yhx-uc.is-glass .yhx-uc-ava{background:rgba(0,0,0,.3)}
  html.yh-theme-system .yhx-uc.is-glass .yhx-uc-stat{background:rgba(0,0,0,.32)}
  html.yh-theme-system .yhx-uc.is-glass .yhx-uc-sign{background:rgba(0,0,0,.28)}
  html.yh-theme-system .yhx-uc.is-glass .yhx-uc-foot{background:rgba(0,0,0,.24)}
}
.yhx-uc-head{display:flex;align-items:center;gap:12px;padding:14px 14px 10px}
.yhx-uc-ava{position:relative;width:52px;height:52px;flex:0 0 auto;border-radius:12px;overflow:hidden;background:#eef7f5;color:#1abc9c;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600}
.yhx-uc-ava img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block}
.yhx-uc-ava .yhx-uc-dot{position:absolute;right:2px;bottom:2px;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-sizing:border-box}
.yhx-uc-ava .yhx-uc-dot.is-off{background:#b6bcc4}
.yhx-uc-nm{font-size:15px;font-weight:600;color:#222;word-break:break-all;line-height:1.35}
.yhx-uc-id{margin-top:3px;font-size:12px;color:#8a919c;line-height:1.45;word-break:break-all}
.yhx-uc-mid{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 14px 10px}
.yhx-uc-mid::-webkit-scrollbar{width:8px}
.yhx-uc-mid::-webkit-scrollbar-thumb{background:#dcdfe3;border-radius:8px}
.yhx-uc-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px;margin:2px 0 8px}
.yhx-uc-stat{padding:6px 8px;border-radius:8px;background:#f4f5f7;font-size:12px;color:#4b5563;text-align:center;line-height:1.45;word-break:break-all}
.yhx-uc-stat .v{display:block;font-size:13.5px;font-weight:600;color:#222;line-height:1.3}
.yhx-uc-stat .l{display:block;font-style:normal;font-size:11px;color:#8a919c;line-height:1.3;margin-top:2px}
.yhx-uc-stat.is-link{cursor:pointer;text-decoration:none;color:inherit;transition:background .15s}
.yhx-uc-stat.is-link:hover{background:#e7ecef}
.yhx-uc-stat.is-link .v{color:#1a8f77}
.yhx-uc-stat.is-link:hover .v{text-decoration:underline}
html.yh-theme-dark .yhx-uc-stat.is-link .v{color:#2ec8a8}
html.yh-theme-dark .yhx-uc-stat.is-link:hover{background:#3a3d42}
.yhx-uc-rows{display:flex;flex-direction:column;gap:4px}
.yhx-uc-row{display:flex;gap:8px;font-size:12.5px;line-height:1.55}
.yhx-uc-row b{flex:0 0 auto;color:#8a919c;font-weight:400}
.yhx-uc-row span{color:#3d4450;word-break:break-word;min-width:0}
.yhx-uc-sign{margin-top:8px;padding:8px 10px;border-radius:8px;background:#f8fafb;border-left:3px solid #dfe3e8;color:#5b6270;font-size:12.5px;word-break:break-word;overflow-wrap:anywhere}
.yhx-uc-loading{padding:26px 10px;text-align:center;color:#9aa0a6;font-size:13px}
.yhx-uc-foot{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #eef0f2;background:#fafbfc}
.yhx-uc-btn{flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:6px;height:34px;border-radius:9px;font-size:13px;font-weight:500;text-decoration:none;cursor:pointer;user-select:none;transition:filter .15s,background .15s;white-space:nowrap}
.yhx-uc-btn svg{width:15px;height:15px;flex:none}
.yhx-uc-btn:hover{text-decoration:none}
.yhx-uc-btn--pm{background:#1abc9c;color:#fff}
.yhx-uc-btn--pm:hover{filter:brightness(.94)}
.yhx-uc-btn--home{background:#fff;color:#333;border:1px solid #d8dbe0}
.yhx-uc-btn--home:hover{background:#f4f5f7}
.yhx-uc-btn.is-off{opacity:.45;pointer-events:none}
html.yh-theme-dark .yhx-uc{background:#1f2023;border-color:#33363b;color:#c9cdd3;box-shadow:0 14px 40px rgba(0,0,0,.55)}
html.yh-theme-dark .yhx-uc-nm{color:#e8eaed}
html.yh-theme-dark .yhx-uc-id{color:#7c828b}
html.yh-theme-dark .yhx-uc-ava{background:#2e3135}
html.yh-theme-dark .yhx-uc-ava .yhx-uc-dot{border-color:#1f2023}
html.yh-theme-dark .yhx-uc-stat{background:#2e3135;color:#a8adb5}
html.yh-theme-dark .yhx-uc-stat .v{color:#e8eaed}
html.yh-theme-dark .yhx-uc-stat .l{color:#7c828b}
html.yh-theme-dark .yhx-uc-row b{color:#7c828b}
html.yh-theme-dark .yhx-uc-row span{color:#b9bec6}
html.yh-theme-dark .yhx-uc-sign{background:#26282c;border-color:#3a3d42;color:#9aa0a6}
html.yh-theme-dark .yhx-uc-foot{background:#26282c;border-top-color:#33363b}
html.yh-theme-dark .yhx-uc-btn--pm{background:#16a085}
html.yh-theme-dark .yhx-uc-btn--home{background:#2e3135;border-color:#3f434a;color:#c9cdd3}
html.yh-theme-dark .yhx-uc-btn--home:hover{background:#33363b}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-uc{background:#1f2023;border-color:#33363b;color:#c9cdd3;box-shadow:0 14px 40px rgba(0,0,0,.55)}
  html.yh-theme-system .yhx-uc-nm{color:#e8eaed}
  html.yh-theme-system .yhx-uc-id{color:#7c828b}
  html.yh-theme-system .yhx-uc-ava{background:#2e3135}
  html.yh-theme-system .yhx-uc-ava .yhx-uc-dot{border-color:#1f2023}
  html.yh-theme-system .yhx-uc-stat{background:#2e3135;color:#a8adb5}
  html.yh-theme-system .yhx-uc-stat .v{color:#e8eaed}
  html.yh-theme-system .yhx-uc-stat .l{color:#7c828b}
  html.yh-theme-system .yhx-uc-stat.is-link .v{color:#2ec8a8}
  html.yh-theme-system .yhx-uc-stat.is-link:hover{background:#3a3d42}
  html.yh-theme-system .yhx-uc-row b{color:#7c828b}
  html.yh-theme-system .yhx-uc-row span{color:#b9bec6}
  html.yh-theme-system .yhx-uc-sign{background:#26282c;border-color:#3a3d42;color:#9aa0a6}
  html.yh-theme-system .yhx-uc-foot{background:#26282c;border-top-color:#33363b}
  html.yh-theme-system .yhx-uc-btn--pm{background:#16a085}
  html.yh-theme-system .yhx-uc-btn--home{background:#2e3135;border-color:#3f434a;color:#c9cdd3}
  html.yh-theme-system .yhx-uc-btn--home:hover{background:#33363b}
}
@media (max-width:640px){.yhx-uc{max-width:calc(100vw - 16px)!important}}
/* ---------- 打赏面板的自定义格子 ----------
   克隆站点 .rw-tile 的外观，只把文字换成输入框，
   所以字号、圆角、内外边距全部跟随站点，不用自己写皮肤。 */
.yhx-rw-custom{cursor:text;position:relative}
.yhx-rw-custom .yhx-rw-input{width:100%;height:100%;min-height:2.4em;margin:0;padding:0 4px;border:0;background:transparent;color:inherit;font:inherit;font-style:normal;font-weight:inherit;letter-spacing:0;text-align:center;line-height:1.2;outline:0;box-sizing:border-box;-webkit-appearance:none;appearance:none;-moz-appearance:textfield}
.yhx-rw-custom .yhx-rw-input::-webkit-outer-spin-button,
.yhx-rw-custom .yhx-rw-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.yhx-rw-custom .yhx-rw-input::placeholder{color:#b6bcc4;font-size:.88em;font-weight:400}
/* 选中态与站点 .rw-radio:checked+.rw-tile 完全一致：填充主色、白字、带投影 */
.yhx-rw-custom.is-on{background:var(--rw-fill,#1abc9c);border-color:var(--rw-fill,#1abc9c);color:var(--rw-on-fill,#fff);box-shadow:var(--rw-sel-shadow,0 2px 8px rgba(26,188,156,.35))}
.yhx-rw-custom.is-on .yhx-rw-input{color:inherit;caret-color:currentColor}
html.yh-theme-dark .yhx-rw-custom .yhx-rw-input::placeholder,
html.yh-theme-system .yhx-rw-custom .yhx-rw-input::placeholder{color:#6f757d}
/* ---------- 表情弹层：常驻删除角标 ----------
   网格容器必须定位，角标的绝对定位和 img.offsetLeft 才有参照；
   绝对定位的子元素不参与 grid 布局，不会多占格子。 */
.ubb-emoji-pane .ubb-emoji-grid{position:relative}
.yhx-pdel{position:absolute;width:18px;height:18px;border:0;border-radius:50%;background:rgba(32,36,42,.85);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;padding:0;box-shadow:0 1px 4px rgba(0,0,0,.3);z-index:2}
.yhx-pdel svg{width:10px;height:10px;display:block}
.yhx-pdel:hover{background:#e5534b}
/* ---------- 首页搜索类型：胶囊触发器 + 自绘下拉（对齐 /bbs/ 搜索栏风格） ---------- */
.yhx-hs-dd{position:relative;display:inline-flex;align-items:center;margin-left:5px}
.yhx-hs-trigger{display:inline-flex;align-items:center;gap:3px;box-sizing:content-box;height:19px;padding:4px 8px;border:1px solid #d4d4d4;border-radius:8px;background:transparent;color:#333;font-size:13px;line-height:1;cursor:pointer;white-space:nowrap;transition:border-color .15s,color .15s}
.yhx-hs-trigger:hover{border-color:#1abc9c;color:#128f77}
.yhx-hs-arrow{display:inline-flex;transition:transform .15s}
.yhx-hs-arrow svg{width:10px;height:10px;display:block}
.yhx-hs-dd.is-open .yhx-hs-arrow{transform:rotate(180deg)}
.yhx-hs-dd.is-open .yhx-hs-trigger{border-color:#1abc9c;color:#128f77}
.yhx-hs-menu{position:absolute;top:calc(100% + 4px);left:0;min-width:86px;background:#fff;border:1px solid #e3e5e8;border-radius:8px;box-shadow:0 6px 20px rgba(17,24,39,.16);padding:4px;display:none;z-index:50}
.yhx-hs-dd.is-up .yhx-hs-menu{top:auto;bottom:calc(100% + 4px)}
.yhx-hs-dd.is-open .yhx-hs-menu{display:block}
.yhx-hs-opt{padding:6px 12px;border-radius:5px;font-size:12.5px;color:#333;cursor:pointer;white-space:nowrap}
.yhx-hs-opt:hover{background:rgba(26,188,156,.12);color:#128f77}
.yhx-hs-opt.is-on{color:#1abc9c;font-weight:600}
html.yh-theme-dark .yhx-hs-trigger{background:#2e3135;border-color:#3f434a;color:#c9cdd3}
html.yh-theme-dark .yhx-hs-trigger:hover,
html.yh-theme-dark .yhx-hs-dd.is-open .yhx-hs-trigger{border-color:#1abc9c;color:#2ec8a8}
html.yh-theme-dark .yhx-hs-menu{background:#26282c;border-color:#3f434a;box-shadow:0 6px 20px rgba(0,0,0,.5)}
html.yh-theme-dark .yhx-hs-opt{color:#c9cdd3}
html.yh-theme-dark .yhx-hs-opt:hover{background:rgba(26,188,156,.16);color:#2ec8a8}
html.yh-theme-dark .yhx-hs-opt.is-on{color:#2ec8a8}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-hs-trigger{background:#2e3135;border-color:#3f434a;color:#c9cdd3}
  html.yh-theme-system .yhx-hs-trigger:hover,
  html.yh-theme-system .yhx-hs-dd.is-open .yhx-hs-trigger{border-color:#1abc9c;color:#2ec8a8}
  html.yh-theme-system .yhx-hs-menu{background:#26282c;border-color:#3f434a;box-shadow:0 6px 20px rgba(0,0,0,.5)}
  html.yh-theme-system .yhx-hs-opt{color:#c9cdd3}
  html.yh-theme-system .yhx-hs-opt:hover{background:rgba(26,188,156,.16);color:#2ec8a8}
  html.yh-theme-system .yhx-hs-opt.is-on{color:#2ec8a8}
}
/* ---------- 删除确认弹窗 ---------- */
.yhx-confirm{display:flex;flex-direction:column;align-items:center;gap:8px;padding:6px 0 2px;text-align:center}
.yhx-confirm img{max-width:96px;max-height:96px;border-radius:10px;background:var(--yhx-bg-2);object-fit:contain}
.yhx-confirm-name{font-size:13.5px;font-weight:600;color:var(--yhx-text);word-break:break-all}
.yhx-confirm-tip{font-size:12.5px;color:var(--yhx-text-2)}
/* ---------- 一键收藏表情（每张合格图片一个常驻按钮） ---------- */
.yhx-eg-btn{position:fixed;z-index:2147483647;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;border:0;background:rgba(32,36,42,.85);color:#fff;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3);padding:0;margin:0}
.yhx-eg-btn svg{width:16px;height:16px;display:block}
.yhx-eg-btn:hover{background:#1abc9c}
.yhx-eg-btn.is-done{background:#16a085}
html.yh-theme-dark .yhx-eg-btn{background:rgba(15,17,20,.85)}
html.yh-theme-dark .yhx-eg-btn:hover{background:#16a085}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-eg-btn{background:rgba(15,17,20,.85)}
  html.yh-theme-system .yhx-eg-btn:hover{background:#16a085}
}
/* ---------- 关键词屏蔽 ---------- */
.listdata{position:relative}
.yhx-kw-add{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-left:4px;border:0;border-radius:4px;background:transparent;color:#9aa0a6;cursor:pointer;padding:0;vertical-align:middle}
.yhx-kw-add svg{width:13px;height:13px;display:block}
.yhx-kw-add:hover{color:#e5534b;background:rgba(229,83,75,.1)}
.yhx-kw-blurred .yhx-kw-inner{filter:blur(5px);pointer-events:none;user-select:none}
.yhx-kw-cover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(250,251,252,.55);z-index:3;border-radius:6px;padding:4px}
.yhx-kw-cover-hint{font-size:12px;color:#6b7280;max-width:92%;text-align:center;line-height:1.5;word-break:break-all}
.yhx-kw-cover-btns{display:flex;gap:6px}
.yhx-kw-btn{height:26px;padding:0 10px;border:1px solid #d8dbe0;border-radius:7px;background:#fff;color:#333;font-size:12px;cursor:pointer;white-space:nowrap}
.yhx-kw-btn:hover{border-color:#1abc9c;color:#128f77}
html.yh-theme-dark .yhx-kw-cover{background:rgba(31,32,35,.6)}
html.yh-theme-dark .yhx-kw-btn{background:#2e3135;border-color:#3f434a;color:#c9cdd3}
html.yh-theme-dark .yhx-kw-cover-hint{color:#a8adb5}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-kw-cover{background:rgba(31,32,35,.6)}
  html.yh-theme-system .yhx-kw-btn{background:#2e3135;border-color:#3f434a;color:#c9cdd3}
  html.yh-theme-system .yhx-kw-cover-hint{color:#a8adb5}
}
/* 管理器（设置面板 + 弹窗共用，挂在 #yhx-root 内可用主题变量） */
.yhx-kw-mode{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.yhx-kw-mode-label{font-size:12.5px;color:var(--yhx-text-2)}
.yhx-kw-mode-btns{display:flex;gap:6px}
.yhx-kw-mode-btn{height:26px;padding:0 10px;border:1px solid var(--yhx-border);border-radius:7px;background:transparent;color:var(--yhx-text-2);font-size:12px;cursor:pointer}
.yhx-kw-mode-btn.is-on{background:var(--yhx-accent);border-color:var(--yhx-accent);color:#fff}
.yhx-kw-inputrow{display:flex;gap:6px;margin-bottom:8px}
.yhx-kw-input{flex:1;min-width:0;height:30px;border:1px solid var(--yhx-border);border-radius:7px;background:var(--yhx-bg);color:var(--yhx-text);font-size:12.5px;padding:0 8px;outline:none}
.yhx-kw-input:focus{border-color:var(--yhx-accent)}
.yhx-kw-addbtn{flex:none;height:30px;padding:0 12px;border:0;border-radius:7px;background:var(--yhx-accent);color:#fff;font-size:12.5px;cursor:pointer}
.yhx-kw-tags{display:flex;flex-wrap:wrap;gap:6px}
.yhx-kw-tag{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 4px 0 9px;border-radius:12px;background:var(--yhx-accent-soft);color:var(--yhx-text);font-size:12px;word-break:break-all}
.yhx-kw-tag-x{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;padding:0}
.yhx-kw-tag-x svg{width:9px;height:9px}
.yhx-kw-tag-x:hover{background:rgba(229,83,75,.9);color:#fff}
.yhx-kw-empty{font-size:12px;color:var(--yhx-text-3);padding:2px 0}
/* ---------- 自动吃肉：吃肉词管理 ---------- */
.yhx-ae-wrap{margin-top:6px}
.yhx-ae-hint{font-size:12px;color:#8a919c;margin-bottom:6px}
.yhx-ae-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
.yhx-ae-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:12px;background:rgba(26,188,156,.1);color:#128f77;font-size:12px;max-width:100%;word-break:break-all}
.yhx-ae-tag-x{font-style:normal;cursor:pointer;color:#1abc9c;font-weight:bold;padding:0 2px;user-select:none}
.yhx-ae-tag-x:hover{color:#e5534b}
.yhx-ae-empty{font-size:12px;color:#b0b6bf}
.yhx-ae-row{display:flex;gap:6px}
.yhx-ae-input{flex:1;height:28px;padding:0 9px;border:1px solid #d4d4d4;border-radius:8px;font-size:13px;color:#333;background:#fff;box-sizing:border-box;min-width:0}
.yhx-ae-input:focus{outline:0;border-color:#1abc9c}
.yhx-ae-add{height:28px;padding:0 12px;border:1px solid #1abc9c;border-radius:8px;background:#fff;color:#1abc9c;font-size:12px;cursor:pointer;white-space:nowrap}
.yhx-ae-add:hover{background:#1abc9c;color:#fff}
.yhx-ae-reset{margin-top:8px;height:24px;padding:0 10px;border:1px solid #d8dbe0;border-radius:6px;background:#fff;color:#8a919c;font-size:12px;cursor:pointer}
.yhx-ae-reset:hover{color:#333;border-color:#1abc9c}
html.yh-theme-dark .yhx-ae-tag{background:rgba(26,188,156,.16);color:#2ec8a8}
html.yh-theme-dark .yhx-ae-input{background:#26282c;border-color:#3f434a;color:#c9cdd3}
html.yh-theme-dark .yhx-ae-add{background:#26282c}
html.yh-theme-dark .yhx-ae-reset{background:#26282c;border-color:#3f434a;color:#7c828b}
@media (prefers-color-scheme:dark){
  html.yh-theme-system .yhx-ae-tag{background:rgba(26,188,156,.16);color:#2ec8a8}
  html.yh-theme-system .yhx-ae-input{background:#26282c;border-color:#3f434a;color:#c9cdd3}
  html.yh-theme-system .yhx-ae-add{background:#26282c}
  html.yh-theme-system .yhx-ae-reset{background:#26282c;border-color:#3f434a;color:#7c828b}
}
/* ---------- 自定义 UBB ---------- */
.ubb-btn .yhx-cu-icon{width:20px;height:20px;display:block;object-fit:contain}
.ubb-btn .yhx-cu-icon-fallback{font-size:15px;font-weight:bold;line-height:1}
.yhx-cu-pop{position:fixed;z-index:2147483646;background:var(--yhx-bg);border:1px solid var(--yhx-border-2);border-radius:12px;box-shadow:0 8px 26px rgba(17,24,39,.18);padding:12px;min-width:230px;max-width:320px;font-family:inherit}
.yhx-cu-pop-title{font-size:13px;font-weight:600;color:var(--yhx-text);margin-bottom:8px}
.yhx-cu-param{margin-bottom:9px}
.yhx-cu-param-name{display:block;font-size:12px;color:var(--yhx-text-3);margin-bottom:3px}
.yhx-cu-param-input{width:100%;height:32px;padding:0 9px;border:1px solid var(--yhx-border-2);border-radius:8px;font-size:13px;color:var(--yhx-text);background:var(--yhx-bg-2);box-sizing:border-box;outline:0}
.yhx-cu-param-input:focus{border-color:var(--yhx-accent)}
.yhx-cu-ok{width:100%;height:34px;font-weight:600}
.yhx-cu-list{margin-bottom:12px}
.yhx-cu-list-empty{font-size:12px;color:var(--yhx-text-3);padding:4px 0}
.yhx-cu-list-row{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid var(--yhx-border);border-radius:10px;margin-bottom:7px}
.yhx-cu-list-row .yhx-cu-icon{width:22px;height:22px;flex:none;object-fit:contain}
.yhx-cu-list-main{flex:1;min-width:0}
.yhx-cu-list-title{font-size:13px;font-weight:600;color:var(--yhx-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yhx-cu-list-code{font-size:11px;color:var(--yhx-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yhx-cu-list-row .yhx-btn{flex:none;height:30px;padding:0 12px;font-size:12px}
.yhx-cu-label{font-size:12px;font-weight:600;color:var(--yhx-text-3);margin:10px 0 5px}
.yhx-cu-code{height:76px;padding:9px 12px;font-family:Consolas,Menlo,monospace;font-size:13px;resize:vertical;line-height:1.5}
.yhx-cu-hint{font-size:12px;color:var(--yhx-text-3)}
.yhx-cu-param-row{border:1px solid var(--yhx-border);border-radius:10px;padding:9px 10px;margin-bottom:8px}
.yhx-cu-param-head{font-size:12px;font-weight:600;color:var(--yhx-text-2);margin-bottom:6px}
.yhx-cu-param-row .yhx-field{margin-bottom:6px;font-size:13px;height:36px}
.yhx-cu-param-row .yhx-field:last-child{margin-bottom:0}
.yhx-cu-icon-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.yhx-cu-icon-row .yhx-btn{flex:none;height:32px;padding:0 12px;font-size:12px;font-family:inherit;position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center}
.yhx-cu-icon-row .yhx-cu-file{position:absolute;inset:0;opacity:0;cursor:pointer}
.yhx-cu-file{display:none}
.yhx-cu-icon-row label.yhx-btn .yhx-cu-file{display:block}
.yhx-cu-b64{height:60px;padding:8px 12px;font-size:11px;font-family:Consolas,Menlo,monospace;resize:vertical;word-break:break-all}
.yhx-cu-icon-preview{display:flex;align-items:center;max-width:64px;min-height:44px;border:1px solid var(--yhx-border);border-radius:8px;margin:4px 0 8px;object-fit:contain;background:var(--yhx-bg-2);padding:6px;box-sizing:content-box;width:52px}
.yhx-cu-icon-preview img{max-width:52px;max-height:52px;object-fit:contain}
.yhx-cu-icon-preview svg{width:40px;height:40px;display:block}
.yhx-cu-icon-svg{display:inline-flex}
.yhx-cu-icon-svg svg{width:20px;height:20px;display:block}
.yhx-cu-list-row .yhx-cu-icon-svg svg{width:22px;height:22px}
/* ---------- Toast ---------- */.yhx-toast{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));transform:translate(-50%,12px);max-width:min(86vw,420px);padding:10px 16px;border-radius:10px;background:rgba(32,36,42,.94);color:#fff;font-size:13px;line-height:1.5;text-align:center;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:2;word-break:break-word}
.yhx-toast.show{opacity:1;transform:translate(-50%,0)}
.yhx-toast.error{background:rgba(180,52,44,.96)}
.yhx-toast.ok{background:rgba(22,160,133,.96)}
/* ---------- 移动端 ---------- */
@media (max-width:640px){
  .yhx-mask{padding:0;align-items:flex-end}
  .yhx-sheet{width:100%;max-width:100%;min-height:46vh;max-height:88vh;border-radius:18px 18px 0 0;transform:translateY(100%);opacity:1;transition:transform .3s cubic-bezier(.22,.61,.36,1)}
  .yhx-mask.is-open .yhx-sheet{transform:none}
  .yhx-sheet::before{content:"";position:absolute;top:8px;left:50%;width:36px;height:4px;margin-left:-18px;border-radius:4px;background:var(--yhx-border-2);opacity:.8}
  .yhx-hd{padding:20px 16px 12px}
  .yhx-body{padding:6px 8px}
  .yhx-item{padding:14px 10px;min-height:64px}
  .yhx-suboptions{margin:-4px 8px 10px 50px;padding:2px 10px}
  .yhx-suboption{padding:10px 0}
  .yhx-mini-switch{width:42px;height:24px}
  .yhx-mini-switch::after{width:19px;height:19px;top:2.5px;left:2.5px}
  .yhx-mini-switch[aria-checked="true"]::after{transform:translateX(18px)}
  .yhx-num{width:74px;height:36px;font-size:16px;line-height:34px}
  /* 移动端：位置沿用 CSS 的 right，JS 只接管桌面端 */
  .yhx-dock{right:12px;bottom:calc(120px + env(safe-area-inset-bottom));gap:7px}
  .yhx-glass{width:40px;height:40px}
  .yhx-glass svg{width:18px;height:18px}
  /* 手指点得住的最小尺寸 */
  /* 站点给操作行加了 margin-bottom:-6px + translateY(3px)（纯文字链接时代的贴底补偿），
   * 加上 +1 按钮后整行会溢出楼层边框——清掉，行回到楼层内；按钮 24px 居中不压回复文字 */
  .yhx-plus-host{min-height:30px}
  a.yhx-plus{width:24px!important;height:24px!important;font-size:11px!important;margin:0 0 0 10px!important;align-self:center}
  /* 打赏自定义行：加高到 36px，字号 16px 防 iOS 聚焦缩放 */
  /* 打赏自定义格子：格子本身已是站点尺寸，只需让输入框字号够大防 iOS 缩放 */
  .yhx-rw-custom .yhx-rw-input{font-size:16px}
  .yhx-rich{font-size:16px;line-height:1.75;min-height:96px}
  .yhx-rich-item[data-type="image"] img,.yhx-rich-item[data-type="img"] img{max-height:170px}
  .yhx-rich-link span{max-width:200px}
  .yhx-rich-edit{width:22px;height:22px;opacity:1}
  .yhx-rich-edit svg{width:11px;height:11px}
  .yhx-item-name{font-size:15px}
  .yhx-item-desc{font-size:12.5px}
  .yhx-switch{width:50px;height:29px}
  .yhx-switch::after{width:23px;height:23px}
  .yhx-switch[aria-checked="true"]::after{transform:translateX(21px)}
  .yhx-ft{padding:10px 12px calc(12px + env(safe-area-inset-bottom))}
  .yhx-btn{height:46px;font-size:14px}
  .yhx-field{height:46px;font-size:16px}
  .yhx-grid{grid-template-columns:repeat(auto-fill,minmax(72px,1fr));padding:0 14px 8px}
  .yhx-cell img{height:50px}
  .yhx-toast{bottom:calc(24px + env(safe-area-inset-bottom));font-size:13.5px}
}
@media (max-width:380px){
  .yhx-grid{grid-template-columns:repeat(3,1fr)}
}
`;
  function injectCSS() {
    if ($('#yhx-style')) return;
    const style = h('style', { id: 'yhx-style', text: CSS });
    (document.head || document.documentElement).appendChild(style);
  }
  const UI = {
    root: null,
    dock: null,
    setBtn: null,
    mask: null,
    sheet: null,
    toastEl: null,
    toastTimer: 0,
    subPanel: null,
    _dockRaf: 0,
    _dockScrollTimer: 0,
    _sheetOpen: false,
    mount() {
      if (this.root) return;
      this._inFrame = window.self !== window.top;
      this.root = h('div', { id: 'yhx-root' });
      document.body.appendChild(this.root);
      if (!this._inFrame) {
        this.dock = h('div', { class: 'yhx-dock', role: 'toolbar', 'aria-label': '妖火 · Next' });
        this.setBtn = h('button', {
          class: 'yhx-glass yhx-glass-set', type: 'button',
          title: '插件设置（Alt + ,）', 'aria-label': '插件设置',
          html: ICON.gear,
          onclick: () => this.toggle(),
        });
        this.dock.appendChild(this.setBtn);
        this.root.appendChild(this.dock);
      }
      this.toastEl = h('div', { class: 'yhx-toast', role: 'status' });
      this.root.appendChild(this.toastEl);
      if (!this._inFrame) this.watchEntry();
      this.syncDock();
      this.watchDialogs();
      window.addEventListener('resize', () => this.scheduleDock());
      window.addEventListener('scroll', () => {
        clearTimeout(this._dockScrollTimer);
        this._dockScrollTimer = setTimeout(() => this.syncDock(), 400);
      }, { passive: true });
      Bus.on('global:change', (e) => {
        if (e.key === 'showDock') this.syncDock();
      });
      document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === ',' || e.key === '，')) {
          e.preventDefault();
          this.toggle();
        }
      });
    },
    findEntrySpot() {
      const sub = $('.subtitle2') || $('.subtitle');
      if (sub) {
        const all = $$('a', sub);
        const setLink = all.find((a) => a.textContent.trim() === '设置');
        return { node: sub, after: setLink || all[all.length - 1] || null, mode: 'class:subtitle2' };
      }
      if (window.self !== window.top) return null;
      if (/book_re\.aspx/i.test(location.pathname)) return null;
      if ($$('.admin-actions').length > 1) return null;
      const bars = $$('.admin-actions');
      if (bars.length) {
        const bar = bars.find((b) => /打赏/.test(b.textContent)) || bars[0];
        const all = $$('a', bar);
        return { node: bar, after: all[all.length - 1] || null, mode: 'class:admin-actions' };
      }
      const reward = $$('a, button').find((el) => (el.textContent || '').trim() === '打赏');
      if (reward && reward.parentElement && reward.parentElement !== document.body) {
        const bar = reward.parentElement;
        const all = $$('a', bar);
        const setLink = all.find((a) => a.textContent.trim() === '设置');
        return { node: bar, after: setLink || all[all.length - 1] || reward, mode: 'anchor:打赏' };
      }
      const setLink = $$('a, button')
        .filter((el) => (el.textContent || '').trim() === '设置')
        .find((el) => el.closest('.forum-post, .viewContent, .forum-container, .floor-info, .post-header, .post-content'));
      if (setLink && setLink.parentElement) {
        return { node: setLink.parentElement, after: setLink, mode: 'anchor:设置' };
      }
      const guess = $$('.post-actions, .topic-actions, .floor-actions, .post-tools, .action-bar, .post-admin, .admin-actions')
        .filter((el) => el.querySelectorAll('a').length <= 12)[0];
      if (guess) return { node: guess, after: null, mode: 'class:guess' };
      return null;
    },
    tryNativeEntry() {
      if (this._nativeEntry && !document.contains(this._nativeEntry)) this._nativeEntry = null;
      if (this._nativeEntry) return;
      const spot = this.findEntrySpot();
      if (!spot || !spot.node) return;
      if (spot.node.querySelector('[data-yhx-entry]')) return;
      const links = $$('a', spot.node);
      const sample = links.find((a) => a.textContent.trim() === '设置')
        || links.find((a) => a.textContent.trim() === '管理')
        || links[0];
      const link = h('a', {
        text: '插件设置',
        role: 'link',
        tabindex: '0',
        'data-yhx-entry': '1',
        style: { cursor: 'pointer' },
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); this.open(); },
        onkeydown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(); }
        },
      });
      if (sample && sample.className && !/placeholder/.test(sample.className)) {
        link.className = sample.className;
      }
      const inline = sample && sample.getAttribute('style');
      if (inline) link.setAttribute('style', inline.replace(/;?$/, ';') + 'cursor:pointer');
      link.style.marginLeft = '';
      link.style.marginRight = '';
      if (spot.after && spot.after.parentNode === spot.node) {
        spot.node.insertBefore(link, spot.after.nextSibling);
      } else {
        if (spot.node.firstChild) spot.node.appendChild(document.createTextNode(' '));
        spot.node.appendChild(link);
      }
      const alignGap = () => {
        if (!document.contains(link)) return;
        const anchors = $$('a', spot.node).filter((a) => a !== link);
        if (anchors.length < 2) { link.style.marginLeft = ''; return; }
        const ref = (spot.after && anchors.indexOf(spot.after) > -1)
          ? spot.after
          : anchors[anchors.length - 1];
        const i = anchors.indexOf(ref);
        const prev = i > 0 ? anchors[i - 1] : null;
        if (!prev) { link.style.marginLeft = ''; return; }
        if (!(ref.compareDocumentPosition(link) & 4)) return;
        const baseGap = ref.getBoundingClientRect().left - prev.getBoundingClientRect().right;
        const myGap = link.getBoundingClientRect().left - ref.getBoundingClientRect().right;
        const diff = baseGap - myGap;
        link.style.marginLeft = Math.abs(diff) >= 0.5 ? diff.toFixed(2) + 'px' : '';
      };
      alignGap();
      setTimeout(alignGap, 80);
      setTimeout(alignGap, 360);
      this._nativeEntry = link;
      this._entryMode = spot.mode;
      this.updateDock();
    },
    scheduleDock() {
      if (this._dockRaf) return;
      this._dockRaf = requestAnimationFrame(() => {
        this._dockRaf = 0;
        this.syncDock();
      });
    },
    updateDock() {
      const dock = this.dock;
      if (!dock) return;
      dock.hidden = !!this._sheetOpen;
      if (this.setBtn) {
        const showSet = Config.global('showDock', true);
        this.setBtn.hidden = !showSet;
        this.setBtn.style.display = showSet ? '' : 'none';
      }
    },
    bottomGutter() {
      const vh = window.innerHeight || 0;
      const vw = window.innerWidth || 0;
      if (!vh || !vw) return 0;
      const y = vh - 6;
      const xs = [Math.round(vw * 0.2), Math.round(vw * 0.5), Math.round(vw * 0.8)];
      let tallest = 0;
      xs.forEach((x) => {
        let stack = [];
        try { stack = document.elementsFromPoint(x, y) || []; } catch (_) { return; }
        for (let i = 0; i < stack.length; i++) {
          const el = stack[i];
          if (!el || el.nodeType !== 1) continue;
          if (el.id === 'yhx-root' || (el.closest && el.closest('#yhx-root'))) continue;
          const r = el.getBoundingClientRect();
          if (r.height <= 0 || r.height > vh * 0.5) continue;
          if (r.width < vw * 0.5) continue;
          if (r.bottom < vh - 4) continue;
          const cs = window.getComputedStyle(el);
          if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
          tallest = Math.max(tallest, vh - r.top);
        }
      });
      return Math.round(tallest);
    },
    syncDock() {
      const dock = this.dock;
      if (!dock) return;
      this.updateDock();
      if (this.hasOpenDialog()) {
        dock.hidden = true;
        return;
      }
      if (dock.hidden) return;
      const desktop = !isNarrowScreen();
      const bodyRect = document.body.getBoundingClientRect();
      const w = Math.round(dock.getBoundingClientRect().width) || 44;
      const vw = window.innerWidth;
      let left = desktop ? bodyRect.right + 10 : bodyRect.right - w - 12;
      left = Math.max(8, Math.min(left, vw - w - 8));
      dock.style.left = Math.round(left) + 'px';
      dock.style.right = 'auto';
      const base = desktop ? 96 : 120;
      const gutter = this.bottomGutter();
      dock.style.bottom = Math.round(Math.max(base, gutter + 14)) + 'px';
    },
    hasOpenDialog() {
      return $$('.yhx-mask').some((m) => !m.hidden);
    },
    watchDialogs() {
      if (this._dlgObserver) return;
      this._dialogHidden = false;
      this._dlgObserver = new MutationObserver(debounce(() => {
        const has = this.hasOpenDialog();
        if (has !== this._dialogHidden) {
          this._dialogHidden = has;
          this.syncDock();
        }
      }, 80));
      this._dlgObserver.observe(this.root, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['hidden', 'class'],
      });
    },
    setGlobal(key, val) {
      Config.setGlobal(key, val);
      if (key === 'master') {
        if (val) {
          Registry.boot();
          UI.toast('插件已启用', 'ok');
        } else {
          Registry.shutdown();
          UI.toast('插件已暂停，各项开关状态已保留', '');
        }
        if (this.bodyEl) this.renderList();
      }
      if (key === 'showDock') this.syncDock();
    },
    watchEntry() {
      this.tryNativeEntry();
      if (this._entryObserver) return;
      this._entryObserver = new MutationObserver(debounce(() => this.tryNativeEntry(), 180));
      this._entryObserver.observe(document.body, { childList: true, subtree: true });
      [500, 1600].forEach((ms) => setTimeout(() => this.tryNativeEntry(), ms));
    },
    toast(msg, type) {
      if (!this.toastEl) return;
      this.toastEl.textContent = msg;
      this.toastEl.className = 'yhx-toast show' + (type ? ' ' + type : '');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastEl.className = 'yhx-toast' + (type ? ' ' + type : '');
      }, type === 'error' ? 3200 : 1900);
    },
    buildSheet() {
      const body = h('div', { class: 'yhx-body' });
      this.bodyEl = body;
      const sheet = h('div', {
        class: 'yhx-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': '妖火 · Next 设置',
      },
        h('div', { class: 'yhx-hd' },
          h('div', { class: 'yhx-hd-title', html: ICON.gear + '<span>妖火 · Next</span>' }),
          h('span', { class: 'yhx-hd-badge', text: 'v' + VERSION }),
          h('div', { class: 'yhx-grow' }),
          h('button', {
            class: 'yhx-iconbtn', type: 'button', 'aria-label': '关闭', html: ICON.close,
            onclick: () => this.close(),
          }),
        ),
        body,
        h('div', { class: 'yhx-hint', text: '按 Alt + , 可随时打开此面板' }),
        h('div', { class: 'yhx-ft' },
          h('button', { class: 'yhx-btn', type: 'button', text: '导出配置', onclick: () => this.exportConfig() }),
          h('button', { class: 'yhx-btn', type: 'button', text: '导入配置', onclick: () => this.importConfig() }),
          h('button', { class: 'yhx-btn danger', type: 'button', text: '重置', onclick: () => this.confirmReset() }),
        ),
      );
      const mask = h('div', { class: 'yhx-mask', hidden: 'hidden' }, sheet);
      mask.addEventListener('click', (e) => { if (e.target === mask) this.close(); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.mask && !this.mask.hidden) this.close();
      });
      this.root.appendChild(mask);
      this.mask = mask;
      this.sheet = sheet;
      this.setupSheetGesture(sheet);
    },
    setupSheetGesture(sheet) {
      let startY = 0, delta = 0, dragging = false;
      sheet.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 640) return;
        const t = e.target;
        if (t.closest && (t.closest('button') || t.closest('.yhx-body'))) return;
        dragging = true;
        startY = e.touches[0].clientY;
        delta = 0;
        sheet.style.transition = 'none';
      }, { passive: true });
      sheet.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        delta = Math.max(0, e.touches[0].clientY - startY);
        sheet.style.transform = 'translateY(' + delta + 'px)';
      }, { passive: true });
      const end = () => {
        if (!dragging) return;
        dragging = false;
        sheet.style.transition = '';
        if (delta > 90) { sheet.style.transform = ''; this.close(); }
        else sheet.style.transform = '';
        delta = 0;
      };
      sheet.addEventListener('touchend', end);
      sheet.addEventListener('touchcancel', end);
    },
    renderList() {
      if (!this.bodyEl) return;
      const body = this.bodyEl;
      body.textContent = '';
      const masterOn = Config.global('master', true);
      body.appendChild(this.buildGlobalItem({
        key: 'master',
        icon: ICON.gear,
        name: '插件总开关',
        desc: '关闭后所有功能立即停止，但各功能自己的开关状态会原样保留，下次打开总开关仍按原状态生效。',
        fallback: true,
      }));
      body.appendChild(this.buildGlobalItem({
        key: 'showDock',
        icon: ICON.eye,
        name: '显示悬浮入口',
        desc: '在页面右下角显示「设置 / 到顶 / 到底」三个悬浮按钮。',
        fallback: true,
      }));
      const list = Registry.list();
      if (!list.length) {
        body.appendChild(h('div', { class: 'yhx-empty', text: '还没有注册任何功能' }));
        return;
      }
      if (!masterOn) {
        body.appendChild(h('div', {
          class: 'yhx-paused',
          text: '总开关已关闭：以下功能暂停运行，开关状态都还留着，打开总开关即可恢复。',
        }));
      }
      list.forEach((def) => body.appendChild(this.buildItem(def)));
    },
    buildGlobalItem(cfg) {
      const on = Config.global(cfg.key, cfg.fallback);
      const sw = h('button', {
        class: 'yhx-switch', type: 'button', role: 'switch',
        'aria-checked': on ? 'true' : 'false',
        'aria-label': (on ? '关闭 ' : '开启 ') + cfg.name,
        onclick: (e) => {
          e.stopPropagation();
          const next = sw.getAttribute('aria-checked') !== 'true';
          sw.setAttribute('aria-checked', next ? 'true' : 'false');
          UI.setGlobal(cfg.key, next);
        },
      });
      return h('div', { class: 'yhx-item-wrap' },
        h('div', { class: 'yhx-item', dataset: { global: cfg.key } },
          h('div', { class: 'yhx-item-ico', html: cfg.icon }),
          h('div', { class: 'yhx-item-main' },
            h('div', { class: 'yhx-item-name' }, h('span', { text: cfg.name })),
            h('div', { class: 'yhx-item-desc', text: cfg.desc }),
          ),
          h('div', { class: 'yhx-item-act' }, sw),
        ),
      );
    },
    buildItem(def) {
      const on = Registry.isOn(def.id);
      const status = Registry.status(def.id);
      const sw = h('button', {
        class: 'yhx-switch', type: 'button', role: 'switch',
        'aria-checked': on ? 'true' : 'false',
        'aria-label': (on ? '关闭 ' : '开启 ') + def.name,
        onclick: (e) => {
          e.stopPropagation();
          const next = sw.getAttribute('aria-checked') !== 'true';
          sw.setAttribute('aria-checked', next ? 'true' : 'false');
          Registry.setEnabled(def.id, next);
          this.renderList();
          this.toast((next ? '已开启 ' : '已关闭 ') + def.name, next ? 'ok' : '');
        },
      });
      const acts = h('div', { class: 'yhx-item-act' });
      if (def.openPanel) {
        acts.appendChild(h('button', {
          class: 'yhx-link', type: 'button', text: '管理',
          onclick: (e) => { e.stopPropagation(); this.openSubPanel(def.id); },
        }));
      }
      acts.appendChild(sw);
      const handle = h('span', { class: 'yhx-drag', text: '⠿', title: '拖动排序' });
      handle.draggable = true;
      handle.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', def.id);
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setDragImage(item, Math.round(item.offsetWidth / 2), 24); } catch (_) {}
        this._dragId = def.id;
        this.startDragScroll();
        handle.closest('.yhx-item-wrap').classList.add('is-dragging');
      });
      handle.addEventListener('dragend', () => {
        this._dragId = null;
        this.stopDragScroll();
        $$('.yhx-item-wrap').forEach((w) => w.classList.remove('is-dragging', 'is-over-before', 'is-over-after'));
      });
      const item = h('div', { class: 'yhx-item', dataset: { id: def.id } },
        handle,
        h('div', { class: 'yhx-item-ico', html: def.icon || ICON.gear }),
        h('div', { class: 'yhx-item-main' },
          h('div', { class: 'yhx-item-name' },
            h('span', { text: def.name }),
            h('span', { class: 'yhx-pill' + (on ? ' on' : ''), text: on ? '已启用' : '已关闭' }),
          ),
          h('div', { class: 'yhx-item-desc', text: def.desc || '' }),
          status ? h('div', { class: 'yhx-item-stat', text: status }) : null,
        ),
        acts,
      );
      const wrap = h('div', { class: 'yhx-item-wrap' },
        item,
        (on && Array.isArray(def.options) && def.options.length) ? this.buildOptions(def) : null,
        (on && typeof def.renderSettings === 'function') ? this.buildFeatureSettings(def) : null,
      );
      wrap.addEventListener('dragover', (e) => {
        if (this._dragId === def.id) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const r = item.getBoundingClientRect();
        const before = (e.clientY - r.top) < r.height / 2;
        wrap.classList.toggle('is-over-before', before);
        wrap.classList.toggle('is-over-after', !before);
      });
      wrap.addEventListener('dragleave', () => {
        wrap.classList.remove('is-over-before', 'is-over-after');
      });
      wrap.addEventListener('drop', (e) => {
        e.preventDefault();
        wrap.classList.remove('is-over-before', 'is-over-after');
        const dragId = this._dragId;
        if (!dragId || dragId === def.id) return;
        const r = item.getBoundingClientRect();
        const before = (e.clientY - r.top) < r.height / 2;
        const ids = Registry.list().map((d) => d.id);
        const from = ids.indexOf(dragId);
        if (from > -1) ids.splice(from, 1);
        let at = ids.indexOf(def.id);
        if (at > -1 && !before) at += 1;
        if (at < 0) at = ids.length;
        ids.splice(at, 0, dragId);
        Registry.setOrder(ids);
        this.renderList();
      });
      return wrap;
    },
    startDragScroll() {
      if (this._dragScrollTimer) return;
      this._dragY = null;
      if (this.bodyEl && !this.bodyEl.__yhxScrollHook) {
        this.bodyEl.__yhxScrollHook = true;
        this.bodyEl.addEventListener('dragover', (e) => { this._dragY = e.clientY; });
        this.bodyEl.addEventListener('drop', () => this.stopDragScroll());
        this.bodyEl.addEventListener('dragend', () => this.stopDragScroll());
      }
      this._dragScrollTimer = setInterval(() => {
        const body = this.bodyEl;
        const y = this._dragY;
        if (!body || y == null) return;
        const r = body.getBoundingClientRect();
        if (y < r.top + 40) body.scrollTop -= 10;
        else if (y > r.bottom - 40) body.scrollTop += 10;
      }, 16);
    },
    stopDragScroll() {
      if (this._dragScrollTimer) { clearInterval(this._dragScrollTimer); this._dragScrollTimer = 0; }
      this._dragY = null;
    },
    buildFeatureSettings(def) {
      const box = h('div', { class: 'yhx-suboptions' });
      try { def.renderSettings(box); } catch (e) { }
      return box;
    },
    buildOptions(def) {
      const box = h('div', { class: 'yhx-suboptions' });
      def.options.forEach((opt) => {
        box.appendChild(opt.type === 'number'
          ? this.buildNumberOption(def, opt)
          : this.buildSwitchOption(def, opt));
      });
      return box;
    },
    buildSwitchOption(def, opt) {
      const checked = Config.opt(def.id, opt.key, opt.default);
      const mini = h('button', {
        class: 'yhx-mini-switch', type: 'button', role: 'switch',
        'aria-checked': checked ? 'true' : 'false',
        'aria-label': (checked ? '关闭 ' : '开启 ') + opt.name,
        onclick: (e) => {
          e.stopPropagation();
          const next = mini.getAttribute('aria-checked') !== 'true';
          mini.setAttribute('aria-checked', next ? 'true' : 'false');
          Registry.setOption(def.id, opt.key, next);
          UI.toast((next ? '已开启 ' : '已关闭 ') + opt.name, next ? 'ok' : '');
        },
      });
      return h('div', { class: 'yhx-suboption' },
        h('div', { class: 'yhx-suboption-text' },
          h('span', { class: 'yhx-suboption-name', text: opt.name }),
          opt.hint ? h('code', { class: 'yhx-suboption-hint', text: opt.hint }) : null,
        ),
        mini,
      );
    },
    buildNumberOption(def, opt) {
      const min = opt.min != null ? opt.min : 1;
      const max = opt.max != null ? opt.max : 9999;
      const cur = Config.num(def.id, opt.key, opt.default, min, max);
      const input = h('input', {
        class: 'yhx-num', type: 'number', inputmode: 'numeric',
        min: String(min), max: String(max), step: String(opt.step || 1),
        value: String(cur), 'aria-label': opt.name,
      });
      const commit = () => {
        let v = Math.round(Number(input.value));
        if (!Number.isFinite(v)) v = opt.default;
        v = Math.min(max, Math.max(min, v));
        if (String(v) !== input.value) input.value = String(v);
        if (v === Config.num(def.id, opt.key, opt.default, min, max)) return;
        Registry.setOption(def.id, opt.key, v);
      };
      input.addEventListener('input', debounce(commit, 400));
      input.addEventListener('change', commit);
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); input.blur(); } });
      return h('div', { class: 'yhx-suboption' },
        h('div', { class: 'yhx-suboption-text' },
          h('span', { class: 'yhx-suboption-name', text: opt.name }),
          opt.hint ? h('code', { class: 'yhx-suboption-hint', text: opt.hint }) : null,
        ),
        h('div', { class: 'yhx-numfield' },
          input,
          opt.unit ? h('span', { class: 'yhx-numfield-unit', text: opt.unit }) : null,
        ),
      );
    },
    open() {
      if (!this.mask) this.buildSheet();
      this.renderList();
      this._sheetOpen = true;
      this.updateDock();
      this.mask.hidden = false;
      requestAnimationFrame(() => this.mask.classList.add('is-open'));
    },
    close() {
      if (!this.mask) return;
      this.mask.classList.remove('is-open');
      const done = () => {
        if (!this.mask) return;
        this.mask.hidden = true;
        this._sheetOpen = false;
        this.updateDock();
      };
      setTimeout(done, 280);
    },
    toggle() {
      if (!this.mask) { this.open(); return; }
      if (this.mask.hidden) this.open();
      else this.close();
    },
    openSubPanel(id, opts) {
      const def = Registry.map.get(id);
      if (!def || !def.openPanel) return;
      if (this.subPanel && this.subPanel.close) { try { this.subPanel.close(); } catch (_) {} }
      this.subPanel = def.openPanel(Registry.ctx(), opts || {}) || null;
    },
    exportConfig() {
      const payload = {
        kind: 'yhx-config',
        version: VERSION,
        exportedAt: new Date().toISOString(),
        features: Object.keys(Config.data.features).reduce((acc, k) => {
          acc[k] = Config.data.features[k];
          return acc;
        }, {}),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = h('a', {
        href: URL.createObjectURL(blob),
        download: 'yaohuo-next-config.json',
      });
      this.root.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      this.toast('配置已导出', 'ok');
    },
    importConfig() {
      const input = h('input', { type: 'file', accept: 'application/json,.json' });
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(String(reader.result || '{}'));
            if (!data || typeof data.features !== 'object') throw new Error('格式不正确');
            Object.keys(data.features).forEach((k) => {
              if (Registry.map.has(k)) Config.setOn(k, !!data.features[k]);
            });
            this.renderList();
            this.toast('配置已导入，刷新后完全生效', 'ok');
          } catch (e) {
            this.toast('导入失败：' + (e.message || e), 'error');
          }
        };
        reader.readAsText(file);
      });
      input.click();
    },
    confirmReset() {
      if (!window.confirm('重置将清除所有功能开关（自定义表情数据保留），确定继续？')) return;
      Config.reset();
      Registry.shutdown();
      Registry.boot();
      this.renderList();
      this.syncDock();
      this.toast('已重置', 'ok');
    },
  };
  const EmojiData = {
    KEY: 'emoji',
    MAX: 300,
    all() {
      const raw = Store.get(this.KEY, null);
      if (!Array.isArray(raw)) return [];
      return raw.filter((it) => it && typeof it.url === 'string' && it.url);
    },
    save(items) {
      const clean = items.slice(0, this.MAX);
      Store.set(this.KEY, clean);
      Bus.emit('emoji:change', clean);
      return clean;
    },
    add(url, name) {
      const items = this.all();
      if (items.some((it) => it.url === url)) {
        return { ok: false, reason: 'duplicate' };
      }
      if (items.length >= this.MAX) {
        return { ok: false, reason: 'limit' };
      }
      const item = {
        id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        url: url,
        name: (name || '').trim() || this.guessName(url),
        ts: Date.now(),
      };
      items.unshift(item);
      this.save(items);
      return { ok: true, item: item };
    },
    remove(id) {
      const items = this.all().filter((it) => it.id !== id);
      this.save(items);
    },
    clear() { this.save([]); },
    guessName(url) {
      try {
        const clean = url.split(/[?#]/)[0];
        const seg = clean.split('/').filter(Boolean).pop() || '表情';
        const base = decodeURIComponent(seg).replace(/\.[a-z0-9]{2,5}$/i, '');
        return base.slice(0, 16) || '表情';
      } catch (_) { return '表情'; }
    },
  };
  const Uploader = (() => {
    const FALLBACK_HOSTS = {
      img: [
        { url: 'https://tc.qdqqd.com/uploadmt', field: 'file' },
        { url: 'https://aapi.helioho.st/upload.php', field: 'image' },
      ],
      video: [
        { url: 'https://tc.qdqqd.com/uploadmt', field: 'file' },
      ],
    };
    const LIMITS = { img: 20 * 1024 * 1024, video: 50 * 1024 * 1024 };
    function hosts(kind) {
      try {
        const cfg = W.ImageUploadSHA && W.ImageUploadSHA.getConfig && W.ImageUploadSHA.getConfig();
        if (cfg) {
          const arr = kind === 'video' ? cfg.videoHosts : cfg.imageHosts;
          if (Array.isArray(arr) && arr.length) return arr.filter((x) => x && x.url);
        }
      } catch (_) {}
      return FALLBACK_HOSTS[kind] || FALLBACK_HOSTS.img;
    }
    function pickUrl(text, kind) {
      const raw = String(text || '').trim();
      if (!raw) return null;
      if (/^https?:\/\/\S+$/i.test(raw)) return raw;
      let data = null;
      try { data = JSON.parse(raw); } catch (_) {}
      const found = [];
      (function walk(v, depth) {
        if (depth > 6 || v == null || found.length > 3) return;
        if (typeof v === 'string') {
          if (/^https?:\/\//i.test(v)) {
            if (kind === 'video' || /\.(png|jpe?g|gif|webp|bmp|svg|avif|mp4|webm|mov|m4v)([?#]|$)/i.test(v)) found.push(v);
          }
          return;
        }
        if (typeof v === 'object') { for (const k in v) walk(v[k], depth + 1); }
      })(data, 0);
      if (found.length) return found[0];
      const ext = kind === 'video'
        ? '(?:mp4|webm|mov|m4v|ogv)'
        : '(?:png|jpe?g|gif|webp|bmp|svg|avif)';
      const m = raw.match(new RegExp('https?://[^\\s"\'<>\\\\]+?\\.' + ext, 'i'));
      return m ? m[0] : null;
    }
    function post(host, file, timeout) {
      return new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append(host.field || 'file', file, file.name || 'emoji.png');
        const xhr = new XMLHttpRequest();
        let timer = setTimeout(() => { try { xhr.abort(); } catch (_) {} reject(new Error('timeout')); }, timeout);
        xhr.open('POST', host.url, true);
        xhr.onload = () => {
          clearTimeout(timer);
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
          else reject(new Error('HTTP ' + xhr.status));
        };
        xhr.onerror = () => { clearTimeout(timer); reject(new Error('网络错误')); };
        xhr.onabort = () => { clearTimeout(timer); reject(new Error('已取消')); };
        xhr.send(fd);
      });
    }
    return {
      async upload(file, kind, timeout) {
        if (!file) throw new Error('没有文件');
        kind = kind || (/^video\//i.test(file.type || '') ? 'video' : 'img');
        const isVideo = kind === 'video';
        if (isVideo && !/^video\//i.test(file.type || '')) throw new Error('只支持视频文件');
        if (!isVideo && !/^image\//i.test(file.type || '')) throw new Error('只支持图片文件');
        if (file.size > LIMITS[kind]) {
          throw new Error((isVideo ? '视频' : '图片') + '超过 ' + Math.round(LIMITS[kind] / 1024 / 1024) + 'MB');
        }
        const list = hosts(kind);
        let lastErr = null;
        const t = timeout || (isVideo ? 90000 : 20000);
        for (const host of list) {
          try {
            const text = await post(host, file, t);
            const url = pickUrl(text, kind);
            if (url) return url;
            lastErr = new Error('图床未返回地址');
          } catch (e) { lastErr = e; }
        }
        throw lastErr || new Error('上传失败');
      },
    };
  })();
  const customEmoji = {
    id: 'customEmoji',
    name: '自定义表情',
    group: '编辑器增强',
    order: 10,
    defaultEnabled: true,
    icon: ICON.smile,
    desc: '在表情面板新增「自定义」分类，支持粘贴图片链接或上传本地图片，点击即插入 [img] 代码。',
    CAT_ID: 'custom',
    CAT: { id: 'custom', name: '自定义', cell: 'l' },
    _observer: null,
    _popObserver: null,
    _rawLoad: null,
    _patched: false,
    _offEmoji: null,
    status() {
      const n = EmojiData.all().length;
      return n ? n + ' 个表情' : '暂无表情，点「管理」添加';
    },
    init(ctx) {
      this.patch();
      this.watch();
      this.ensureAddButton();
      this.ensureEmptyHint();
      if (!this._offEmoji) {
        this._offEmoji = Bus.on('emoji:change', () => this.syncPane());
      }
    },
    destroy() {
      if (this._offEmoji) { this._offEmoji(); this._offEmoji = null; }
      try {
        const U = W.UbbEmoji;
        if (U && Array.isArray(U.cats)) {
          const i = U.cats.findIndex((c) => c.id === this.CAT_ID);
          if (i > -1) U.cats.splice(i, 1);
        }
        if (U && this._rawLoad) { U.load = this._rawLoad; }
        this._rawLoad = null;
        this._patched = false;
      } catch (e) { }
      const tabs = $$('.ubb-pop.emoji .ubb-emoji-tab');
      const idx = tabs.findIndex((t) => t.textContent.trim() === this.CAT.name);
      if (idx > -1) {
        tabs[idx].remove();
        const panes = $$('.ubb-pop.emoji .ubb-emoji-pane');
        if (panes[idx]) panes[idx].remove();
      }
      $$('.ubb-pop.emoji .yhx-emoji-add').forEach((n) => n.remove());
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      if (this._popObserver) { this._popObserver.disconnect(); this._popObserver = null; }
    },
    patch() {
      const U = W.UbbEmoji;
      if (!U || !Array.isArray(U.cats)) return false;
      if (!U.cats.some((c) => c.id === this.CAT_ID)) U.cats.push(this.CAT);
      if (!this._patched) {
        const self = this;
        this._rawLoad = U.load;
        U.load = function (id, cb) {
          if (id === self.CAT_ID) {
            const items = EmojiData.all().map((it) => ({ n: it.name, u: [it.url] }));
            try { cb(null, items); } catch (e) { }
            return;
          }
          return self._rawLoad.apply(this, arguments);
        };
        this._patched = true;
      }
      return true;
    },
    watch() {
      if (this._observer) return;
      const self = this;
      const rescan = debounce(() => {
        self.patch();
        self.ensureAddButton();
        self.ensureEmptyHint();
        self.addDeleteBadges();
        const pop = $('.ubb-pop.emoji');
        if (pop && !self._popObserver) {
          self._popObserver = new MutationObserver(() => {
            if (pop.classList.contains('show')) {
              setTimeout(() => { self.addDeleteBadges(); self.ensureEmptyHint(); }, 80);
            }
          });
          self._popObserver.observe(pop, { attributes: true, attributeFilter: ['class'] });
        }
      }, 120);
      this._observer = new MutationObserver((records) => {
        for (const r of records) {
          if (r.addedNodes && r.addedNodes.length) {
            for (const n of r.addedNodes) {
              if (n.nodeType === 1 && (n.classList.contains('ubb-pop') || n.querySelector && n.querySelector('.ubb-pop.emoji'))) {
                rescan();
                return;
              }
            }
          }
        }
      });
      this._observer.observe(document.body, { childList: true, subtree: true });
    },
    ensureAddButton() {
      const pop = $('.ubb-pop.emoji');
      if (!pop) return;
      const tabs = pop.querySelector('.ubb-emoji-tabs');
      if (!tabs || tabs.querySelector('.yhx-emoji-add')) return;
      const btn = h('button', {
        class: 'ubb-emoji-tab yhx-emoji-add', type: 'button', tabIndex: -1,
        title: '管理自定义表情',
        style: {
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          background: 'rgba(26,188,156,.12)', color: '#1abc9c',
          paddingLeft: '10px', paddingRight: '11px',
        },
        html: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>添加</span>',
        onclick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          UI.openSubPanel('customEmoji');
        },
      });
      tabs.appendChild(btn);
      const self = this;
      $$('.ubb-emoji-tab', tabs).forEach((tab) => {
        if (tab.__yhxBound) return;
        tab.__yhxBound = true;
        tab.addEventListener('click', () => setTimeout(() => {
          self.ensureEmptyHint();
          self.addDeleteBadges();
        }, 60));
      });
    },
    ensureEmptyHint() {
      const pop = $('.ubb-pop.emoji');
      if (!pop) return;
      const tabs = $$('.ubb-emoji-tab', pop);
      const idx = tabs.findIndex((t) => t.textContent.trim() === this.CAT.name);
      if (idx < 0) return;
      const panes = $$('.ubb-emoji-pane', pop);
      const pane = panes[idx];
      if (!pane || pane.hidden) return;
      if (EmojiData.all().length) return;
      if (pane.querySelector('.yhx-emoji-empty')) return;
      pane.appendChild(h('div', {
        class: 'yhx-emoji-empty',
        html: '<div>还没有自定义表情</div><a>点上方「添加」放一个进来</a>',
        onclick: (e) => {
          if (e.target.tagName === 'A') UI.openSubPanel('customEmoji');
        },
      }));
    },
    openPanel(ctx) {
      const self = this;
      let closed = false;
      const countEl = h('b', { text: String(EmojiData.all().length) });
      const grid = h('div', { class: 'yhx-grid' });
      const linkInput = h('input', {
        class: 'yhx-field', type: 'url', placeholder: 'https://example.com/emoji.gif',
        autocomplete: 'off', spellcheck: 'false',
      });
      const nameInput = h('input', {
        class: 'yhx-field', type: 'text', placeholder: '名称（可选，便于识别）',
        maxlength: '16', autocomplete: 'off',
      });
      const preview = h('div', { class: 'yhx-preview' });
      const addBtn = h('button', {
        class: 'yhx-btn primary', type: 'button', text: '添加到表情库',
        style: { width: '100%', marginTop: '12px', height: '42px' },
      });
      linkInput.addEventListener('input', () => {
        const v = linkInput.value.trim();
        const url = self.extractUrl(v);
        preview.textContent = '';
        if (url) {
          preview.classList.add('has');
          preview.appendChild(h('img', { src: url, alt: '预览', referrerpolicy: 'no-referrer' }));
        } else {
          preview.classList.remove('has');
        }
      });
      addBtn.addEventListener('click', () => {
        const url = self.extractUrl(linkInput.value);
        if (!url) { UI.toast('请输入有效的图片地址', 'error'); linkInput.focus(); return; }
        const r = EmojiData.add(url, nameInput.value);
        if (!r.ok) {
          UI.toast(r.reason === 'duplicate' ? '这个表情已经添加过了' : '表情数量已达上限', 'error');
          return;
        }
        linkInput.value = '';
        nameInput.value = '';
        preview.textContent = '';
        preview.classList.remove('has');
        renderGrid();
        self.refreshPanel();
        UI.toast('已添加', 'ok');
      });
      const fileInput = h('input', { type: 'file', accept: 'image/*', multiple: 'multiple', style: { display: 'none' } });
      const drop = h('div', {
        class: 'yhx-drop',
        html: ICON.upload + '<b>点击选择图片</b>，或拖拽到此处<small>支持 PNG / GIF / JPG / WebP，单张不超过 20MB</small>',
        onclick: () => fileInput.click(),
      });
      const handleFiles = async (files) => {
        const list = Array.from(files || []).filter((f) => /^image\//i.test(f.type || ''));
        if (!list.length) { UI.toast('请选择图片文件', 'error'); return; }
        drop.innerHTML = ICON.upload + '<b>上传中…</b><small>正在上传 ' + list.length + ' 张</small>';
        let ok = 0, fail = 0;
        for (const file of list) {
          try {
            const url = await Uploader.upload(file);
            const r = EmojiData.add(url, file.name.replace(/\.[^.]+$/, ''));
            if (r.ok) ok++;
            else fail++;
          } catch (e) {
            fail++;
          }
          drop.innerHTML = ICON.upload + '<b>上传中…</b><small>已完成 ' + (ok + fail) + '/' + list.length + '</small>';
        }
        drop.innerHTML = ICON.upload + '<b>点击选择图片</b>，或拖拽到此处<small>支持 PNG / GIF / JPG / WebP，单张不超过 20MB</small>';
        renderGrid();
        self.refreshPanel();
        if (ok) UI.toast('已添加 ' + ok + ' 个表情', 'ok');
        if (fail) UI.toast(fail + ' 个未能添加（重复或上传失败）', 'error');
      };
      fileInput.addEventListener('change', () => handleFiles(fileInput.files));
      ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => {
        e.preventDefault(); e.stopPropagation(); drop.classList.add('drag');
      }));
      ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => {
        e.preventDefault(); e.stopPropagation(); drop.classList.remove('drag');
      }));
      drop.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
      });
      const tabLink = h('button', { class: 'yhx-tab is-on', type: 'button', text: '图片链接' });
      const tabUp = h('button', { class: 'yhx-tab', type: 'button', text: '本地上传' });
      const paneLink = h('div', { class: 'yhx-pane' },
        linkInput, nameInput, preview, addBtn,
      );
      const paneUp = h('div', { class: 'yhx-pane', hidden: 'hidden' }, drop, fileInput);
      const switchTab = (which) => {
        const isLink = which === 'link';
        tabLink.classList.toggle('is-on', isLink);
        tabUp.classList.toggle('is-on', !isLink);
        paneLink.hidden = !isLink;
        paneUp.hidden = isLink;
      };
      tabLink.addEventListener('click', () => switchTab('link'));
      tabUp.addEventListener('click', () => switchTab('up'));
      function renderGrid() {
        grid.textContent = '';
        const items = EmojiData.all();
        countEl.textContent = String(items.length);
        if (!items.length) {
          grid.appendChild(h('div', {
            class: 'yhx-empty', style: { gridColumn: '1 / -1' },
            html: ICON.smile + '<div>还没有自定义表情<br>用「图片链接」或「本地上传」添加一个吧</div>',
          }));
          return;
        }
        items.forEach((it) => {
          const cell = h('div', { class: 'yhx-cell', title: it.name + '\n' + it.url },
            h('img', { src: it.url, alt: it.name, loading: 'lazy', referrerpolicy: 'no-referrer' }),
            h('span', { text: it.name }),
            h('button', {
              class: 'yhx-del', type: 'button', 'aria-label': '删除 ' + it.name, html: ICON.trash,
              onclick: (e) => {
                e.stopPropagation();
                EmojiData.remove(it.id);
                renderGrid();
                self.refreshPanel();
                UI.toast('已删除「' + it.name + '」');
              },
            }),
          );
          grid.appendChild(cell);
        });
      }
      const sheet = h('div', { class: 'yhx-sheet yhx-modal', role: 'dialog', 'aria-modal': 'true' },
        h('div', { class: 'yhx-hd' },
          h('div', { class: 'yhx-hd-title', html: ICON.smile + '<span>自定义表情</span>' }),
          h('div', { class: 'yhx-grow' }),
          h('button', { class: 'yhx-iconbtn', type: 'button', 'aria-label': '关闭', html: ICON.close, onclick: () => close() }),
        ),
        h('div', { class: 'yhx-tabs' }, tabLink, tabUp),
        paneLink,
        paneUp,
        h('div', { class: 'yhx-listhd' }, h('span', {}, '已添加 ', countEl, ' 个')),
        grid,
        h('div', { class: 'yhx-ft' },
          h('button', {
            class: 'yhx-btn', type: 'button', text: '导出表情', onclick: () => {
              const blob = new Blob([JSON.stringify({ kind: 'yhx-emoji', items: EmojiData.all() }, null, 2)], { type: 'application/json' });
              const a = h('a', { href: URL.createObjectURL(blob), download: 'yaohuo-emoji.json' });
              UI.root.appendChild(a);
              a.click();
              setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
              UI.toast('已导出', 'ok');
            },
          }),
          h('button', {
            class: 'yhx-btn', type: 'button', text: '导入表情', onclick: () => {
              const inp = h('input', { type: 'file', accept: 'application/json,.json' });
              inp.addEventListener('change', () => {
                const f = inp.files && inp.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const data = JSON.parse(String(reader.result || '{}'));
                    const arr = Array.isArray(data) ? data : (data.items || []);
                    let n = 0;
                    arr.forEach((it) => {
                      const url = self.extractUrl(it && it.url);
                      if (url && EmojiData.add(url, it.name).ok) n++;
                    });
                    renderGrid();
                    self.refreshPanel();
                    UI.toast('导入 ' + n + ' 个表情', n ? 'ok' : 'error');
                  } catch (e) { UI.toast('导入失败：' + e.message, 'error'); }
                };
                reader.readAsText(f);
              });
              inp.click();
            },
          }),
          h('button', {
            class: 'yhx-btn danger', type: 'button', text: '清空', onclick: () => {
              if (!EmojiData.all().length) return;
              if (!window.confirm('确定清空全部自定义表情？')) return;
              EmojiData.clear();
              renderGrid();
              self.refreshPanel();
              UI.toast('已清空');
            },
          }),
        ),
      );
      const mask = h('div', { class: 'yhx-mask', hidden: 'hidden' }, sheet);
      mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
      function close() {
        if (closed) return;
        closed = true;
        mask.classList.remove('is-open');
        setTimeout(() => mask.remove(), 280);
        if (UI.subPanel && UI.subPanel.close === close) UI.subPanel = null;
      }
      UI.root.appendChild(mask);
      renderGrid();
      mask.hidden = false;
      requestAnimationFrame(() => mask.classList.add('is-open'));
      setTimeout(() => linkInput.focus(), 320);
      return { close: close };
    },
    syncPane() {
      const pop = $('.ubb-pop.emoji');
      if (!pop) return;
      const tabs = $$('.ubb-emoji-tab', pop).filter((t) => !t.classList.contains('yhx-emoji-add'));
      const idx = tabs.findIndex((t) => t.textContent.trim() === this.CAT.name);
      if (idx < 0) return;
      const pane = $$('.ubb-emoji-pane', pop)[idx];
      if (!pane) return;
      pane.dataset.s = '';
      if (pane.hidden) return;
      const current = tabs[idx];
      const recentTab = tabs[0];
      if (recentTab && recentTab !== current) {
        recentTab.click();
        setTimeout(() => {
          current.click();
          setTimeout(() => { this.addDeleteBadges(); this.ensureEmptyHint(); }, 80);
        }, 30);
      } else {
        current.click();
        setTimeout(() => { this.addDeleteBadges(); this.ensureEmptyHint(); }, 80);
      }
    },
    refreshPanel() { this.syncPane(); },
    customPane() {
      const pop = $('.ubb-pop.emoji');
      if (!pop) return null;
      const tabs = $$('.ubb-emoji-tab', pop).filter((t) => !t.classList.contains('yhx-emoji-add'));
      const idx = tabs.findIndex((t) => t.textContent.trim() === this.CAT.name);
      if (idx < 0) return null;
      const pane = $$('.ubb-emoji-pane', pop)[idx];
      return pane ? { pop, tabs, idx, pane } : null;
    },
    addDeleteBadges() {
      const self = this;
      const c = this.customPane();
      if (!c || c.pane.hidden) return;
      if (!c.pop.classList.contains('show')) return;
      const grid = c.pane.querySelector('.ubb-emoji-grid');
      if (!grid) return;
      $$('.yhx-pdel', grid).forEach((b) => b.remove());
      const items = EmojiData.all();
      $$('img', grid).forEach((img) => {
        const url = img.dataset.u || img.getAttribute('src') || '';
        const item = items.find((it) => it.url === url);
        if (!item) return;
        const badge = h('button', {
          class: 'yhx-pdel', type: 'button',
          'aria-label': '删除 ' + item.name, title: '删除 ' + item.name,
          html: ICON.trash,
        });
        const place = () => {
          badge.style.left = (img.offsetLeft + img.offsetWidth - 20) + 'px';
          badge.style.top = (img.offsetTop + 2) + 'px';
        };
        place();
        img.addEventListener('load', place, { once: true });
        badge.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          self.confirmRemove(item);
        });
        grid.appendChild(badge);
      });
    },
    confirmRemove(item) {
      let closed = false;
      const mask = h('div', { class: 'yhx-mask', hidden: 'hidden' },
        h('div', { class: 'yhx-sheet yhx-modal', role: 'dialog', 'aria-modal': 'true' },
          h('div', { class: 'yhx-hd' },
            h('div', { class: 'yhx-hd-title', html: ICON.trash + '<span>删除表情</span>' }),
            h('div', { class: 'yhx-grow' }),
            h('button', { class: 'yhx-iconbtn', type: 'button', 'aria-label': '关闭', html: ICON.close, onclick: () => close() }),
          ),
          h('div', { class: 'yhx-body' },
            h('div', { class: 'yhx-confirm' },
              h('img', { src: item.url, alt: item.name, referrerpolicy: 'no-referrer' }),
              h('div', { class: 'yhx-confirm-name', text: item.name }),
              h('div', { class: 'yhx-confirm-tip', text: '删除后不可恢复，确定删除这个表情吗？' }),
            ),
          ),
          h('div', { class: 'yhx-ft' },
            h('button', { class: 'yhx-btn', type: 'button', text: '取消', onclick: () => close() }),
            h('button', {
              class: 'yhx-btn danger', type: 'button', text: '删除',
              onclick: () => {
                close();
                EmojiData.remove(item.id);
                UI.toast('已删除「' + item.name + '」');
              },
            }),
          ),
        ),
      );
      function close() {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey);
        mask.classList.remove('is-open');
        setTimeout(() => mask.remove(), 280);
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      document.addEventListener('keydown', onKey);
      mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
      UI.root.appendChild(mask);
      mask.hidden = false;
      requestAnimationFrame(() => mask.classList.add('is-open'));
    },
    extractUrl(input) {
      const v = String(input || '').trim();
      if (!v) return '';
      const m = v.match(/\[img\]([\s\S]*?)\[\/img\]/i);
      const raw = (m ? m[1] : v).trim();
      if (/^data:image\//i.test(raw)) return raw;
      if (/^https?:\/\/\S+$/i.test(raw)) return raw;
      return '';
    },
    refreshPanel() {
      const pop = $('.ubb-pop.emoji');
      if (!pop || !pop.classList.contains('show')) return;
      const tabs = $$('.ubb-emoji-tab', pop);
      const customTab = tabs.find((t) => t.textContent.trim() === this.CAT.name);
      if (!customTab) return;
      const panes = $$('.ubb-emoji-pane', pop);
      const idx = tabs.indexOf(customTab);
      const pane = panes[idx];
      if (pane) {
        pane.dataset.s = '';
        pane.textContent = '';
      }
      const recentTab = tabs[0];
      if (recentTab && recentTab !== customTab) {
        recentTab.click();
        setTimeout(() => customTab.click(), 30);
      } else {
        customTab.click();
      }
    },
  };
  const UBB_RE = /\[(img|url|movie)(?:=([^\]]*))?\]([\s\S]*?)\[\/\1\]/gi;
  const ubbPreview = {
    id: 'ubbPreview',
    name: 'UBB 实时渲染',
    group: '编辑器增强',
    order: 20,
    defaultEnabled: true,
    icon: ICON.eye,
    desc: '输入框里的图片、超链接 UBB 直接渲染成图片和链接，右下角图标可弹窗改源码。',
    options: [
      { key: 'image', name: '图片 UBB', hint: '[img]…[/img]', default: true },
      { key: 'link', name: '超链接 UBB', hint: '[url=地址]文字[/url]', default: true },
      { key: 'movie', name: '视频 UBB', hint: '[movie]地址|封面[/movie]', default: true },
    ],
    _inst: new Map(),
    _observer: null,
    _off: null,
    _editing: false,
    status() {
      const n = this._inst.size;
      return n ? '已在 ' + n + ' 个输入框生效' : '等待编辑器出现…';
    },
    init() {
      this.scan();
      this.watch();
      this._off = Bus.on('option:change', (e) => {
        if (e.id !== this.id) return;
        this._inst.forEach((s, ta) => this.render(ta, true));
      });
    },
    destroy() {
      this._inst.forEach((s, ta) => {
        try {
          s.rich.removeEventListener('input', s.onInput);
          s.rich.removeEventListener('keydown', s.onKeydown);
          s.rich.removeEventListener('paste', s.onPaste);
          s.rich.removeEventListener('keyup', s.onCaret);
          s.rich.removeEventListener('mouseup', s.onCaret);
        } catch (_) {}
        if (s.wrap.parentNode) s.wrap.parentNode.insertBefore(ta, s.wrap);
        s.wrap.remove();
        ta.classList.remove('yhx-shadow-ta');
        try { delete ta.value; } catch (_) {}
        if (s.oldStyle === null) ta.removeAttribute('style');
        else ta.setAttribute('style', s.oldStyle);
      });
      this._inst.clear();
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      if (this._off) { this._off(); this._off = null; }
    },
    scan() {
      this._inst.forEach((s, ta) => {
        if (!document.contains(ta)) {
          s.wrap.remove();
          this._inst.delete(ta);
        }
      });
      $$('textarea[data-ubb]').forEach((ta) => this.attach(ta));
    },
    watch() {
      if (this._observer) return;
      const self = this;
      this._observer = new MutationObserver(debounce(() => self.scan(), 250));
      this._observer.observe(document.body, { childList: true, subtree: true });
    },
    attach(ta) {
      if (!ta || this._inst.has(ta)) return;
      const box = ta.closest('.ubb-box');
      if (!box) return;
      const rich = h('div', {
        class: 'yhx-rich',
        contenteditable: 'true',
        spellcheck: 'false',
        role: 'textbox',
        'aria-multiline': 'true',
      });
      rich.dataset.placeholder = ta.getAttribute('placeholder') || '';
      const wrap = h('div', { class: 'yhx-rich-wrap' }, rich);
      const oldStyle = ta.getAttribute('style');
      ta.classList.add('yhx-shadow-ta');
      ta.parentNode.insertBefore(wrap, ta);
      wrap.appendChild(ta);
      const inst = { rich: rich, wrap: wrap, oldStyle: oldStyle, syncing: false };
      const self = this;
      inst.onInput = () => {
        if (inst.syncing) return;
        inst.syncing = true;
        try {
          ta.value = self.serialize(rich);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        } finally {
          inst.syncing = false;
        }
        rich.classList.toggle('is-empty', !ta.value);
        self.pushCaret(inst, ta);
      };
      inst.onCaret = () => self.pushCaret(inst, ta);
      inst.onKeydown = (e) => {
        if (e.isComposing) return;
        if (e.key === 'Backspace' || e.key === 'Delete') {
          if (self.deleteAtom(inst, e.key === 'Backspace')) e.preventDefault();
          return;
        }
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement('br');
        range.insertNode(br);
        const anchor = document.createTextNode('\u200b');
        br.parentNode.insertBefore(anchor, br.nextSibling);
        range.setStart(anchor, 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        inst.onInput();
      };
      inst.onPaste = (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        if (text) document.execCommand('insertText', false, text);
      };
      rich.addEventListener('input', inst.onInput);
      rich.addEventListener('keydown', inst.onKeydown);
      rich.addEventListener('keyup', inst.onCaret);
      rich.addEventListener('mouseup', inst.onCaret);
      rich.addEventListener('paste', inst.onPaste);
      const proto = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      Object.defineProperty(ta, 'value', {
        configurable: true,
        get() { return proto.get.call(this); },
        set(v) {
          proto.set.call(this, v);
          if (inst.syncing) return;
          setTimeout(() => self.render(ta, true), 0);
        },
      });
      this._inst.set(ta, inst);
      this.render(ta, false);
    },
    render(ta, keepCaret) {
      const inst = this._inst.get(ta);
      if (!inst || this._editing) return;
      const text = ta.value || '';
      const caret = keepCaret ? this.readCaret(inst) : null;
      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      UBB_RE.lastIndex = 0;
      while ((m = UBB_RE.exec(text))) {
        if (m.index > last) frag.appendChild(this.textToNodes(text.slice(last, m.index)));
        const kind = m[1].toLowerCase();
        const attr = (m[2] || '').trim();
        const inner = (m[3] || '').trim();
        const node = this.buildNode(kind, attr, inner, m[0]);
        frag.appendChild(node || this.textToNodes(m[0]));
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(this.textToNodes(text.slice(last)));
      inst.rich.textContent = '';
      inst.rich.appendChild(frag);
      inst.rich.classList.toggle('is-empty', !text);
      if (caret != null) this.setCaret(inst, caret);
    },
    textToNodes(str) {
      const frag = document.createDocumentFragment();
      String(str).split('\n').forEach((part, i) => {
        if (i > 0) frag.appendChild(document.createElement('br'));
        if (part) frag.appendChild(document.createTextNode(part));
      });
      return frag;
    },
    buildNode(kind, attr, inner, raw) {
      const wantImg = Config.opt(this.id, 'image', true);
      const wantLink = Config.opt(this.id, 'link', true);
      const wantMovie = Config.opt(this.id, 'movie', true);
      if (kind === 'movie') {
        if (!wantMovie) return null;
        const parts = inner.split('|');
        const src = this.safeUrl((parts[0] || '').trim());
        if (!src) return null;
        const poster = this.safeUrl((parts[1] || '').trim());
        const box = h('span', {
          class: 'yhx-rich-item yhx-rich-movie', 'data-type': 'movie', 'data-ubb': raw,
          'data-len': String(raw.length), contenteditable: 'false',
        });
        const video = h('video', Object.assign({
          src: src, controls: 'controls', preload: 'metadata',
          'data-ubb': raw,
        }, poster ? { poster: poster } : {}));
        box.appendChild(video);
        box.appendChild(this.editBtn({ raw: raw, type: 'movie', href: src, poster: poster }));
        return box;
      }
      if (kind === 'img') {
        if (!wantImg) return null;
        const src = this.safeUrl(inner);
        if (!src) return null;
        const box = h('span', {
          class: 'yhx-rich-item', 'data-type': 'img', 'data-ubb': raw,
          'data-len': String(raw.length), contenteditable: 'false',
        });
        const img = h('img', { src: src, alt: '图片', referrerpolicy: 'no-referrer', loading: 'lazy' });
        img.addEventListener('error', () => {
          img.replaceWith(h('span', { class: 'yhx-rich-broken', text: '图片加载失败' }));
        });
        box.appendChild(img);
        box.appendChild(this.editBtn({ raw: raw, type: 'img', href: src }));
        return box;
      }
      if (!wantLink) return null;
      const href = this.safeUrl(attr || inner);
      if (!href) return null;
      const box = h('span', {
        class: 'yhx-rich-item', 'data-type': 'link', 'data-ubb': raw,
        'data-len': String(raw.length), contenteditable: 'false',
      });
      const label = inner || href;
      const a = h('a', {
        class: 'yhx-rich-link', href: href, target: '_blank',
        rel: 'noopener noreferrer', title: href, contenteditable: 'false',
      });
      a.innerHTML = ICON.link;
      a.appendChild(h('span', { text: label }));
      box.appendChild(a);
      box.appendChild(this.editBtn({ raw: raw, type: 'link', href: href, label: label }));
      return box;
    },
    editBtn(data) {
      return h('button', {
        class: 'yhx-rich-edit', type: 'button', title: '编辑', 'aria-label': '编辑',
        html: ICON.pen, 'data-raw': data.raw, contenteditable: 'false',
        onmousedown: (e) => e.preventDefault(),
        onclick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.edit(data);
        },
      });
    },
    serialize(root) {
      let out = '';
      const walk = (node) => {
        node.childNodes.forEach((n) => {
          if (n.nodeType === 3) { out += n.nodeValue; return; }
          if (n.nodeType !== 1) return;
          const tag = n.tagName.toLowerCase();
          if (tag === 'br') { out += '\n'; return; }
          if (tag === 'div' || tag === 'p') {
            if (out && !out.endsWith('\n')) out += '\n';
            walk(n);
            return;
          }
          if (n.dataset && n.dataset.ubb) { out += n.dataset.ubb; return; }
          walk(n);
        });
      };
      walk(root);
      out = out.replace(/\u200b/g, '');
      return out.trim() === '' ? '' : out;
    },
    readCaret(inst) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return 0;
      const range = sel.getRangeAt(0);
      if (!inst.rich.contains(range.startContainer)) return 0;
      const pre = document.createRange();
      pre.selectNodeContents(inst.rich);
      pre.setEnd(range.startContainer, range.startOffset);
      const frag = pre.cloneContents();
      frag.querySelectorAll('[data-ubb]').forEach((el) => {
        el.replaceWith(document.createTextNode(el.getAttribute('data-ubb') || ''));
      });
      frag.querySelectorAll('br').forEach((el) => {
        el.replaceWith(document.createTextNode('\n'));
      });
      return frag.textContent.length;
    },
    setCaret(inst, offset) {
      let remain = offset;
      let found = null;
      const idxOf = (n) => Array.prototype.indexOf.call(n.parentNode.childNodes, n) + 1;
      const walk = (parent) => {
        for (const n of Array.from(parent.childNodes)) {
          if (n.nodeType === 3) {
            const len = n.nodeValue.length;
            if (remain <= len) { found = { node: n, offset: remain }; return true; }
            remain -= len;
          } else if (n.nodeType === 1) {
            const tag = n.tagName.toLowerCase();
            if (tag === 'br') {
              if (remain <= 1) { found = { node: parent, offset: idxOf(n) }; return true; }
              remain -= 1;
            } else if (n.dataset && n.dataset.ubb) {
              const len = Number(n.dataset.len) || (n.dataset.ubb || '').length;
              if (remain <= len) { found = { node: parent, offset: idxOf(n) }; return true; }
              remain -= len;
            } else if (walk(n)) {
              return true;
            }
          }
        }
        return false;
      };
      walk(inst.rich);
      if (!found) return;
      try {
        const range = document.createRange();
        range.setStart(found.node, found.offset);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}
    },
    readRange(inst) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      const range = sel.getRangeAt(0);
      if (!inst.rich.contains(range.startContainer) || !inst.rich.contains(range.endContainer)) return null;
      const offsetOf = (container, off) => {
        const pre = document.createRange();
        pre.selectNodeContents(inst.rich);
        pre.setEnd(container, off);
        const frag = pre.cloneContents();
        frag.querySelectorAll('[data-ubb]').forEach((el) => {
          el.replaceWith(document.createTextNode(el.getAttribute('data-ubb') || ''));
        });
        frag.querySelectorAll('br').forEach((el) => {
          el.replaceWith(document.createTextNode('\n'));
        });
        return frag.textContent.length;
      };
      return {
        start: offsetOf(range.startContainer, range.startOffset),
        end: offsetOf(range.endContainer, range.endOffset),
      };
    },
    deleteAtom(inst, backward) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return false;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) return false;
      const rich = inst.rich;
      if (!rich.contains(range.startContainer)) return false;
      const el = backward ? this.atomPrev(rich, range) : this.atomNext(rich, range);
      if (!el) return false;
      const parent = el.parentNode;
      const next = el.nextSibling;
      el.remove();
      const r = document.createRange();
      if (next && next.parentNode) r.setStart(next, 0);
      else if (parent) r.setStart(parent, parent.childNodes.length);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      if (inst.onInput) inst.onInput();
      return true;
    },
    atomPrev(rich, range) {
      const isAtom = (n) => !!(n && n.nodeType === 1 && n.classList && n.classList.contains('yhx-rich-item'));
      const blank = (n) => n.nodeType === 3 && !String(n.nodeValue || '').replace(/\u200b/g, '');
      const c = range.startContainer, o = range.startOffset;
      if (c.nodeType === 3 && o > 0) return null;
      if (c.nodeType === 1) {
        let i = o - 1;
        while (i >= 0) {
          const n = c.childNodes[i];
          if (blank(n)) { i--; continue; }
          return isAtom(n) ? n : null;
        }
      }
      let p = c;
      while (p && p !== rich) {
        let sib = p.previousSibling;
        while (sib && blank(sib)) sib = sib.previousSibling;
        if (sib) return isAtom(sib) ? sib : null;
        p = p.parentNode;
      }
      return null;
    },
    atomNext(rich, range) {
      const isAtom = (n) => !!(n && n.nodeType === 1 && n.classList && n.classList.contains('yhx-rich-item'));
      const blank = (n) => n.nodeType === 3 && !String(n.nodeValue || '').replace(/\u200b/g, '');
      const c = range.startContainer, o = range.startOffset;
      if (c.nodeType === 3 && o < c.nodeValue.length) return null;
      if (c.nodeType === 1) {
        let i = o;
        while (i < c.childNodes.length) {
          const n = c.childNodes[i];
          if (blank(n)) { i++; continue; }
          return isAtom(n) ? n : null;
        }
      }
      let p = c;
      while (p && p !== rich) {
        let sib = p.nextSibling;
        while (sib && blank(sib)) sib = sib.nextSibling;
        if (sib) return isAtom(sib) ? sib : null;
        p = p.parentNode;
      }
      return null;
    },
    pushSelection(inst, ta) {
      const r = this.readRange(inst);
      if (!r) { this.pushCaret(inst, ta); return; }
      try {
        ta.selectionStart = r.start;
        ta.selectionEnd = r.end;
      } catch (_) {}
    },
    pushCaret(inst, ta) {
      const offset = this.readCaret(inst);
      try {
        ta.selectionStart = offset;
        ta.selectionEnd = offset;
      } catch (_) {}
    },
    safeUrl(raw) {
      const s = String(raw || '').trim().replace(/^["']|["']$/g, '');
      if (/^https?:\/\//i.test(s)) return s;
      if (/^\/\//.test(s)) return 'https:' + s;
      if (/^\//.test(s)) return s;
      return '';
    },
    edit(data) {
      const self = this;
      this._editing = true;
      const isImg = data.type === 'img';
      const isMovie = data.type === 'movie';
      const raw = data.raw;
      const urlInput = h('input', {
        type: 'url', class: 'yhx-editinput', spellcheck: 'false', autocomplete: 'off',
        placeholder: isMovie ? 'https://… 视频地址' : (isImg ? 'https://… 图片地址' : 'https://… 链接地址'),
      });
      urlInput.value = data.href || '';
      const labelInput = h('input', {
        type: 'text', class: 'yhx-editinput', spellcheck: 'false',
        placeholder: '显示的文字，留空则直接显示地址', maxlength: '200',
      });
      if (!isImg && !isMovie) labelInput.value = (data.label && data.label !== data.href) ? data.label : '';
      const posterInput = h('input', {
        type: 'url', class: 'yhx-editinput', spellcheck: 'false', autocomplete: 'off',
        placeholder: 'https://… 封面图地址，可留空',
      });
      if (isMovie) posterInput.value = data.poster || '';
      const previewImg = h('img', { alt: '预览', referrerpolicy: 'no-referrer' });
      const preview = h('div', { class: 'yhx-editprev', hidden: 'hidden' }, previewImg);
      previewImg.addEventListener('error', () => { preview.hidden = true; });
      const previewOf = () => (isMovie ? (self.safeUrl(posterInput.value) || '') : (self.safeUrl(urlInput.value) || ''));
      const syncPreview = () => {
        const url = previewOf();
        if (!url) { preview.hidden = true; return; }
        previewImg.src = url;
        preview.hidden = false;
      };
      if (isImg || isMovie) {
        urlInput.addEventListener('input', debounce(syncPreview, 260));
        if (isMovie) posterInput.addEventListener('input', debounce(syncPreview, 260));
        syncPreview();
      }
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
      };
      const close = () => {
        document.removeEventListener('keydown', onKey);
        mask.classList.remove('is-open');
        setTimeout(() => mask.remove(), 260);
        self._editing = false;
        self._inst.forEach((s, ta) => self.render(ta, false));
      };
      const commit = () => {
        const url = self.safeUrl(urlInput.value);
        if (!url) {
          UI.toast('请填写 http(s) 或 / 开头的地址', 'error');
          urlInput.focus();
          return;
        }
        const poster = isMovie ? (self.safeUrl(posterInput.value) || '') : '';
        let next;
        if (isImg) {
          next = '[img]' + url + '[/img]';
        } else if (isMovie) {
          next = '[movie]' + url + (poster ? '|' + poster : '') + '[/movie]';
        } else {
          const label = labelInput.value.trim();
          next = label ? ('[url=' + url + ']' + label + '[/url]') : ('[url]' + url + '[/url]');
        }
        if (next === raw) { close(); return; }
        let hit = false;
        self._inst.forEach((inst, ta) => {
          if (hit) return;
          const idx = ta.value.indexOf(raw);
          if (idx < 0) return;
          hit = true;
          inst.syncing = true;
          ta.value = ta.value.slice(0, idx) + next + ta.value.slice(idx + raw.length);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          inst.syncing = false;
        });
        if (!hit) UI.toast('内容已变化，请重新点编辑', 'error');
        else UI.toast('已更新', 'ok');
        close();
      };
      const field = (text, input) => h('label', { class: 'yhx-field-row' },
        h('span', { class: 'yhx-field-label', text: text }),
        input,
      );
      const sheet = h('div', { class: 'yhx-sheet yhx-editdlg', role: 'dialog', 'aria-modal': 'true' },
        h('div', { class: 'yhx-hd' },
          h('div', {
            class: 'yhx-hd-title',
            html: (isImg ? ICON.smile : (isMovie ? ICON.play : ICON.link)) + '<span>' + (isImg ? '编辑图片' : (isMovie ? '编辑视频' : '编辑超链接')) + '</span>',
          }),
          h('div', { class: 'yhx-grow' }),
          h('button', { class: 'yhx-iconbtn', type: 'button', 'aria-label': '关闭', html: ICON.close, onclick: () => close() }),
        ),
        h('div', { class: 'yhx-editbody' },
          field(isMovie ? '视频地址' : (isImg ? '图片地址' : '链接地址'), urlInput),
          isMovie ? field('封面图（可留空）', posterInput) : (isImg ? preview : field('显示文字', labelInput)),
          isMovie ? preview : null,
        ),
        h('div', { class: 'yhx-editft' },
          h('button', { class: 'yhx-btn', type: 'button', text: '取消', onclick: () => close() }),
          h('button', { class: 'yhx-btn primary', type: 'button', text: '保存', onclick: () => commit() }),
        ),
      );
      const mask = h('div', { class: 'yhx-mask', hidden: 'hidden' }, sheet);
      mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
      [urlInput, labelInput, posterInput].forEach((inp) => {
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
        });
      });
      document.addEventListener('keydown', onKey);
      UI.root.appendChild(mask);
      mask.hidden = false;
      requestAnimationFrame(() => mask.classList.add('is-open'));
      setTimeout(() => {
        urlInput.focus();
        urlInput.select();
      }, 260);
    },
  };
  const topicPreview = {
    id: 'topicPreview',
    name: '帖子悬浮预览',
    group: '浏览增强',
    order: 10,
    defaultEnabled: true,
    icon: ICON.read,
    desc: '鼠标停在帖子标题上，浮层里直接看正文和图片，不用点进去。',
    options: [
      { key: 'below', name: '默认显示在标题下方', hint: '关闭则默认在上方', default: true },
      { key: 'autoFlip', name: '空间不足时自动翻转', hint: '上方/下方放不下就翻到对面', default: true },
      { key: 'cacheMax', name: '缓存数量', hint: '默认 10 个', type: 'number', unit: '个', min: 1, max: 200, default: 10 },
      { key: 'cacheTTL', name: '缓存时长', hint: '默认 3 分钟', type: 'number', unit: '分钟', min: 1, max: 1440, default: 3 },
    ],
    _cache: new Map(),
    _inflight: new Map(),
    _panel: null,
    _link: null,
    _url: '',
    _showTimer: 0,
    _hideTimer: 0,
    _off: null,
    _ro: null,
    cacheMaxN() {
      return Config.num(this.id, 'cacheMax', 10, 1, 200);
    },
    cacheTtlMs() {
      return Config.num(this.id, 'cacheTTL', 3, 1, 1440) * 60 * 1000;
    },
    cacheTtlMin() {
      return Config.num(this.id, 'cacheTTL', 3, 1, 1440);
    },
    HIDE_DELAY: 340,
    SHOW_DELAY: 200,
    GAP: 8,
    status() {
      const n = this._cache.size;
      if (!n) return '就绪';
      return '已缓存 ' + n + '/' + this.cacheMaxN() + ' 个，' + this.cacheTtlMin() + ' 分钟内有效';
    },
    init() {
      if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) {
        return;
      }
      const self = this;
      this._onOver = (e) => self.handleOver(e);
      this._onOut = (e) => self.handleOut(e);
      this._onScroll = (e) => self.handleScroll(e);
      document.addEventListener('mouseover', this._onOver, true);
      document.addEventListener('mouseout', this._onOut, true);
      window.addEventListener('scroll', this._onScroll, true);
      this._off = Bus.on('option:change', (e) => {
        if (e.id !== this.id) return;
        this.trimCache();
        this.reposition();
      });
    },
    destroy() {
      document.removeEventListener('mouseover', this._onOver, true);
      document.removeEventListener('mouseout', this._onOut, true);
      window.removeEventListener('scroll', this._onScroll, true);
      if (this._off) this._off();
      this._off = null;
      clearTimeout(this._showTimer);
      clearTimeout(this._hideTimer);
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      if (this._panel) { this._panel.remove(); this._panel = null; }
      this._cache.clear();
      this._inflight.clear();
      this._link = null;
    },
    topicUrl(href) {
      if (!href) return '';
      try {
        const u = new URL(href, location.href);
        if (!/(^|\.)yaohuo\.me$/i.test(u.hostname)) return '';
        if (!/\/bbs-\d+\.html$/i.test(u.pathname)) return '';
        return u.href;
      } catch (_) { return ''; }
    },
    inPanel(node) {
      return !!(this._panel && node && this._panel.contains(node));
    },
    handleOver(e) {
      if (this.inPanel(e.target)) { clearTimeout(this._hideTimer); return; }
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      const url = a ? this.topicUrl(a.getAttribute('href')) : '';
      if (!url) { this.hide(); return; }
      if (this._link === a && this._panel && this._panel.classList.contains('show')) return;
      this._link = a;
      this._url = url;
      clearTimeout(this._hideTimer);
      clearTimeout(this._showTimer);
      this._showTimer = setTimeout(() => this.show(a, url), this.SHOW_DELAY);
    },
    handleOut(e) {
      if (e.relatedTarget && this.inPanel(e.relatedTarget)) { clearTimeout(this._hideTimer); return; }
      this.hide();
    },
    handleScroll(e) {
      if (this.inPanel(e.target)) return;
      this.hide(true);
    },
    readCache(url) {
      const hit = this._cache.get(url);
      if (!hit) return null;
      if (Date.now() - hit.ts > this.cacheTtlMs()) {
        this._cache.delete(url);
        return null;
      }
      this._cache.delete(url);
      this._cache.set(url, hit);
      return hit.data;
    },
    remember(url, data) {
      if (!data || data.error) return;
      const now = Date.now();
      const ttl = this.cacheTtlMs();
      this._cache.forEach((v, k) => {
        if (now - v.ts > ttl) this._cache.delete(k);
      });
      this._cache.delete(url);
      this._cache.set(url, { data: data, ts: now });
      this.trimCache();
    },
    trimCache() {
      const max = this.cacheMaxN();
      while (this._cache.size > max) {
        this._cache.delete(this._cache.keys().next().value);
      }
    },
    clearCache() {
      const n = this._cache.size;
      this._cache.clear();
      this._inflight.clear();
      return n;
    },
    async show(link, url) {
      this.render(link, url);
      const cached = this.readCache(url);
      if (cached) { this.fill(cached); return; }
      this.fillLoading();
      try {
        const data = await this.fetchTopic(url);
        if (this._url !== url) return;
        this.fill(data);
      } catch (err) {
        if (this._url !== url) return;
        const msg = /HTTP 404/.test(String(err && err.message))
          ? '帖子不存在或已被删除'
          : '请求失败，请检查登录状态';
        this.fill({ error: msg });
      }
    },
    fetchTopic(url) {
      if (this._inflight.has(url)) return this._inflight.get(url);
      const self = this;
      const task = (async () => {
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        const data = self.parse(html, url);
        self.remember(url, data);
        return data;
      })();
      this._inflight.set(url, task);
      return task.then(
        (v) => { self._inflight.delete(url); return v; },
        (e) => { self._inflight.delete(url); throw e; },
      );
    },
    BODY_SELS: [
      '.bbscontent', '.content1',
      '.postmessage', '.post-message', '.pcontent', '.t_f',
      '.bbs-content', '.topic-content', '.article-content', '.thread-content',
      '.detail-content', '.post-body', '.main-content',
      '.post-content', '.message',
      '.content', '#content',
    ],
    PRECISE_SELS: ['.bbscontent', '.post-content', '.content1'],
    pickBody(doc) {
      for (const sel of this.BODY_SELS) {
        let list = [];
        try { list = Array.from(doc.querySelectorAll(sel)); } catch (_) { continue; }
        list = list.filter((el) => !el.querySelector('.forum-post')
          && (this.textLen(el) >= 4 || el.querySelector('img, video, audio, iframe')));
        if (!list.length) continue;
        list.sort((a, b) => this.textLen(b) - this.textLen(a));
        if (this.PRECISE_SELS.indexOf(sel) > -1) return { el: list[0], trusted: true };
        return { el: this.shrinkToMain(list[0]), trusted: false };
      }
      const el = this.heuristicBody(doc);
      return el ? { el: el, trusted: false } : null;
    },
    shrinkToMain(el) {
      let cur = el;
      for (let i = 0; i < 6; i++) {
        const total = this.textLen(cur);
        if (!total) break;
        const kids = Array.from(cur.children);
        if (kids.length < 2) break;
        let best = null;
        let bestLen = -1;
        kids.forEach((k) => {
          const l = this.textLen(k);
          if (l > bestLen) { bestLen = l; best = k; }
        });
        if (!best || total - bestLen > 160) break;
        if (bestLen < total * 0.75) break;
        cur = best;
      }
      return cur;
    },
    stripShell(root) {
      const SHELL = /(^|[\s_-])(title|subject|subtitle|author|username|nick|time|date|meta|info|crumb|breadcrumb|location|path|nav|navi|menu|header|head|footer|pager|pagination|pages|toolbar|action|actions|operate|signature|avatar|floor|reward|share|tag|badge|level|uid|stat|stats|view|click)([\s_-]|$)/i;
      const base = this.textLen(root);
      const victims = [];
      Array.from(root.querySelectorAll('[class], h1, h2, h3, h4, h5, h6')).forEach((el) => {
        const cls = String((el.getAttribute && el.getAttribute('class')) || '');
        const isHeading = /^h[1-6]$/i.test(el.tagName);
        if (!isHeading && !SHELL.test(cls)) return;
        if (el.querySelector('img, video, audio, iframe, table')) return;
        if (this.textLen(el) > 120) return;
        victims.push(el);
      });
      victims.forEach((el) => {
        if (!root.contains(el)) return;
        if (this.textLen(root) - this.textLen(el) < base * 0.5) return;
        const info = { by: 'class', tag: el.tagName.toLowerCase(), cls: String(el.getAttribute('class') || ''), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
        el.remove();
      });
    },
    stripMetaLines(root) {
      const META = /作者|楼主|发表|发布|时间|浏览|查看|阅读|字数|积分|等级|注册|来自|最后编辑/g;
      const DATE = /\d{4}\s*[-/年.]\s*\d{1,2}\s*[-/月.]\s*\d{1,2}/;
      const base = this.textLen(root);
      let removed = 0;
      for (const el of Array.from(root.querySelectorAll('div, p, span, em, td'))) {
        if (removed >= 4) break;
        if (!root.contains(el)) continue;
        if (el.querySelector('img, video, audio, iframe, a, br, table')) continue;
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length > 80) continue;
        const hits = (t.match(META) || []).length;
        if (!(DATE.test(t) || hits >= 2)) continue;
        if (this.textLen(root) - this.textLen(el) < base * 0.5) continue;
        const info = { by: 'text', tag: el.tagName.toLowerCase(), cls: String(el.getAttribute('class') || ''), text: t.slice(0, 40) };
        el.remove();
        removed++;
      }
    },
    textLen(el) {
      return ((el && el.textContent) || '').replace(/\s+/g, '').length;
    },
    heuristicBody(doc) {
      const nodes = doc.body ? Array.from(doc.body.querySelectorAll('div, article, section, td')) : [];
      const scored = [];
      nodes.forEach((el) => {
        const len = this.textLen(el);
        if (len < 30) return;
        const media = el.querySelectorAll('img, video, audio, iframe').length;
        const links = el.querySelectorAll('a').length;
        const inputs = el.querySelectorAll('input, textarea, select').length;
        const score = len + media * 300 - links * 14 - inputs * 260;
        if (score > 0) scored.push({ el, score });
      });
      if (!scored.length) return null;
      scored.forEach((item) => {
        item.nested = scored.some(
          (o) => o !== item && item.el.contains(o.el) && o.score >= item.score * 0.6,
        );
      });
      const inner = scored.filter((i) => !i.nested).sort((a, b) => b.score - a.score);
      if (inner.length) return inner[0].el;
      return scored.sort((a, b) => b.score - a.score)[0].el;
    },
    parse(html, baseUrl) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      Array.from(doc.querySelectorAll('script, style, link, meta, noscript')).forEach((n) => n.remove());
      const protectSel = this.PRECISE_SELS.join(',');
      Array.from(doc.querySelectorAll([
        '.title', '.subtitle', '.subtitle2',
        '.retime', '.redate', '.rq-thread-meta', '.rq-thread-time', '.reply-post-publish-time',
        'h1', 'h2', 'h3',
      ].join(','))).forEach((n) => {
        if (n.closest(protectSel)) return;
        n.remove();
      });
      const picked = this.pickBody(doc);
      if (!picked) {
        const head = doc.body ? doc.body.textContent.slice(0, 800) : '';
        const needLogin = /请先登录|需要登录|立即登录|login/i.test(head);
        return { error: needLogin ? '需要登录后才能查看这个帖子' : '没能解析出正文' };
      }
      const clone = picked.el.cloneNode(true);
      clone.querySelectorAll([
        'script', 'style', 'link', 'meta',
        '.signature', '.post-signature', '.user-signature', '.qianming',
        '.title', '.subtitle', '.subtitle2',
        '.retime', '.redate', '.rq-thread-meta', '.rq-thread-time', '.reply-post-publish-time',
        '.post-badge', '.post-badge-light',
        '.post-header', '.post-date', '.post-meta', '.topic-meta', '.floor-info',
        '.user-name', '.user-id', '.user-nick', '.the_user', '.post-author',
        '.breadcrumb', '.breadcrumbs', '.crumbs', '.location', '.path',
        '.reward-section', '.pagination', '.pager', '.page-nav', '.nav', '.menu', '.header', '.footer',
      ].join(',')).forEach((n) => n.remove());
      if (!picked.trusted) {
        this.stripShell(clone);
        this.stripMetaLines(clone);
      }
      clone.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
        });
      });
      clone.querySelectorAll('[src], [href], [poster]').forEach((el) => {
        ['src', 'href', 'poster'].forEach((attr) => {
          const v = el.getAttribute(attr);
          if (!v) return;
          if (/^javascript:/i.test(v)) { el.removeAttribute(attr); return; }
          if (/^(https?:|data:|blob:|#|\/\/)/i.test(v)) return;
          try { el.setAttribute(attr, new URL(v, baseUrl).href); } catch (_) {}
        });
      });
      clone.querySelectorAll('a[href]').forEach((a) => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });
      clone.querySelectorAll('img').forEach((img) => {
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.setAttribute('loading', 'lazy');
        img.setAttribute('referrerpolicy', 'no-referrer');
      });
      clone.querySelectorAll('iframe').forEach((f) => {
        if (!f.getAttribute('height')) f.setAttribute('height', '200');
        f.setAttribute('width', '100%');
        f.setAttribute('allowfullscreen', 'true');
        f.setAttribute('loading', 'lazy');
      });
      return { html: clone.innerHTML };
    },
    render(link, url) {
      if (!this._panel) {
        const self = this;
        const body = h('div', { class: 'yhx-tp-body' });
        const panel = h('div', { class: 'yhx-tp' }, body);
        panel._body = body;
        panel.addEventListener('mouseenter', () => clearTimeout(self._hideTimer));
        panel.addEventListener('mouseover', () => clearTimeout(self._hideTimer));
        panel.addEventListener('mousemove', () => clearTimeout(self._hideTimer));
        panel.addEventListener('mouseleave', () => self.hide());
        panel.addEventListener('load', () => {
          if (panel.classList.contains('show')) self.reposition();
        }, true);
        const grow = () => {
          if (panel.classList.contains('show')) self.reposition();
        };
        panel.addEventListener('loadedmetadata', grow, true);
        panel.addEventListener('canplay', grow, true);
        if (self._ro) self._ro.disconnect();
        self._ro = new ResizeObserver(grow);
        self._ro.observe(body);
        document.body.appendChild(panel);
        this._panel = panel;
      }
      if (url && this._panel.dataset.url !== url) {
        this._panel._body.textContent = '';
        this._panel.dataset.url = url;
      }
      this._panel.classList.add('show');
      this.position(link);
    },
    fillLoading() {
      const p = this._panel;
      if (!p) return;
      p._body.textContent = '';
      p._body.appendChild(h('div', { class: 'yhx-tp-loading', text: '正在读取帖子内容' }));
      this.reposition();
    },
    fill(data) {
      const p = this._panel;
      if (!p) return;
      p._body.textContent = '';
      if (data.error) {
        p._body.appendChild(h('div', { class: 'yhx-tp-loading', text: data.error }));
      } else {
        p._body.innerHTML = '<div class="yhx-tp-content">' + (data.html || '') + '</div>';
        const content = p._body.querySelector('.yhx-tp-content');
        if (content && this._ro) this._ro.observe(content);
      }
      this.reposition();
    },
    position(link) {
      const p = this._panel;
      if (!p || !link || !document.contains(link)) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = this.GAP;
      const edge = 8;
      const width = Math.min(520, vw - edge * 2);
      p.style.visibility = 'hidden';
      p.style.width = Math.max(200, width) + 'px';
      p.style.maxHeight = 'none';
      p.style.left = edge + 'px';
      p.style.top = edge + 'px';
      const contentH = p.offsetHeight;
      const rect = link.getBoundingClientRect();
      const preferBelow = Config.opt(this.id, 'below', true);
      const autoFlip = Config.opt(this.id, 'autoFlip', true);
      const spaceBelow = vh - rect.bottom - gap - edge;
      const spaceAbove = rect.top - gap - edge;
      const MAX_RATIO = 0.72;
      const idealH = Math.min(contentH, Math.round(vh * MAX_RATIO));
      const MIN_USABLE = 90;
      let down = preferBelow;
      let flipped = '0';
      const space = down ? spaceBelow : spaceAbove;
      const other = down ? spaceAbove : spaceBelow;
      if (space < idealH) {
        if (autoFlip && other > space + 60) {
          down = !down; flipped = 'auto';
        } else if (space < MIN_USABLE && other >= MIN_USABLE) {
          down = !down; flipped = 'forced';
        }
      }
      const avail = Math.max(120, down ? spaceBelow : spaceAbove);
      const finalH = Math.min(idealH, avail);
      p.style.maxHeight = Math.round(finalH) + 'px';
      let top = down ? rect.bottom + gap : rect.top - gap - finalH;
      top = Math.max(edge, Math.min(top, vh - edge - finalH));
      if (down) top = Math.max(top, rect.bottom + gap);
      else top = Math.min(top, rect.top - gap - finalH);
      const left = Math.max(edge, Math.min(rect.left, vw - edge - width));
      p.style.left = Math.round(left) + 'px';
      p.style.top = Math.round(top) + 'px';
      p.dataset.side = down ? 'below' : 'above';
      p.dataset.flipped = flipped;
      p.style.visibility = '';
    },
    reposition() {
      requestAnimationFrame(() => this.position(this._link));
    },
    hide(immediate) {
      clearTimeout(this._showTimer);
      clearTimeout(this._hideTimer);
      const p = this._panel;
      if (!p) return;
      if (immediate) {
        p.classList.remove('show');
        this._link = null;
        return;
      }
      this._hideTimer = setTimeout(() => {
        p.classList.remove('show');
        this._link = null;
      }, this.HIDE_DELAY);
    },
  };
  const userCard = {
    id: 'userCard',
    name: '用户名片',
    group: '浏览增强',
    order: 12,
    defaultEnabled: true,
    icon: ICON.user,
    desc: '点击别人的用户名，链接旁弹出资料卡（头像、等级积分、签名等），不用跳页；底部可直接私信或进主页。',
    options: [
      { key: 'glass', name: '毛玻璃背景', hint: '卡片背景半透明加模糊，透出底下内容', default: true },
    ],
    _panel: null,
    _link: null,
    _url: '',
    _req: 0,
    _off: null,
    GAP: 8,
    EDGE: 8,
    init() {
      const self = this;
      this._onClick = (e) => {
        if (self.inPanel(e.target)) return;
        const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        const url = a ? self.userUrl(a.getAttribute('href')) : '';
        if (!url) { self.close(); return; }
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) { self.close(); return; }
        e.preventDefault();
        e.stopPropagation();
        if (self._panel && self._panel.classList.contains('show') && self._link === a) {
          self.close();
          return;
        }
        self.show(a, url);
      };
      this._onKey = (e) => { if (e.key === 'Escape') self.close(); };
      this._onScroll = (e) => {
        if (self.inPanel(e.target)) return;
        self.close();
      };
      this._onResize = () => self.close();
      document.addEventListener('click', this._onClick, true);
      document.addEventListener('keydown', this._onKey);
      window.addEventListener('scroll', this._onScroll, true);
      window.addEventListener('resize', this._onResize);
      this._off = Bus.on('option:change', (e) => {
        if (e.id !== this.id) return;
        if (e.key === 'glass' && this._panel) {
          this._panel.classList.toggle('is-glass', Config.opt(this.id, 'glass', true));
        }
      });
    },
    destroy() {
      document.removeEventListener('click', this._onClick, true);
      document.removeEventListener('keydown', this._onKey);
      window.removeEventListener('scroll', this._onScroll, true);
      window.removeEventListener('resize', this._onResize);
      if (this._off) this._off();
      this._off = null;
      this._req++;
      if (this._panel) { this._panel.remove(); this._panel = null; }
      this._link = null;
      this._url = '';
    },
    userUrl(href) {
      if (!href) return '';
      try {
        const u = new URL(href, location.href);
        if (!/(^|\.)yaohuo\.me$/i.test(u.hostname)) return '';
        if (!/\/userinfo\.aspx$/i.test(u.pathname)) return '';
        if (!u.searchParams.get('touserid')) return '';
        return u.href;
      } catch (_) { return ''; }
    },
    inPanel(node) {
      return !!(this._panel && node && this._panel.contains(node));
    },
    async show(link, url) {
      this._url = url;
      this._link = link;
      this.render(link);
      this.fillLoading();
      const req = ++this._req;
      try {
        const data = await this.fetchUser(url);
        if (req !== this._req) return;
        this.fill(data);
      } catch (err) {
        if (req !== this._req) return;
        const msg = /HTTP 404/.test(String(err && err.message))
          ? '用户不存在或资料页已被删除'
          : '请求失败，请检查登录状态';
        this.fill({ error: msg, pageUrl: url });
      }
      this.reposition();
    },
    async fetchUser(url) {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      return this.parse(html, url);
    },
    parse(html, url) {
      const doc = new DOMParser().parseFromString(
        String(html).replace(/<br\s*\/?>/gi, '\n'),
        'text/html',
      );
      doc.querySelectorAll('script, style, link, meta, noscript').forEach((n) => n.remove());
      const bodyText = doc.body ? (doc.body.textContent || '') : '';
      if (/请先登录|需要登录|立即登录/i.test(bodyText.slice(0, 600))) {
        return { error: '需要登录后才能查看用户资料', pageUrl: url };
      }
      const abs = (u) => {
        if (!u || /^(https?:|data:|\/\/)/i.test(u)) return u || '';
        try { return new URL(u, url).href; } catch (_) { return ''; }
      };
      const out = {
        name: '', idline: '', avatar: '', online: null,
        stats: [], rows: [], sign: '', gender: '', pmUrl: '', pageUrl: url,
      };
      const pmA = doc.querySelector('.uinfo-pm-link[href], a[href*="friend.aspx"]');
      if (pmA) out.pmUrl = abs(pmA.getAttribute('href'));
      const card = doc.querySelector('.uinfo-profile-card') || doc.querySelector('.uinfo-page');
      const nick = doc.querySelector('.uinfo-nickname');
      if (nick && card) {
        out.name = (nick.textContent || '').replace(/\s+/g, ' ').trim();
        const av = card.querySelector('.uinfo-avatar-img, .uinfo-avatar img');
        out.avatar = abs(av ? (av.getAttribute('src') || av.getAttribute('data-src')) : '');
        out.online = card.querySelector('.uinfo-online-dot')
          ? !card.querySelector('.uinfo-online-dot--offline')
          : null;
        const idEl = card.querySelector('.uinfo-idline');
        if (idEl) out.idline = (idEl.textContent || '').replace(/\s+/g, ' ').trim();
        card.querySelectorAll('.uinfo-stat').forEach((st) => {
          const vEl = st.querySelector('.value');
          const lEl = st.querySelector('.label');
          const href = st.tagName === 'A' ? abs(st.getAttribute('href')) : '';
          if (vEl) {
            const v = (vEl.textContent || '').replace(/\s+/g, ' ').trim();
            const l = (lEl ? (lEl.textContent || '') : '').replace(/\s+/g, ' ').trim();
            if (v && v.length <= 20) out.stats.push({ v: v, l: l.slice(0, 10), href: href });
          } else {
            const t = (st.textContent || '').replace(/\s+/g, ' ').trim();
            if (t && t.length <= 24) out.stats.push({ v: t, l: '', href: href });
          }
        });
        const metaEl = card.querySelector('.uinfo-meta');
        if (metaEl) {
          const mt = (metaEl.textContent || '')
            .replace(/(在线|离线|当前)/g, ' ')
            .replace(/\s+/g, '')
            .trim();
          if (mt && mt.length <= 6) out.gender = mt;
        }
        const qm = doc.querySelector('.qianming');
        if (qm) out.sign = (qm.textContent || '').replace(/\s+/g, ' ').trim();
      } else {
        out.rows = this.collectPairs(doc.body);
        const namePair = out.rows.find((p) => /^(昵称|用户名|会员名|名字)$/.test(p.label));
        if (namePair) out.name = namePair.value;
        const signPair = out.rows.find((p) => /^(签名|签名档)$/.test(p.label));
        if (signPair) {
          out.sign = signPair.value;
          out.rows = out.rows.filter((p) => p !== signPair);
        }
      }
      if (out.rows.length > 8) out.rows = out.rows.slice(0, 8);
      if (out.stats.length > 8) out.stats = out.stats.slice(0, 8);
      if (!out.name && !out.rows.length && !out.stats.length) {
        const needLogin = /请先登录|需要登录|立即登录|login/i.test(bodyText.slice(0, 1200));
        return { error: needLogin ? '需要登录后才能查看用户资料' : '没能解析出用户资料', pageUrl: url };
      }
      return out;
    },
    collectPairs(root) {
      if (!root) return [];
      const lines = (root.textContent || '').split(/\n+/)
        .map((s) => s.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const pairs = [];
      const seen = new Set();
      for (const line of lines) {
        const m = line.match(/^([^：:]{1,12})[：:]\s*(.{1,60})$/);
        if (!m) continue;
        const label = m[1].trim();
        const value = m[2].trim();
        if (!label || !value) continue;
        if (/^(https?|www\.|\/)/i.test(value)) continue;
        if (seen.has(label)) continue;
        seen.add(label);
        pairs.push({ label: label, value: value });
        if (pairs.length >= 8) break;
      }
      return pairs;
    },
    render(link) {
      if (!this._panel) {
        const self = this;
        const head = h('div', { class: 'yhx-uc-head' });
        const mid = h('div', { class: 'yhx-uc-mid' });
        const foot = h('div', { class: 'yhx-uc-foot' });
        const panel = h('div', { class: 'yhx-uc' }, head, mid, foot);
        panel._head = head;
        panel._mid = mid;
        panel._foot = foot;
        panel.addEventListener('load', () => {
          if (panel.classList.contains('show')) self.reposition();
        }, true);
        document.body.appendChild(panel);
        this._panel = panel;
      }
      const p = this._panel;
      if (this._url && p.dataset.url !== this._url) {
        p._head.textContent = '';
        p._mid.textContent = '';
        p._foot.textContent = '';
        p.dataset.url = this._url;
      }
      p.classList.add('show');
      p.classList.toggle('is-glass', Config.opt(this.id, 'glass', true));
      this.position(link);
    },
    fillHead(data) {
      const head = this._panel._head;
      head.textContent = '';
      const ava = h('div', { class: 'yhx-uc-ava' });
      if (data.avatar) {
        const img = h('img', { src: data.avatar, alt: '', referrerpolicy: 'no-referrer', loading: 'lazy' });
        img.addEventListener('error', () => {
          img.remove();
          ava.textContent = (data.name || '?').slice(0, 1).toUpperCase();
        });
        ava.appendChild(img);
      } else {
        ava.textContent = (data.name || '?').slice(0, 1).toUpperCase();
      }
      if (data.online !== null && data.online !== undefined) {
        ava.appendChild(h('i', { class: 'yhx-uc-dot' + (data.online ? '' : ' is-off') }));
      }
      const right = h('div', { style: { minWidth: '0', flex: '1 1 auto' } });
      right.appendChild(h('div', { class: 'yhx-uc-nm', text: data.name || '未知用户' }));
      const idBits = [];
      if (data.online === true) idBits.push('在线');
      else if (data.online === false) idBits.push('离线');
      if (data.gender) idBits.push(data.gender);
      if (data.idline) idBits.push(data.idline);
      if (idBits.length) right.appendChild(h('div', { class: 'yhx-uc-id', text: idBits.join(' · ') }));
      head.appendChild(ava);
      head.appendChild(right);
    },
    fillLoading() {
      const p = this._panel;
      if (!p) return;
      p._head.textContent = '';
      p._mid.textContent = '';
      p._mid.appendChild(h('div', { class: 'yhx-uc-loading', text: '正在读取用户资料' }));
      this.fillFoot({ pageUrl: this._url });
      this.reposition();
    },
    fillFoot(data) {
      const foot = this._panel._foot;
      foot.textContent = '';
      let pmHref = data.pmUrl || '';
      if (!pmHref && data.name) {
        try {
          pmHref = new URL('/bbs/friend.aspx?todouser=' + encodeURIComponent(data.name), location.origin).href;
        } catch (_) { pmHref = ''; }
      }
      const pm = h('a', {
        class: 'yhx-uc-btn yhx-uc-btn--pm' + (pmHref ? '' : ' is-off'),
        href: pmHref || 'javascript:;',
        target: pmHref ? '_blank' : '_self',
        rel: 'noopener noreferrer',
        html: ICON.send + '<span>私信</span>',
      });
      const home = h('a', {
        class: 'yhx-uc-btn yhx-uc-btn--home',
        href: data.pageUrl || 'javascript:;',
        target: '_blank',
        rel: 'noopener noreferrer',
        html: ICON.home + '<span>进入主页</span>',
      });
      foot.appendChild(pm);
      foot.appendChild(home);
    },
    fill(data) {
      const p = this._panel;
      if (!p) return;
      if (data.error) {
        p._head.textContent = '';
        p._mid.textContent = '';
        p._mid.appendChild(h('div', { class: 'yhx-uc-loading', text: data.error }));
        this.fillFoot({ pageUrl: data.pageUrl });
        this.reposition();
        return;
      }
      this.fillHead(data);
      const mid = p._mid;
      mid.textContent = '';
      if (data.stats.length) {
        const grid = h('div', { class: 'yhx-uc-stats' });
        data.stats.forEach((s) => {
          const chip = h(s.href ? 'a' : 'div', Object.assign(
            { class: 'yhx-uc-stat' + (s.href ? ' is-link' : '') },
            s.href ? { href: s.href, target: '_blank', rel: 'noopener noreferrer', title: '查看' + (s.l || '') } : {},
          ));
          chip.appendChild(h('span', { class: 'v', text: s.v }));
          if (s.l) chip.appendChild(h('i', { class: 'l', text: s.l }));
          grid.appendChild(chip);
        });
        mid.appendChild(grid);
      }
      if (data.rows.length) {
        const rows = h('div', { class: 'yhx-uc-rows' });
        data.rows.forEach((pair) => {
          rows.appendChild(h('div', { class: 'yhx-uc-row' },
            h('b', { text: pair.label }),
            h('span', { text: pair.value })));
        });
        mid.appendChild(rows);
      }
      if (data.sign) {
        mid.appendChild(h('div', { class: 'yhx-uc-sign', text: data.sign }));
      }
      if (!data.stats.length && !data.rows.length && !data.sign) {
        mid.appendChild(h('div', { class: 'yhx-uc-loading', text: '对方没有公开更多资料' }));
      }
      this.fillFoot(data);
      this.reposition();
    },
    position(link) {
      const p = this._panel;
      if (!p || !link || !document.contains(link)) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = this.GAP;
      const edge = this.EDGE;
      const width = Math.min(320, vw - edge * 2);
      p.style.visibility = 'hidden';
      p.style.width = Math.max(220, width) + 'px';
      p.style.maxHeight = 'none';
      p.style.left = edge + 'px';
      p.style.top = edge + 'px';
      const contentH = p.offsetHeight;
      const rect = link.getBoundingClientRect();
      const MAX_RATIO = 0.66;
      const idealH = Math.min(contentH, Math.round(vh * MAX_RATIO));
      const spaceBelow = vh - rect.bottom - gap - edge;
      const spaceAbove = rect.top - gap - edge;
      let down = spaceBelow >= spaceAbove;
      const avail = Math.max(120, down ? spaceBelow : spaceAbove);
      const finalH = Math.min(idealH, avail);
      let top = down ? rect.bottom + gap : rect.top - gap - finalH;
      top = Math.max(edge, Math.min(top, vh - edge - finalH));
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(edge, Math.min(left, vw - edge - width));
      p.style.maxHeight = Math.round(finalH) + 'px';
      p.style.left = Math.round(left) + 'px';
      p.style.top = Math.round(top) + 'px';
      p.dataset.side = down ? 'below' : 'above';
      p.style.visibility = '';
    },
    reposition() {
      requestAnimationFrame(() => this.position(this._link));
    },
    close() {
      this._req++;
      const p = this._panel;
      if (p && p.classList.contains('show')) p.classList.remove('show');
      this._link = null;
    },
  };
  const emojiGrab = {
    id: 'emojiGrab',
    name: '一键收藏表情',
    group: '编辑器增强',
    order: 11,
    defaultEnabled: true,
    icon: ICON.plus,
    desc: '帖子里的内容图片右下角常驻「+」按钮（移动端也能用），点一下就收进自定义表情；表情框图片和头像不触发。',
    options: [
      { key: 'minSize', name: '最小触发尺寸', hint: '显示尺寸小于该值的图片不触发（挡图标、头像）', type: 'number', unit: 'px', min: 40, max: 400, default: 80 },
    ],
    _observer: null,
    _onResize: null,
    init() {
      const self = this;
      this.scan();
      this._observer = new MutationObserver(debounce(() => self.scan(), 200));
      this._observer.observe(document.body, { childList: true, subtree: true });
      this._onResize = debounce(() => self.repositionAll(), 150);
      window.addEventListener('resize', this._onResize);
      this._reTimer = setInterval(() => self.repositionAll(), 3000);
      this._scrollRAF = 0;
      this._onScrollLoop = () => {
        if (self._scrollRAF) return;
        const loop = () => {
          self.repositionAll();
          self._scrollRAF = requestAnimationFrame(loop);
        };
        self._scrollRAF = requestAnimationFrame(loop);
      };
      this._onScrollStop = debounce(() => {
        if (self._scrollRAF) { cancelAnimationFrame(self._scrollRAF); self._scrollRAF = 0; }
        self.repositionAll();
      }, 160);
      window.addEventListener('scroll', this._onScrollLoop, { passive: true, capture: true });
      window.addEventListener('scroll', this._onScrollStop, { passive: true, capture: true });
    },
    destroy() {
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      if (this._onResize) { window.removeEventListener('resize', this._onResize); this._onResize = null; }
      if (this._reTimer) { clearInterval(this._reTimer); this._reTimer = 0; }
      if (this._onScrollLoop) { window.removeEventListener('scroll', this._onScrollLoop, true); this._onScrollLoop = null; }
      if (this._onScrollStop) { window.removeEventListener('scroll', this._onScrollStop, true); this._onScrollStop = null; }
      if (this._scrollRAF) { cancelAnimationFrame(this._scrollRAF); this._scrollRAF = 0; }
      $$('.yhx-eg-btn').forEach((b) => {
        if (b.__yhxRO) { b.__yhxRO.disconnect(); delete b.__yhxRO; }
        if (b.__yhxMO) { b.__yhxMO.disconnect(); delete b.__yhxMO; }
        b.remove();
      });
    },
    scan() {
      const self = this;
      $$('img').forEach((img) => {
        if (img.__yhxGrab) return;
        if (!img.complete || !img.naturalWidth) {
          img.__yhxGrab = 'wait';
          img.addEventListener('load', () => { img.__yhxGrab = ''; self.scan(); }, { once: true });
          return;
        }
        if (!this.valid(img)) { img.__yhxGrab = 'no'; return; }
        img.__yhxGrab = '1';
        const btn = h('button', {
          class: 'yhx-eg-btn', type: 'button', title: '加入自定义表情', html: ICON.plus,
        });
        btn.__yhxImg = img;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          self.grab(img, btn);
        });
        const parent = this.ensureContainer(img);
        if (!parent) { img.__yhxGrab = ''; return; }
        parent.appendChild(btn);
        this.place(btn, img);
        img.addEventListener('load', () => this.place(btn, img), { once: true });
        if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => this.place(btn, img));
          ro.observe(img);
          ro.observe(parent);
          btn.__yhxRO = ro;
        }
        const mo = new MutationObserver(() => this.place(btn, img));
        mo.observe(img, { attributes: true, attributeFilter: ['style', 'class', 'width', 'height', 'src'] });
        btn.__yhxMO = mo;
        let settleN = 0;
        const settle = () => {
          this.place(btn, img);
          if (++settleN < 6) requestAnimationFrame(settle);
        };
        requestAnimationFrame(settle);
      });
    },
    ensureContainer(img) {
      return img.parentElement || null;
    },
    place(btn, img) {
      if (!img.isConnected) return;
      const ir = img.getBoundingClientRect();
      if (!ir.width && !ir.height) return;
      btn.style.position = 'fixed';
      btn.style.left = Math.round(ir.right - 34) + 'px';
      btn.style.top = Math.round(ir.bottom - 34) + 'px';
    },
    repositionAll() {
      $$('.yhx-eg-btn').forEach((btn) => {
        if (btn.__yhxImg) this.place(btn, btn.__yhxImg);
      });
    },
    valid(img) {
      if (!img.complete || !img.naturalWidth) return false;
      const src = img.currentSrc || img.src || '';
      if (!/^https?:/i.test(src) && !/^\/\//.test(src)) return false;
      if (img.closest('#yhx-root, .yhx-uc, .yhx-tp, .yhx-rich-wrap, .ubb-pop, [class*="emoji-panel"], .uinfo-avatar, .uinfo-avatar-container')) return false;
      if (/avatar/i.test(String(img.getAttribute('class') || ''))) return false;
      const imgPath = (() => {
        try { return new URL(img.currentSrc || img.src, location.href).pathname; } catch (_) { return ''; }
      })();
      if (/\/NetCSS\/IMG\/TuPian\/2xLOGO\.png$/i.test(imgPath)) return false;
      if (/^\/bbs|^\/XinZhang/i.test(imgPath)) return false;
      const r = img.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const min = Config.num(this.id, 'minSize', 80, 40, 400);
      return Math.min(r.width, r.height) >= min;
    },
    grab(img, btn) {
      if (!img || !img.isConnected) return;
      let src = '';
      try { src = new URL(img.currentSrc || img.src, location.href).href; } catch (_) { return; }
      const r = EmojiData.add(src);
      if (r.ok) {
        UI.toast('已加入自定义表情：' + (r.item.name || ''), 'ok');
        btn.innerHTML = ICON.check;
        btn.classList.add('is-done');
        setTimeout(() => {
          btn.innerHTML = ICON.plus;
          btn.classList.remove('is-done');
        }, 900);
      } else if (r.reason === 'duplicate') {
        UI.toast('这张图已经在自定义表情里了');
      } else if (r.reason === 'limit') {
        UI.toast('自定义表情已满（上限 300 个），先去管理面板清理吧', 'error');
      }
    },
  };
  const homeSearch = {
    id: 'homeSearch',
    name: '首页搜索类型',
    group: '浏览增强',
    order: 14,
    defaultEnabled: true,
    icon: ICON.search,
    desc: '首页搜索框加上和 /bbs/ 一样的类型选择：标题 / 内容 / 昵称 / ID号，选择自动记住。',
    _form: null,
    _onSubmit: null,
    TYPES: [
      { label: '标题', v: 'title' },
      { label: '内容', v: 'content' },
      { label: '昵称', v: 'user' },
      { label: 'ID号', v: 'uid' },
    ],
    isHome() {
      return /^\/(index\.aspx|default\.aspx)?$/i.test(location.pathname);
    },
    init() {
      if (!this.isHome()) return;
      const form = document.querySelector('form[name=sch][action*="book_list_search"]');
      if (!form || form.dataset.yhxTypes) return;
      const key = form.querySelector('input[name=key]');
      if (!key) return;
      form.dataset.yhxTypes = '1';
      this._form = form;
      const saved = Store.get('homeSearchType', 'title');
      let cur = this.TYPES.find((t) => t.v === saved) || this.TYPES[0];
      const label = h('span', { class: 'yhx-hs-label', text: cur.label });
      const menu = h('div', { class: 'yhx-hs-menu' });
      this.TYPES.forEach((t) => {
        menu.appendChild(h('div', {
          class: 'yhx-hs-opt' + (t.v === cur.v ? ' is-on' : ''),
          text: t.label,
          onclick: (e) => {
            e.stopPropagation();
            cur = t;
            Store.set('homeSearchType', t.v);
            this.syncHidden(t.v);
            label.textContent = t.label;
            $$('.yhx-hs-opt', menu).forEach((o) => o.classList.toggle('is-on', o === e.currentTarget));
            dd.classList.remove('is-open');
          },
        }));
      });
      const trigger = h('button', {
        type: 'button', class: 'yhx-hs-trigger', title: '搜索类型',
        onclick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = trigger.getBoundingClientRect();
          dd.classList.toggle('is-up', r.bottom + 150 > window.innerHeight);
          dd.classList.toggle('is-open');
        },
      }, label, h('i', { class: 'yhx-hs-arrow', html: ICON.chevron }));
      const dd = h('span', { class: 'yhx-hs-dd' }, trigger, menu);
      key.parentElement.insertBefore(dd, key);
      this.syncHidden(cur.v);
      this._onDocClick = (e) => { if (!dd.contains(e.target)) dd.classList.remove('is-open'); };
      document.addEventListener('click', this._onDocClick, true);
      this._onKey = (e) => { if (e.key === 'Escape') dd.classList.remove('is-open'); };
      document.addEventListener('keydown', this._onKey);
      this._onSubmit = (e) => {
        Store.set('homeSearchType', cur.v);
        if (cur.v === 'title' || cur.v === 'content') {
          this.syncHidden(cur.v);
          return;
        }
        e.preventDefault();
        const k = key.value.trim();
        if (!k) { key.focus(); return; }
        location.href = cur.v === 'user'
          ? '/bbs/usersearch.aspx?key=' + encodeURIComponent(k)
          : '/bbs/usersearch.aspx?touserid=' + encodeURIComponent(k);
      };
      form.addEventListener('submit', this._onSubmit);
    },
    syncHidden(v) {
      const hidden = this._form && this._form.querySelector('input[name=type]');
      if (hidden) hidden.value = (v === 'content' || v === 'title') ? v : 'title';
    },
    destroy() {
      if (this._form && this._onSubmit) this._form.removeEventListener('submit', this._onSubmit);
      if (this._onDocClick) document.removeEventListener('click', this._onDocClick, true);
      if (this._onKey) document.removeEventListener('keydown', this._onKey);
      $$('.yhx-hs-dd').forEach((n) => n.remove());
      this._form = null;
      this._onSubmit = null;
      this._onDocClick = null;
      this._onKey = null;
    },
  };
  const skipLink = {
    id: 'skipLink',
    name: '跳过外站跳转提示',
    group: '浏览增强',
    order: 15,
    defaultEnabled: false,
    icon: ICON.link,
    desc: '点击外站链接时不再经过「跳转安全提示」中转页，直接跳到目标网址。默认关闭。',
    _onClick: null,
    targetOf(href) {
      if (!href) return '';
      try {
        const u = new URL(href, location.href);
        if (!/(^|\.)yaohuo\.me$/i.test(u.hostname)) return '';
        if (!/\/bbs\/link\.html$/i.test(u.pathname)) return '';
        const t = (u.searchParams.get('target') || '').trim();
        if (!/^https?:\/\//i.test(t)) return '';
        return t;
      } catch (_) { return ''; }
    },
    init() {
      const self = this;
      this._onClick = (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        const target = self.targetOf(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        if (a.target === '_blank') window.open(target, '_blank', 'noopener');
        else location.href = target;
      };
      document.addEventListener('click', this._onClick, true);
      const direct = self.targetOf(location.href);
      if (direct && /\/bbs\/link\.html$/i.test(location.pathname)) {
        location.replace(direct);
        return;
      }
    },
    destroy() {
      if (this._onClick) document.removeEventListener('click', this._onClick, true);
      this._onClick = null;
    },
  };
  const keywordBlock = {
    id: 'keywordBlock',
    name: '关键词屏蔽',
    group: '浏览增强',
    order: 16,
    defaultEnabled: false,
    icon: ICON.shield,
    desc: '列表页按关键词过滤帖子：命中后直接隐藏或模糊遮挡。点击帖子标题旁的盾牌按钮或这里的「管理」添加关键词。',
    options: [],
    _sessionSkip: null,
    _liveContainers: null,
    _offChange: null,
    _offToggle: null,
    _lastSummary: '',
    list() {
      const v = Store.get('kwblockList', null);
      return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : [];
    },
    saveList(list) {
      Store.set('kwblockList', list);
      Bus.emit('kwblock:change');
    },
    mode() {
      return Store.get('kwblockMode', 'blur') === 'hide' ? 'hide' : 'blur';
    },
    setMode(m) {
      Store.set('kwblockMode', m === 'hide' ? 'hide' : 'blur');
      Bus.emit('kwblock:change');
    },
    addKeyword(kw) {
      const k = String(kw || '').trim();
      if (!k) return { ok: false, reason: 'empty' };
      const list = this.list();
      if (list.some((x) => x.toLowerCase() === k.toLowerCase())) return { ok: false, reason: 'dup' };
      list.push(k);
      this.saveList(list);
      return { ok: true };
    },
    removeKeyword(kw) {
      this.saveList(this.list().filter((x) => x !== kw));
    },
    init() {
      this._sessionSkip = new Set();
      this._liveContainers = new Set();
      const self = this;
      this._offChange = Bus.on('kwblock:change', () => {
        self.scan();
        self.refreshManagers();
      });
      this._offToggle = Bus.on('feature:toggle', (e) => {
        if (e.id !== self.id) return;
        if (e.on) self.scan();
        else self.cleanupAll();
      });
      this.scan();
    },
    destroy() {
      if (this._offChange) this._offChange();
      if (this._offToggle) this._offToggle();
      this._offChange = null;
      this._offToggle = null;
      if (this._liveContainers) this._liveContainers.clear();
      this._sessionSkip = null;
      this.cleanupAll();
    },
    scan() {
      const items = $$('.listdata');
      if (!items.length) return;
      if (!this._sessionSkip) this._sessionSkip = new Set();
      const list = this.list();
      const mode = this.mode();
      const counts = {};
      let hiddenTotal = 0;
      items.forEach((item) => {
        const titleA = item.querySelector('a[href*="/bbs-"]');
        if (titleA && !item.querySelector('.yhx-kw-add')) {
          const btn = h('button', {
            class: 'yhx-kw-add', type: 'button', title: '关键词屏蔽', html: ICON.shield,
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              UI.openSubPanel('keywordBlock', { prefill: (titleA.textContent || '').trim() });
            },
          });
          titleA.after(btn);
        }
        const old = item.querySelector('.yhx-kw-cover');
        if (old) old.remove();
        item.classList.remove('yhx-kw-blurred');
        if (item.dataset.yhxKwHidden) {
          delete item.dataset.yhxKwHidden;
          item.style.display = '';
        }
        const tid = titleA ? ((titleA.getAttribute('href').match(/bbs-(\d+)/) || [])[1] || '') : '';
        if (this._sessionSkip.has(tid)) return;
        const title = titleA ? (titleA.textContent || '') : (item.textContent || '');
        const low = title.toLowerCase();
        const hits = list.filter((k) => low.indexOf(k.toLowerCase()) > -1);
        if (!hits.length) return;
        if (mode === 'hide') {
          item.dataset.yhxKwHidden = '1';
          item.style.display = 'none';
          hiddenTotal++;
          hits.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
        } else {
          if (!item.querySelector('.yhx-kw-inner')) {
            const inner = h('div', { class: 'yhx-kw-inner' });
            while (item.firstChild) inner.appendChild(item.firstChild);
            item.appendChild(inner);
          }
          item.classList.add('yhx-kw-blurred');
          item.appendChild(h('div', { class: 'yhx-kw-cover' },
            h('div', { class: 'yhx-kw-cover-hint', text: '根据关键词' + hits.map((k) => '「' + k + '」').join('') + '屏蔽' }),
            h('div', { class: 'yhx-kw-cover-btns' },
              h('button', {
                class: 'yhx-kw-btn', type: 'button', text: '临时解除',
                onclick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this._sessionSkip.add(tid);
                  this.scan();
                },
              }),
            ),
          ));
        }
      });
      if (mode === 'hide' && hiddenTotal) {
        const summary = Object.keys(counts).map((k) => '「' + k + '」×' + counts[k]).join('、');
        const msg = '已按关键词过滤 ' + hiddenTotal + ' 个帖子：' + summary;
        if (msg !== this._lastSummary) {
          this._lastSummary = msg;
          UI.toast(msg);
        }
      } else {
        this._lastSummary = '';
      }
    },
    cleanupAll() {
      $$('.yhx-kw-cover').forEach((c) => c.remove());
      $$('.yhx-kw-blurred').forEach((el) => el.classList.remove('yhx-kw-blurred'));
      $$('.yhx-kw-inner').forEach((w) => {
        const parent = w.parentNode;
        if (!parent) return;
        while (w.firstChild) parent.insertBefore(w.firstChild, w);
        w.remove();
      });
      $$('.listdata[data-yhx-kw-hidden]').forEach((el) => {
        delete el.dataset.yhxKwHidden;
        el.style.display = '';
      });
      $$('.yhx-kw-add').forEach((b) => b.remove());
      this._lastSummary = '';
    },
    renderManager(container, opts) {
      const self = this;
      opts = opts || {};
      if (!this._liveContainers) this._liveContainers = new Set();
      this._liveContainers.add(container);
      const prevInput = container.querySelector('.yhx-kw-input');
      const prevVal = prevInput ? prevInput.value : '';
      const hadFocus = !!(prevInput && document.activeElement === prevInput);
      const clearOnBuild = prevInput && prevInput.dataset.yhxClear === '1';
      if (prevInput && prevInput.dataset.yhxClear) delete prevInput.dataset.yhxClear;
      container.textContent = '';
      const mode = this.mode();
      container.appendChild(h('div', { class: 'yhx-kw-mode' },
        h('span', { class: 'yhx-kw-mode-label', text: '命中处理' }),
        h('div', { class: 'yhx-kw-mode-btns' },
          h('button', {
            class: 'yhx-kw-mode-btn' + (mode === 'hide' ? ' is-on' : ''), type: 'button', text: '直接隐藏',
            onclick: (e) => { e.stopPropagation(); self.setMode('hide'); },
          }),
          h('button', {
            class: 'yhx-kw-mode-btn' + (mode === 'blur' ? ' is-on' : ''), type: 'button', text: '模糊遮挡',
            onclick: (e) => { e.stopPropagation(); self.setMode('blur'); },
          }),
        ),
      ));
      const input = h('input', {
        class: 'yhx-kw-input', type: 'text', maxlength: '30',
        placeholder: '输入关键词，回车或点添加',
        onclick: (e) => e.stopPropagation(),
      });
      const addBtn = h('button', {
        class: 'yhx-kw-addbtn', type: 'button', text: '添加',
        onclick: (e) => {
          e.stopPropagation();
          const r = self.addKeyword(input.value);
          if (!r.ok) { UI.toast(r.reason === 'dup' ? '关键词已存在' : '请输入关键词', 'error'); return; }
          input.dataset.yhxClear = '1';
        },
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addBtn.click(); }
        if (e.key === 'Escape') { e.stopPropagation(); ddClose(); }
      });
      container.appendChild(h('div', { class: 'yhx-kw-inputrow' }, input, addBtn));
      const list = this.list();
      if (!list.length) {
        container.appendChild(h('div', { class: 'yhx-kw-empty', text: '还没有关键词，添加后列表页将自动过滤' }));
      } else {
        const tags = h('div', { class: 'yhx-kw-tags' });
        list.forEach((kw) => {
          tags.appendChild(h('span', { class: 'yhx-kw-tag' },
            h('span', { text: kw }),
            h('button', {
              class: 'yhx-kw-tag-x', type: 'button', 'aria-label': '删除 ' + kw, title: '删除',
              html: ICON.close,
              onclick: (e) => { e.stopPropagation(); self.removeKeyword(kw); },
            }),
          ));
        });
        container.appendChild(tags);
      }
      input.value = clearOnBuild ? '' : (opts.prefill != null ? String(opts.prefill) : prevVal);
      if (hadFocus) input.focus();
      return input;
    },
    refreshManagers() {
      if (!this._liveContainers) return;
      this._liveContainers.forEach((c) => {
        if (c.isConnected) this.renderManager(c);
        else this._liveContainers.delete(c);
      });
    },
    renderSettings(container) {
      this.renderManager(container);
    },
    openPanel(ctx, opts) {
      let closed = false;
      const body = h('div', { class: 'yhx-body' });
      const sheet = h('div', { class: 'yhx-sheet yhx-modal', role: 'dialog', 'aria-modal': 'true' },
        h('div', { class: 'yhx-hd' },
          h('div', { class: 'yhx-hd-title', html: ICON.shield + '<span>关键词屏蔽</span>' }),
          h('div', { class: 'yhx-grow' }),
          h('button', { class: 'yhx-iconbtn', type: 'button', 'aria-label': '关闭', html: ICON.close, onclick: () => close() }),
        ),
        body,
        h('div', { class: 'yhx-ft' },
          h('button', { class: 'yhx-btn', type: 'button', text: '关闭', onclick: () => close() }),
        ),
      );
      const mask = h('div', { class: 'yhx-mask', hidden: 'hidden' }, sheet);
      function close() {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey);
        mask.classList.remove('is-open');
        setTimeout(() => mask.remove(), 280);
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      document.addEventListener('keydown', onKey);
      mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
      UI.root.appendChild(mask);
      const modalInput = this.renderManager(body, opts);
      mask.hidden = false;
      requestAnimationFrame(() => {
        mask.classList.add('is-open');
        if (modalInput && opts && opts.prefill != null) modalInput.focus();
      });
      return { close: close };
    },
  };
  const UBB_BLOCK = /^(p|div|section|article|li|tr|h[1-6]|pre|table|ul|ol)$/;
  function toAbsUrl(u) {
    if (/^\//.test(u) && !/^\/\//.test(u)) return u;
    try { return new URL(u, location.href).href; } catch (_) { return u; }
  }
  function domToUbb(root) {
    let out = '';
    const isInlineNode = (x) => !!x
      && (x.nodeType === 3 || (x.nodeType === 1 && !UBB_BLOCK.test(x.tagName.toLowerCase()) && x.tagName.toLowerCase() !== 'br'));
    Array.from(root.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const txt = String(n.nodeValue || '').replace(/[\r\n\t]+/g, ' ').replace(/\u200b/g, '');
        if (!txt.trim()) {
          if (isInlineNode(n.previousSibling) && isInlineNode(n.nextSibling)) out += ' ';
          return;
        }
        out += txt;
        return;
      }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      if (/^(script|style|noscript|template)$/.test(tag)) return;
      if (n.hasAttribute && n.hasAttribute('data-yhx-plus')) return;
      if (n.classList && (n.classList.contains('yhx-plus') || n.classList.contains('yhx-tp'))) return;
      if (tag === 'br') { out += '\n'; return; }
      if (tag === 'img') {
        const src = n.getAttribute('src') || n.getAttribute('data-src') || n.getAttribute('data-original');
        if (src && !/^data:/i.test(src)) out += '[img]' + toAbsUrl(src) + '[/img]';
        return;
      }
      if (tag === 'a') {
        const href = n.getAttribute('href') || '';
        const txt = (n.textContent || '').replace(/\s+/g, ' ').trim();
        if (!href || /^(javascript:|#)/i.test(href)) { out += txt; return; }
        let url = toAbsUrl(href);
        try {
          const u = new URL(url, location.href);
          if (u.origin === location.origin) url = u.pathname + u.search + u.hash;
        } catch (_) {}
        if (!txt || txt === href || txt === url || txt === toAbsUrl(href)) out += '[url]' + url + '[/url]';
        else out += '[url=' + url + ']' + txt + '[/url]';
        return;
      }
      if (tag === 'b' || tag === 'strong') {
        const inner = domToUbb(n).trim();
        if (inner) out += '[b]' + inner + '[/b]';
        return;
      }
      if (tag === 'i' || tag === 'em') {
        const inner = domToUbb(n).trim();
        if (inner) out += '[i]' + inner + '[/i]';
        return;
      }
      if (tag === 'u') {
        const inner = domToUbb(n).trim();
        if (inner) out += '[u]' + inner + '[/u]';
        return;
      }
      if (tag === 'blockquote') {
        const inner = domToUbb(n).trim();
        if (inner) out += '[quote]' + inner + '[/quote]\n';
        return;
      }
      if (tag === 'video' || tag === 'audio' || tag === 'iframe') {
        const src = n.getAttribute('src')
          || (n.querySelector('source') && n.querySelector('source').getAttribute('src'));
        if (src) out += '[url]' + toAbsUrl(src) + '[/url]\n';
        return;
      }
      if (UBB_BLOCK.test(tag)) {
        const inner = domToUbb(n).trim();
        if (inner) out += inner + '\n';
        return;
      }
      out += domToUbb(n);
    });
    return out;
  }
  function tidyUbb(s) {
    return String(s || '')
      .replace(/\u200b/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
  }
  const repeater = {
    id: 'repeater',
    name: '回复复读机',
    group: '浏览增强',
    order: 20,
    defaultEnabled: true,
    icon: ICON.copy,
    desc: '每条回复右侧加一个「+1」，一键把对方的内容（文字、图片、链接）转成 UBB 填进回复框。',
    options: [
      { key: 'autoSend', name: '复制后自动发送', hint: '关闭则只填进回复框', default: true },
    ],
    _observer: null,
    _myName: null,
    status() {
      const n = $$('[data-yhx-plus]').length;
      return n ? '已在 ' + n + ' 条回复上挂好按钮' : '等待楼层出现…';
    },
    init() {
      this.scan();
      this.watch();
    },
    destroy() {
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      $$('[data-yhx-plus]').forEach((b) => b.remove());
      this._myName = null;
    },
    floors() {
      const list = $$('.forum-post');
      if (list.length) return list;
      const legacy = $$('.list-reply');
      if (legacy.length) return legacy;
      return $$('.subtitle2, .subtitle').map((el) => el.parentElement).filter(Boolean);
    },
    isMainPost(post) {
      if (post.classList.contains('forum-post') || post.classList.contains('list-reply')) return false;
      return !!post.querySelector('.bbscontent, .title, .admin-actions.has-reward');
    },
    authorOf(post) {
      const el = post.querySelector('.user-name a, .user-name, .user-nick, .floor-name, .renick a, .renickid');
      return el ? (el.textContent || '').replace(/\s+/g, '').slice(0, 40) : '';
    },
    myName() {
      if (this._myName !== null) return this._myName;
      const own = this.floors().find((p) => p.querySelector('.delete-myfloor'));
      this._myName = own ? this.authorOf(own) : '';
      return this._myName;
    },
    isOwnFloor(post, mine) {
      if (post.querySelector('.delete-myfloor')) return true;
      return !!mine && !!this.authorOf(post) && this.authorOf(post) === mine;
    },
    actionHost(post) {
      return post.querySelector('.operate')
        || post.querySelector('.subtitle2 .admin-actions')
        || post.querySelector('.subtitle2')
        || post.querySelector('.subtitle')
        || post.querySelector('.post-header')
        || (post.classList.contains('list-reply') ? post : null)
        || null;
    },
    scan() {
      const posts = this.floors();
      if (!posts.length) return;
      this._myName = null;
      const mine = this.myName();
      posts.forEach((post) => {
        if (post.querySelector('[data-yhx-plus]')) return;
        if (this.isMainPost(post)) return;
        if (this.isOwnFloor(post, mine)) return;
        const host = this.actionHost(post);
        if (!host) return;
        const btn = h('a', {
          class: 'yhx-plus', href: 'javascript:;',
          'data-yhx-plus': '1', role: 'button', tabindex: '0',
          text: '+1', title: '复读这条回复（把内容复制到回复框）',
          onclick: (e) => { e.preventDefault(); e.stopPropagation(); this.repeat(post); },
          onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.repeat(post); } },
        });
        host.appendChild(btn);
        host.classList.add('yhx-plus-host');
      });
    },
    watch() {
      if (this._observer) return;
      this._observer = new MutationObserver(debounce(() => this.scan(), 200));
      this._observer.observe(document.body, { childList: true, subtree: true });
    },
    repeat(post) {
      const src = post.querySelector('.post-content, .bbscontent, .retext, .recontent');
      const ubb = tidyUbb(src ? domToUbb(src) : '');
      if (!ubb) { UI.toast('这条回复没有可复制的内容', 'error'); return; }
      const ta = this.findTextarea();
      if (!ta) { UI.toast('没找到回复框，先点一下「回复」展开', 'error'); return; }
      ta.value = ubb;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      ta.focus();
      try { ta.setSelectionRange(ubb.length, ubb.length); } catch (_) {}
      try { ta.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
      if (!Config.opt(this.id, 'autoSend', true)) {
        UI.toast('已复制到回复框（' + ubb.length + ' 字）', 'ok');
        return;
      }
      setTimeout(() => {
        if (this.send(ta)) UI.toast('已复读并发送', 'ok');
        else UI.toast('已填入，但没找到发送按钮，请手动提交', 'error');
      }, 150);
    },
    findTextarea() {
      const sels = [
        'textarea.retextarea',
        'textarea.reply-textarea',
        'textarea[data-ubb="reply"]',
        '#replyActions textarea',
        'textarea[name="content"]',
      ];
      for (const sel of sels) {
        const el = $(sel);
        if (el && el.offsetParent !== null) return el;
      }
      for (const sel of sels) {
        const el = $(sel);
        if (el) return el;
      }
      return null;
    },
    send(ta) {
      const scope = $('#replyActions') || ta.closest('form') || document;
      const btn = scope.querySelector('.reply-submit-btn')
        || scope.querySelector('button[type="submit"]')
        || scope.querySelector('input[type="submit"]')
        || scope.querySelector('.reply-sendmsg2');
      if (btn && !btn.disabled) { btn.click(); return true; }
      const form = ta.closest('form');
      if (form) { form.submit(); return true; }
      return false;
    },
  };
  const scrollNav = {
    id: 'scrollNav',
    name: '一键到顶 / 到底',
    group: '浏览增强',
    order: 30,
    defaultEnabled: false,
    icon: ICON.scrollUpDown,
    desc: '悬浮按钮组里的两个小圆钮，一键回到顶部或跳到底部，滚到位后自动隐去。',
    _top: null,
    _bottom: null,
    _onScroll: null,
    _raf: 0,
    status() {
      return this._top ? '' : '未挂载';
    },
    init() {
      const self = this;
      if (window.self !== window.top) return;
      if (this._top) this.destroy();
      const dock = $('.yhx-dock') || $('#yhx-root') || document.body;
      this._top = this.button('回到顶部', ICON.arrowUp, () => self.jump('top'));
      this._bottom = this.button('跳到底部', ICON.arrowDown, () => self.jump('bottom'));
      dock.append(this._top, this._bottom);
      this._onScroll = () => self.schedule();
      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onScroll, { passive: true });
      this.sync();
      UI.scheduleDock();
    },
    destroy() {
      if (this._onScroll) {
        window.removeEventListener('scroll', this._onScroll);
        window.removeEventListener('resize', this._onScroll);
        this._onScroll = null;
      }
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
      if (this._top) { this._top.remove(); this._top = null; }
      if (this._bottom) { this._bottom.remove(); this._bottom = null; }
      UI.scheduleDock();
    },
    button(label, icon, fn) {
      return h('button', {
        class: 'yhx-glass yhx-glass-nav', type: 'button', title: label, 'aria-label': label,
        html: icon, onclick: fn,
      });
    },
    schedule() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        this.sync();
      });
    },
    sync() {
      const top = this._top;
      const bottom = this._bottom;
      if (!top || !bottom) return;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const vh = window.innerHeight || 0;
      const total = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
        vh,
      );
      const canScroll = total - vh > 240;
      const atTop = y < 200;
      const atBottom = y + vh > total - 200;
      top.classList.toggle('is-off', !(canScroll && !atTop));
      bottom.classList.toggle('is-off', !(canScroll && !atBottom));
    },
    jump(where) {
      const total = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
      );
      const top = where === 'bottom' ? total : 0;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      } catch (_) {
        window.scrollTo(0, top);
      }
      this.schedule();
    },
  };
  const customReward = {
    id: 'customReward',
    name: '自定义打赏金额',
    group: '浏览增强',
    order: 40,
    defaultEnabled: true,
    icon: ICON.coin,
    desc: '打赏面板里多一个自定义格子，想打多少就填多少，不用被预设档位卡住。',
    _observer: null,
    _form: null,
    _bound: null,
    status() {
      if (this._form && document.contains(this._form)) return '已适配当前打赏面板';
      if (document.querySelector('.yhx-rw-custom')) return '已插入自定义格';
      return '等待打赏面板…（点「打赏」即生效）';
    },
    init() {
      this.scan();
      this.watch();
    },
    destroy() {
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      const b = this._bound;
      if (b) {
        try {
          if (b.tile && b.onInput) b.tile.removeEventListener('input', b.onInput);
          if (b.form && b.onChange) b.form.removeEventListener('change', b.onChange);
          if (b.tile && b.onClick) b.tile.removeEventListener('click', b.onClick);
        } catch (_) {}
      }
      this._bound = null;
      this._form = null;
      Array.from(document.querySelectorAll('.yhx-rw-custom, .yhx-rw-extra')).forEach((n) => n.remove());
    },
    findForm() {
      const forms = Array.from(document.querySelectorAll('form'));
      for (const f of forms) {
        const radios = Array.from(f.querySelectorAll('input[type=radio]'));
        if (radios.length < 2) continue;
        const names = new Set(radios.map((r) => r.name).filter(Boolean));
        if (names.size !== 1) continue;
        if (!/妖晶|打赏/.test(f.textContent || '')) continue;
        return f;
      }
      return null;
    },
    radiosOf(form) {
      const all = Array.from(form.querySelectorAll('input[type=radio]'));
      if (!all.length) return [];
      const name = all[0].name;
      return all.filter((r) => r.name === name);
    },
    tileOf(radio) {
      try {
        if (radio.id) {
          const l = document.querySelector('label[for="' + radio.id + '"]');
          if (l) return l;
        }
      } catch (_) {}
      const next = radio.nextElementSibling;
      if (next && next.tagName === 'LABEL') return next;
      const prev = radio.previousElementSibling;
      if (prev && prev.tagName === 'LABEL') return prev;
      if (radio.parentElement && radio.parentElement.tagName === 'LABEL') return radio.parentElement;
      return null;
    },
    commonParent(list) {
      if (!list.length) return null;
      let p = list[0].parentElement;
      while (p && p !== document.body) {
        if (list.every((it) => p.contains(it))) return p;
        p = p.parentElement;
      }
      return null;
    },
    scan() {
      if (this._form && document.contains(this._form)) return;
      this._form = null;
      const form = this.findForm();
      if (!form) return;
      if (form.querySelector('.yhx-rw-custom')) { this._form = form; return; }
      if (this.inject(form)) this._form = form;
    },
    inject(form) {
      const radios = this.radiosOf(form);
      if (radios.length < 2) return false;
      const grid = this.commonParent(radios);
      if (!grid) return false;
      const lastRadio = radios[radios.length - 1];
      const lastTile = this.tileOf(lastRadio);
      const tile = lastTile
        ? lastTile.cloneNode(false)
        : h('div', { class: 'rw-tile' });
      tile.className = String(tile.className || 'rw-tile') + ' yhx-rw-custom';
      tile.removeAttribute('for');
      tile.removeAttribute('id');
      tile.textContent = '';
      const input = h('input', {
        class: 'yhx-rw-input', type: 'number', inputmode: 'numeric',
        min: '1', step: '1', placeholder: '自定义',
        'aria-label': '自定义打赏金额', autocomplete: 'off',
      });
      tile.appendChild(input);
      const hidden = h('input', {
        type: 'hidden', value: '', class: 'yhx-rw-extra', disabled: 'disabled',
      });
      grid.appendChild(tile);
      form.appendChild(hidden);
      const feeEl = form.querySelector('.rw-fee');
      const ctaEl = form.querySelector('.rw-cta');
      const amtEl = form.querySelector('.rw-amt');
      const origFee = feeEl ? feeEl.textContent : '';
      const origCta = ctaEl ? ctaEl.textContent : '';
      const origAmt = amtEl ? amtEl.textContent : '';
      const amountOf = () => Math.max(0, Math.trunc(Number(input.value) || 0));
      const feeOf = (net) => Math.max(1, Math.round(net * 0.01));
      const radioName = radios[0].name;
      const clearRadios = () => {
        radios.forEach((r) => { r.checked = false; });
      };
      const enterCustom = () => {
        const net = amountOf();
        if (!net) {
          hidden.disabled = true;
          hidden.removeAttribute('name');
          hidden.value = '';
          delete hidden.dataset.net;
          tile.classList.remove('is-on');
          if (feeEl) feeEl.textContent = origFee;
          if (ctaEl) ctaEl.textContent = origCta;
          if (amtEl) amtEl.textContent = origAmt;
          return;
        }
        clearRadios();
        const fee = feeOf(net);
        const total = net + fee;
        hidden.setAttribute('name', radioName);
        hidden.value = String(total);
        hidden.dataset.net = String(net);
        hidden.disabled = false;
        tile.classList.add('is-on');
        if (feeEl) feeEl.textContent = '含手续费 ' + fee + '，实付 ' + total + ' 妖晶';
        if (ctaEl) {
          ctaEl.textContent = '确定打赏' + net + '妖晶';
          if (origAmt) {
            ctaEl.textContent = '';
            ctaEl.appendChild(document.createTextNode('确定打赏'));
            ctaEl.appendChild(h('span', { class: 'rw-amt', text: String(net) }));
            ctaEl.appendChild(document.createTextNode('妖晶'));
          }
        }
      };
      const leaveCustom = () => {
        hidden.disabled = true;
        hidden.removeAttribute('name');
        hidden.value = '';
        delete hidden.dataset.net;
        tile.classList.remove('is-on');
        if (feeEl) feeEl.textContent = origFee;
        if (ctaEl) ctaEl.textContent = origCta;
      };
      const onInput = () => enterCustom();
      const onChange = (e) => {
        if (e.target && e.target.type === 'radio') leaveCustom();
      };
      const onClick = (e) => {
        if (e.target === input) return;
        e.preventDefault();
        e.stopPropagation();
        input.focus();
      };
      tile.addEventListener('input', onInput);
      tile.addEventListener('change', onInput);
      tile.addEventListener('click', onClick);
      form.addEventListener('change', onChange);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); input.blur(); }
      });
      this._bound = { form: form, tile: tile, input: input, onInput: onInput, onChange: onChange, onClick: onClick };
      return true;
    },
    watch() {
      if (this._observer) return;
      const self = this;
      this._observer = new MutationObserver(debounce(() => self.scan(), 200));
      this._observer.observe(document.body, { childList: true, subtree: true });
    },
  };
  const pasteUpload = {
    id: 'pasteUpload',
    name: '粘贴自动上传',
    group: '编辑器增强',
    order: 15,
    defaultEnabled: true,
    icon: ICON.paste,
    desc: '回复框里直接粘贴图片或视频，自动上传图床并回填 [img] / [movie] 代码。',
    _seq: 0,
    _onPaste: null,
    status() { return '监听中'; },
    init() {
      const self = this;
      this._onPaste = (e) => { try { self.handle(e); } catch (err) { } };
      document.addEventListener('paste', this._onPaste, true);
    },
    destroy() {
      if (this._onPaste) {
        document.removeEventListener('paste', this._onPaste, true);
        this._onPaste = null;
      }
    },
    handle(e) {
      const target = e.target && e.target.closest
        ? e.target.closest('textarea[data-ubb], .yhx-rich')
        : null;
      if (!target) return;
      const cd = e.clipboardData;
      if (!cd || !cd.items) return;
      const files = [];
      for (let i = 0; i < cd.items.length; i++) {
        const it = cd.items[i];
        if (it.kind !== 'file') continue;
        const f = it.getAsFile();
        if (f && (/^image\//i.test(f.type) || /^video\//i.test(f.type))) files.push(f);
      }
      if (!files.length) return;
      e.preventDefault();
      e.stopPropagation();
      let text = '';
      try { text = cd.getData('text/plain') || ''; } catch (_) {}
      if (text) {
        try { this.insert(target, text); } catch (_) {}
      }
      const self = this;
      files.forEach((f) => {
        const kind = /^video\//i.test(f.type) ? 'video' : 'img';
        const marker = '⏳#' + (++self._seq);
        try { this.insert(target, marker); } catch (err) {
          UI.toast('无法在光标处插入', 'error');
          return;
        }
        UI.toast('开始上传' + (kind === 'video' ? '视频' : '图片') + '…');
        Uploader.upload(f, kind).then((url) => {
          const ubb = kind === 'video' ? '[movie]' + url + '[/movie]' : '[img]' + url + '[/img]';
          self.replace(target, marker, ubb);
          UI.toast('上传完成', 'ok');
        }).catch((err) => {
          self.remove(target, marker);
          UI.toast('上传失败：' + ((err && err.message) || err), 'error');
        });
      });
    },
    textareaOf(target) {
      if (target.tagName === 'TEXTAREA') return target;
      const box = target.closest('.ubb-box') || target.parentElement;
      return box ? box.querySelector('textarea[data-ubb]') : null;
    },
    insert(target, marker) {
      if (target.classList && target.classList.contains('yhx-rich')) {
        target.focus();
        if (!document.execCommand('insertText', false, marker)) {
          throw new Error('insertText 失败');
        }
        return;
      }
      const ta = target;
      const pos = ta.selectionStart != null ? ta.selectionStart : (ta.value || '').length;
      const end = ta.selectionEnd != null ? ta.selectionEnd : pos;
      if (typeof ta.setRangeText === 'function') {
        ta.setRangeText(marker, pos, end, 'end');
      } else {
        const v = ta.value || '';
        ta.value = v.slice(0, pos) + marker + v.slice(end);
      }
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    },
    replace(target, marker, ubb) {
      const ta = this.textareaOf(target);
      if (!ta) return;
      const v = ta.value || '';
      const i = v.indexOf(marker);
      if (i < 0) {
        UI.toast('占位符已被移除，上传结果：' + ubb);
        return;
      }
      ta.value = v.slice(0, i) + ubb + v.slice(i + marker.length);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    },
    remove(target, marker) {
      const ta = this.textareaOf(target);
      if (!ta) return;
      const v = ta.value || '';
      const i = v.indexOf(marker);
      if (i < 0) return;
      ta.value = v.slice(0, i) + v.slice(i + marker.length);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    },
  };
  Registry.register(customReward);
  Registry.register(pasteUpload);
  Registry.register(repeater);
  Registry.register(scrollNav);
  Registry.register(topicPreview);
  Registry.register(userCard);
  Registry.register(emojiGrab);
  Registry.register(homeSearch);
  Registry.register(skipLink);
  Registry.register(keywordBlock);
  const autoEat = {
    id: 'autoEat',
    name: '自动吃肉',
    group: '浏览增强',
    order: 55,
    defaultEnabled: false,
    icon: ICON.eat,
    desc: '打开帖子自动吃肉：当日每帖一次，自动填入吃肉词并提交；吃肉词可自定义增删，上次用过的词下次不会重复。',
    PRESET_WORDS: [
      '吃', '肉', '吃吃', '吃吃吃', '肉肉',
      '吃。', '吃。。', '吃。。。', '肉。', '肉。。', '肉。。。',
      '7', '77', '777', '+30',
    ],
    init() {
      this.run();
    },
    destroy() {
      $$('.yhx-ae-tag-done').forEach((n) => n.remove());
    },
    status() {
      const n = this.words().length;
      const last = Store.get('autoEatLast', '');
      return '吃肉词 ' + n + ' 个' + (last ? '，上次用「' + last + '」' : '');
    },
    words() {
      const list = Store.get('autoEatWords', null);
      if (!Array.isArray(list)) {
        const preset = this.PRESET_WORDS.slice();
        Store.set('autoEatWords', preset);
        return preset;
      }
      return list.filter((w) => typeof w === 'string' && w.trim());
    },
    saveWords(list) {
      Store.set('autoEatWords', list.map((w) => String(w).trim()).filter(Boolean));
    },
    pickWord() {
      const list = this.words();
      if (!list.length) return '';
      const last = Store.get('autoEatLast', '');
      const pool = list.filter((w) => w !== last);
      const src = pool.length ? pool : list;
      return src[Math.floor(Math.random() * src.length)];
    },
    dates() {
      const d = Store.get('autoEatDates', null);
      return (d && typeof d === 'object') ? d : {};
    },
    markEaten(pid, today) {
      const d = this.dates();
      d[pid] = today;
      const cutoff = Date.now() - 2 * 864e5;
      Object.keys(d).forEach((k) => {
        const t = Date.parse(d[k]);
        if (!isNaN(t) && t < cutoff) delete d[k];
      });
      Store.set('autoEatDates', d);
    },
    myUid() {
      const inp = document.querySelector('input[name="myuserid"]');
      if (inp && /^\d+$/.test(String(inp.value || '').trim())) return String(inp.value).trim();
      const g = document.cookie.match(/(?:^|;\s*)GET(\d+)=/);
      if (g) return g[1];
      return '';
    },
    hasEatenOnPage(uid) {
      if (!uid) return false;
      const links = $$('a[href*="touserid=' + uid + '"]');
      for (const a of links) {
        const floor = a.closest('.forum-post, [data-reply-id], .reline, .list-reply, [data-floor]');
        if (!floor) continue;
        const el = floor.querySelector('.post-content, .retext, .recontent');
        const text = el ? (el.textContent || '') : '';
        if (text.indexOf('吃') > -1 || text.indexOf('肉') > -1) return true;
      }
      return false;
    },
    run() {
      if (!this.isTopic()) return;
      const pid = (location.pathname.match(/\/bbs-(\d+)/) || [])[1];
      if (!pid) return;
      const now = new Date();
      const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const dates = this.dates();
      if (dates[pid] === today) return;
      const uid = this.myUid();
      if (uid && this.hasEatenOnPage(uid)) { this.markEaten(pid, today); return; }
      const remainEl = document.querySelector('.yushuzi');
      if (!remainEl) return;
      const remain = parseInt((remainEl.textContent || '').trim(), 10);
      if (isNaN(remain) || remain <= 0) return;
      const content = this.pickWord();
      if (!content) return;
      const ta = document.querySelector('textarea.retextarea')
        || document.querySelector('form[action*="book_re"] textarea');
      if (!ta) return;
      const form = ta.closest('form');
      if (!form) return;
      ta.value = content;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      const sub = form.querySelector('input[type="submit"][name="g"], button[type="submit"]');
      if (sub) sub.click(); else form.submit();
      this.markEaten(pid, today);
      Store.set('autoEatLast', content);
      const p = remainEl.parentNode;
      if (p) {
        const tag = h('span', { class: 'yhx-ae-tag-done', text: '🤖 已自动吃肉：' + content });
        tag.style.cssText = 'color:#e74c3c;font-size:12px;margin-left:6px';
        p.appendChild(tag);
      }
      UI.toast('已自动吃肉：' + content, 'ok');
    },
    isTopic() {
      return /\/bbs-\d+/.test(location.pathname);
    },
    renderSettings(box) {
      const self = this;
      const hint = h('div', { class: 'yhx-ae-hint', text: '上次用过的词下次自动跳过（不会连续两轮重复）。' });
      const tags = h('div', { class: 'yhx-ae-tags' });
      const renderTags = () => {
        tags.textContent = '';
        this.words().forEach((w) => {
          const tag = h('span', { class: 'yhx-ae-tag', text: w });
          tag.appendChild(h('i', {
            class: 'yhx-ae-tag-x', text: '×', title: '删除',
            onclick: () => {
              self.saveWords(self.words().filter((x) => x !== w));
              renderTags();
            },
          }));
          tags.appendChild(tag);
        });
        if (!this.words().length) {
          tags.appendChild(h('span', { class: 'yhx-ae-empty', text: '列表为空，添加至少一个词才会自动吃肉' }));
        }
      };
      renderTags();
      const input = h('input', { class: 'yhx-ae-input', type: 'text', placeholder: '输入吃肉词，回车或点添加' });
      const add = () => {
        const v = input.value.trim();
        if (!v) return;
        if (this.words().indexOf(v) > -1) { input.value = ''; return; }
        const list = this.words();
        list.push(v);
        this.saveWords(list);
        input.value = '';
        renderTags();
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); add(); }
      });
      const addBtn = h('button', { class: 'yhx-ae-add', type: 'button', text: '添加', onclick: add });
      const row = h('div', { class: 'yhx-ae-row' }, input, addBtn);
      const reset = h('button', { class: 'yhx-ae-reset', type: 'button', text: '恢复预置词', onclick: () => { self.saveWords(self.PRESET_WORDS.slice()); renderTags(); } });
      box.appendChild(h('div', { class: 'yhx-ae-wrap' }, hint, tags, row, reset));
    },
  };
  Registry.register(autoEat);
  const autoLoadCore = {
    nearBottom() {
      return window.innerHeight + window.scrollY >= document.body.scrollHeight - 600;
    },
    klTick(retry) {
      const btn = document.querySelector('#KL_loadmore');
      const tip = document.querySelector('#KL_show_tip');
      if (!btn || !tip) return false;
      const text = tip.textContent.trim();
      const m = text.match(/\((\d+)\/(\d+)\)/);
      if (m && +m[1] >= +m[2]) return false;
      if (!this.nearBottom()) return false;
      if (this._busy) return false;
      if (this._stuck >= 3) return false;
      this._busy = true;
      btn.click();
      setTimeout(() => {
        const now = tip.textContent.trim();
        this._stuck = (now === text) ? (this._stuck + 1) : 0;
        this._busy = false;
        if (this._stuck < 3 && this.nearBottom() && typeof retry === 'function') retry();
      }, 1200);
      return true;
    },
    reset() {
      this._busy = false;
      this._stuck = 0;
    },
  };
  const autoLoadPosts = {
    id: 'autoLoadPosts',
    name: '自动加载更多帖子',
    group: '浏览增强',
    order: 70,
    defaultEnabled: false,
    icon: ICON.loadMore,
    desc: '帖子列表页、用户帖子列表页滚动到底时自动加载下一页帖子（默认关）。',
    _onScroll: null,
    _loaded: 0,
    active() {
      const path = location.pathname;
      if (/book_list_search\.aspx/i.test(path)) return !!document.querySelector('.post-items');
      if (/book_list\.aspx/i.test(path)) {
        return !!(document.querySelector('#KL_loadmore') || document.querySelector('.listdata') || document.querySelector('.list'));
      }
      return false;
    },
    tick() {
      if (!this.active()) return;
      if (document.querySelector('.post-items')) { this.loadPostItems(); return; }
      if (autoLoadCore.klTick(() => this.tick())) this._loaded++;
    },
    loadPostItems() {
      if (autoLoadCore._busy || !autoLoadCore.nearBottom()) return;
      const nextA = $$('a').find((a) => /下一页/.test(a.textContent || '') && /page=/.test(a.getAttribute('href') || ''));
      if (!nextA) return;
      autoLoadCore._busy = true;
      const url = nextA.getAttribute('href');
      const self = this;
      fetch(new URL(url, location.origin).href, { credentials: 'same-origin' })
        .then((r) => r.text())
        .then((t) => {
          const d = new DOMParser().parseFromString(t, 'text/html');
          const items = [...d.querySelectorAll('.post-items > li.post-item')];
          const ul = document.querySelector('.post-items');
          if (ul && items.length) {
            items.forEach((li) => ul.appendChild(document.importNode(li, true)));
            const n2 = [...d.querySelectorAll('a')].find((a) => /下一页/.test(a.textContent || '') && /page=/.test(a.getAttribute('href') || ''));
            if (n2) nextA.setAttribute('href', n2.getAttribute('href'));
            else nextA.remove();
            self._loaded++;
            autoLoadCore._stuck = 0;
          } else {
            nextA.remove();
          }
        })
        .catch(() => {})
        .then(() => { autoLoadCore._busy = false; });
    },
    init() {
      if (!this.active()) return;
      this.tick();
      this._onScroll = () => this.tick();
      window.addEventListener('scroll', this._onScroll, { passive: true });
    },
    destroy() {
      if (this._onScroll) { window.removeEventListener('scroll', this._onScroll); this._onScroll = null; }
      autoLoadCore.reset();
    },
    status() {
      return this._loaded ? '已自动加载 ' + this._loaded + ' 页' : '滚动到底自动加载';
    },
  };
  const autoLoadReplies = {
    id: 'autoLoadReplies',
    name: '自动加载更多回复',
    group: '浏览增强',
    order: 71,
    defaultEnabled: false,
    icon: ICON.loadMore,
    desc: '回帖列表页和帖子详情页滚动到底时自动加载下一页回复（默认关）。',
    _onScroll: null,
    _loaded: 0,
    _exhausted: false,
    _rePage: 0,
    _emptyStreak: 0,
    active() {
      const path = location.pathname;
      if (/book_re\.aspx/i.test(path)) return !!document.querySelector('#KL_loadmore');
      if (/\/bbs-\d+\.html/i.test(path)) {
        return !!(document.querySelector('.forum-post') && document.querySelector('.recontent[data-new-reply-after]'));
      }
      return false;
    },
    tick() {
      if (!this.active()) return;
      if (document.querySelector('#KL_loadmore')) {
        if (autoLoadCore.klTick(() => this.tick())) this._loaded++;
        return;
      }
      this.loadTopicReplies();
    },
    loadTopicReplies() {
      if (this._exhausted || autoLoadCore._busy || !autoLoadCore.nearBottom()) return;
      const container = document.querySelector('.recontent[data-new-reply-after]');
      if (!container) return;
      const allRe = $$('a').find((a) => /全部回帖/.test(a.textContent || '') && /book_re\.aspx/.test(a.getAttribute('href') || ''));
      if (!allRe) { this._exhausted = true; return; }
      const base = new URL(allRe.getAttribute('href'), location.origin);
      if (!this._rePage) this._rePage = 1;
      const self = this;
      const target = 30;
      let accumulated = 0;
      let pages = 0;
      autoLoadCore._busy = true;
      const finish = () => {
        if (accumulated) { self._loaded++; autoLoadCore._stuck = 0; }
        autoLoadCore._busy = false;
      };
      const step = () => {
        const u = new URL(base.href);
        u.searchParams.set('page', String(self._rePage));
        fetch(u.href, { credentials: 'same-origin' })
          .then((r) => r.text())
          .then((t) => {
            const d = new DOMParser().parseFromString(t, 'text/html');
            const have = new Set([...container.querySelectorAll('.forum-post')].map((p) => p.getAttribute('data-reply-id')));
            const pagePosts = [...d.querySelectorAll('.forum-post')];
            pages++;
            if (!pagePosts.length) {
              self._exhausted = true;
              finish();
              return;
            }
            const fresh = pagePosts.filter((p) => {
              const id = p.getAttribute('data-reply-id');
              return id && !have.has(id);
            });
            if (fresh.length) {
              let anchor = [...container.querySelectorAll('.forum-post')].pop();
              fresh.forEach((p) => {
                const node = document.importNode(p, true);
                anchor.parentNode.insertBefore(node, anchor.nextSibling);
                anchor = node;
              });
              accumulated += fresh.length;
              self._emptyStreak = 0;
            } else {
              self._emptyStreak = (self._emptyStreak || 0) + 1;
            }
            self._rePage++;
            const more = self._emptyStreak < 3 && pages < 5 && accumulated < target;
            if (more) { step(); return; }
            if ((self._emptyStreak || 0) >= 3) self._exhausted = true;
            if (!pagePosts.length || (!fresh.length && pages >= 5)) self._exhausted = self._exhausted || (pages >= 5 && !fresh.length);
            finish();
          })
          .catch(() => finish());
      };
      step();
    },
    init() {
      if (!this.active()) return;
      this._exhausted = false;
      this.tick();
      this._onScroll = () => this.tick();
      window.addEventListener('scroll', this._onScroll, { passive: true });
    },
    destroy() {
      if (this._onScroll) { window.removeEventListener('scroll', this._onScroll); this._onScroll = null; }
      this._exhausted = false;
      this._rePage = 0;
      this._emptyStreak = 0;
      autoLoadCore.reset();
    },
    status() {
      return this._loaded ? '已自动加载 ' + this._loaded + ' 页' : '滚动到底自动加载';
    },
  };
  Registry.register(autoLoadPosts);
  Registry.register(autoLoadReplies);
  const autoNewReplies = {
    id: 'autoNewReplies',
    name: '自动加载新回复',
    group: '浏览增强',
    order: 72,
    defaultEnabled: false,
    icon: ICON.newReplies,
    desc: '浏览帖子时有人新回复自动加载，5 秒内响应（站点原生提示条出现时也会自动展开）。',
    _timer: 0,
    _lastNum: null,
    _wm: 0,
    _fetching: false,
    _fails: 0,
    active() {
      return !!(document.querySelector('form[name="f"]') && document.querySelector('.recontent[data-new-reply-after]'));
    },
    pollUrl(fetchAll) {
      const form = document.querySelector('form[name="f"]');
      if (!form) return '';
      const action = form.getAttribute('action') || '';
      try {
        const a = new URL(action, location.href);
        const u = new URL(a.pathname.replace(/book_re\.aspx$/i, 'book_view.aspx'), location.href);
        ['siteid', 'classid', 'id'].forEach((k) => { const v = a.searchParams.get(k); if (v) u.searchParams.set(k, v); });
        u.searchParams.set('fragment', 'newreplies');
        u.searchParams.set('after_floor', String(this._wm));
        if (fetchAll) u.searchParams.set('fetch', '1');
        return u.href;
      } catch (_) { return ''; }
    },
    insertHtml(html, order) {
      const container = document.querySelector('.recontent[data-new-reply-after]');
      const q = window.QuickReplyDom;
      if (!container || !q || typeof q.insertReply !== 'function') return [];
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      const have = new Set([...container.querySelectorAll('[data-reply-id]')].map((x) => x.getAttribute('data-reply-id')));
      const floorOf = (el) => { const n = parseInt(el.getAttribute('data-floor'), 10); return n > 0 ? n : 0; };
      const nodes = [...wrap.children]
        .filter((el) => el.getAttribute('data-reply-id') && el.getAttribute('data-floor') && !have.has(el.getAttribute('data-reply-id')))
        .sort((a, b) => floorOf(a) - floorOf(b));
      const out = [];
      nodes.forEach((node) => {
        q.insertReply(container, node, order === '1' ? 'append' : 'prepend');
        const fl = floorOf(node);
        if (fl) {
          const others = [...container.querySelectorAll('[data-reply-id]')]
            .filter((x) => x !== node && x.getAttribute('data-reply-top') !== 'true' && floorOf(x) > 0);
          let target = null;
          for (const o of others) {
            const ofl = floorOf(o);
            if (order === '1' ? ofl > fl : ofl < fl) { target = o; break; }
          }
          if (target && target.previousElementSibling !== node && target.parentNode) {
            target.parentNode.insertBefore(node, target);
          }
        }
        if (typeof q.enhanceReplyNode === 'function') q.enhanceReplyNode(node);
        out.push(node);
      });
      if (typeof q.dedupeReplies === 'function') q.dedupeReplies(container);
      if (typeof q.normalizeReplyStriping === 'function') q.normalizeReplyStriping(container);
      if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        out.forEach((node) => {
          node.classList.remove('reply-highlight');
          void node.offsetWidth;
          node.classList.add('reply-highlight');
          setTimeout(() => node.classList.remove('reply-highlight'), 2100);
        });
      }
      return out;
    },
    fastPoll() {
      if (this._fetching || !this.active() || document.hidden) return;
      const url = this.pollUrl(false);
      if (!url) return;
      const self = this;
      this._fetching = true;
      fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then((r) => r.json())
        .then((t) => {
          self._fails = 0;
          if (!t || t.ok !== true || !(t.items || []).length) return;
          const bar = document.querySelector('.new-reply-bar');
          if (bar && !bar.classList.contains('is-loading') && !bar.classList.contains('is-error')) {
            bar.click();
            return;
          }
          if (!window.QuickReplyDom || typeof window.QuickReplyDom.insertReply !== 'function') return;
          const full = self.pollUrl(true);
          if (!full) return;
          self._fetching = true;
          fetch(full, { credentials: 'same-origin', cache: 'no-store', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then((r) => r.json())
            .then((t2) => {
              if (!t2 || t2.ok !== true) return;
              const form = document.querySelector('form[name="f"]');
              const ot = form && form.querySelector('[name="ot"]') ? form.querySelector('[name="ot"]').value : '0';
              self.insertHtml(t2.html || '', ot);
              (t2.items || []).forEach((it) => { if (it.floor > self._wm) self._wm = it.floor; });
              if (t2.more) setTimeout(() => { self._fetching = false; self.fastPoll(); }, 300);
            })
            .catch(() => {})
            .then(() => { self._fetching = false; });
        })
        .catch(() => { self._fails++; })
        .then(() => { self._fetching = false; });
    },
    tick() {
      if (!this.active()) return;
      const bar = document.querySelector('.new-reply-bar');
      if (!bar) { this._lastNum = null; return; }
      if (bar.classList.contains('is-loading') || bar.classList.contains('is-error')) return;
      const numEl = bar.querySelector('.new-reply-bar-num');
      const num = numEl ? numEl.textContent : '';
      if (this._lastNum === num) return;
      this._lastNum = num;
      const self = this;
      setTimeout(() => {
        const b = document.querySelector('.new-reply-bar');
        if (!b || b.classList.contains('is-loading') || b.classList.contains('is-error')) return;
        const n2 = b.querySelector('.new-reply-bar-num');
        if ((n2 ? n2.textContent : '') !== num) return;
        b.click();
      }, 600);
    },
    init() {
      if (!this.active()) return;
      const c = document.querySelector('.recontent[data-new-reply-after]');
      const init = parseInt(c.getAttribute('data-new-reply-after'), 10);
      this._wm = init >= 0 ? init : 0;
      this._timer = setInterval(() => this.tick(), 800);
      this._fastTimer = setInterval(() => this.fastPoll(), 5000);
      this.tick();
    },
    destroy() {
      if (this._timer) { clearInterval(this._timer); this._timer = 0; }
      if (this._fastTimer) { clearInterval(this._fastTimer); this._fastTimer = 0; }
      this._lastNum = null;
      this._wm = 0;
      this._fetching = false;
      this._fails = 0;
    },
    status() {
      return this.active() ? '监视新回复提示条中' : '进入帖子详情页后生效';
    },
  };
  Registry.register(autoNewReplies);
  const customUbb = {
    id: 'customUbb',
    name: '自定义 UBB',
    group: '编辑器增强',
    order: 60,
    defaultEnabled: true,
    icon: ICON.plus,
    desc: '在编辑器工具栏加自定义 UBB 按钮：模板里用 {} 作参数占位符，点按钮填参数即插入；图标支持上传/外链/base64。',
    _observer: null,
    _pop: null,
    _popClose: null,
    _caretS: 0,
    _caretE: 0,
    items() {
      const list = Store.get('customUbb', null);
      if (!Array.isArray(list)) { Store.set('customUbb', []); return []; }
      return list.filter((it) => it && it.id && typeof it.code === 'string');
    },
    saveItems(list) {
      Store.set('customUbb', list);
    },
    init() {
      this.injectAll();
      this._observer = new MutationObserver(debounce(() => this.injectAll(), 300));
      this._observer.observe(document.body, { childList: true, subtree: true });
    },
    destroy() {
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      this.closePop();
      $$('.yhx-cu-btn, .yhx-cu-add').forEach((n) => n.remove());
    },
    status() {
      return '已配置 ' + this.items().length + ' 条';
    },
    iconNode(icon) {
      const s = String(icon || '').trim();
      if (/^<svg/i.test(s)) return h('span', { class: 'yhx-cu-icon-svg', html: s });
      if (icon) return h('img', { class: 'yhx-cu-icon', src: icon, alt: '', referrerpolicy: 'no-referrer' });
      return h('span', { class: 'yhx-cu-icon-fallback', text: 'T' });
    },
    injectAll() {
      $$('.ubb-bar').forEach((bar) => this.injectBar(bar));
    },
    injectBar(bar) {
      if (!bar.__yhxUbb) {
        const add = h('button', {
          type: 'button', tabindex: '-1', class: 'ubb-btn yhx-cu-add',
          title: '自定义 UBB', 'aria-label': '自定义 UBB', html: ICON.plus,
          onclick: (e) => { e.preventDefault(); e.stopPropagation(); this.openConfig(bar); },
        });
        const sep = bar.querySelector('.ubb-sep');
        if (sep) sep.parentNode.insertBefore(add, sep);
        else bar.appendChild(add);
        bar.__yhxUbb = { add: add, btns: {} };
      }
      const holder = bar.__yhxUbb;
      this.items().forEach((item) => {
        let b = holder.btns[item.id];
        if (b) {
          if ((b.__yhxIcon || '') !== (item.icon || '')) {
            b.textContent = '';
            b.appendChild(this.iconNode(item.icon));
            b.__yhxIcon = item.icon || '';
          }
          if (b.title !== (item.title || '')) {
            b.title = item.title || '';
            b.setAttribute('aria-label', item.title || '自定义 UBB');
          }
          return;
        }
        const b2 = h('button', {
          type: 'button', tabindex: '-1', class: 'ubb-btn yhx-cu-btn',
          dataset: { k: 'yhx-cu-' + item.id },
          'aria-label': item.title || '自定义 UBB',
          onclick: (e) => { e.preventDefault(); e.stopPropagation(); this.openPop(bar, item, b2); },
        });
        if (item.title) b2.title = item.title;
        b2.appendChild(this.iconNode(item.icon));
        b2.__yhxIcon = item.icon || '';
        holder.add.parentNode.insertBefore(b2, holder.add);
        holder.btns[item.id] = b2;
      });
      Object.keys(holder.btns).forEach((id) => {
        if (!this.items().some((it) => it.id === id)) {
          holder.btns[id].remove();
          delete holder.btns[id];
        }
      });
    },
    openPop(bar, item, btn) {
      this.closePop();
      const n = (item.code.match(/\{\}/g) || []).length;
      const box0 = bar.closest('.ubb-box') || bar.parentElement;
      const ta0 = box0 ? box0.querySelector('textarea') : null;
      const sel = ta0 ? ta0.value.slice(ta0.selectionStart || 0, ta0.selectionEnd || 0) : '';
      if (sel && n) {
        this._caretS = ta0.selectionStart || 0;
        this._caretE = ta0.selectionEnd || 0;
        let out = item.code;
        for (let i = 0; i < n; i++) out = out.replace('{}', sel);
        this.insertText(bar, out);
        return;
      }
      const params = Array.isArray(item.params) ? item.params : [];
      if (!n) { this.insertText(bar, item.code); return; }
      const box = bar.closest('.ubb-box') || bar.parentElement;
      const ta = box ? box.querySelector('textarea') : null;
      this._caretS = ta ? (ta.selectionStart || 0) : 0;
      this._caretE = ta ? (ta.selectionEnd || 0) : 0;
      const pop = h('div', { class: 'yhx-cu-pop', role: 'dialog' });
      pop.appendChild(h('div', { class: 'yhx-cu-pop-title', text: item.title || '自定义 UBB' }));
      const inputs = [];
      for (let i = 0; i < n; i++) {
        const p = params[i] || {};
        const wrap = h('div', { class: 'yhx-cu-param' });
        if (p.name) wrap.appendChild(h('label', { class: 'yhx-cu-param-name', text: p.name }));
        const inp = h('input', {
          class: 'yhx-cu-param-input', type: 'text',
          placeholder: p.name ? ('请输入「' + p.name + '」') : '请输入「参数」',
        });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); okBtn.click(); } });
        inputs.push(inp);
        wrap.appendChild(inp);
        pop.appendChild(wrap);
      }
      const okBtn = h('button', { class: 'yhx-cu-ok yhx-btn', type: 'button', text: '插入' });
      okBtn.addEventListener('click', () => {
        let out = item.code;
        inputs.forEach((inp) => { out = out.replace('{}', inp.value); });
        this.insertText(bar, out);
        this.closePop();
      });
      pop.appendChild(okBtn);
      UI.root.appendChild(pop);
      this._pop = pop;
      const place = () => {
        const r = btn.getBoundingClientRect();
        pop.style.visibility = 'hidden';
        pop.style.display = 'block';
        const pw = pop.offsetWidth, ph = pop.offsetHeight;
        let left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
        let top = r.bottom + 6;
        if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
        pop.style.left = Math.round(left) + 'px';
        pop.style.top = Math.round(top) + 'px';
        pop.style.visibility = '';
      };
      place();
      const onClose = (e) => {
        if (pop.contains(e.target) || btn.contains(e.target)) return;
        this.closePop();
      };
      const onKey = (e) => { if (e.key === 'Escape') this.closePop(); };
      document.addEventListener('mousedown', onClose);
      document.addEventListener('keydown', onKey);
      this._popClose = () => {
        document.removeEventListener('mousedown', onClose);
        document.removeEventListener('keydown', onKey);
      };
      if (inputs.length) inputs[0].focus();
    },
    closePop() {
      if (this._popClose) { this._popClose(); this._popClose = null; }
      if (this._pop) { this._pop.remove(); this._pop = null; }
    },
    insertText(bar, text) {
      const box = bar.closest('.ubb-box') || bar.parentElement;
      const ta = box ? box.querySelector('textarea') : null;
      if (!ta) return;
      const v = ta.value;
      const s = Math.min(this._caretS || 0, v.length);
      const e = Math.min(this._caretE || s, v.length);
      ta.value = v.slice(0, s) + text + v.slice(e);
      const np = s + text.length;
      try { ta.setSelectionRange(np, np); } catch (_) {}
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
    },
    openConfig(bar) {
      this.closePop();
      let editingId = null;
      let iconUrl = '';
      const mask = h('div', { class: 'yhx-mask', hidden: 'hidden' });
      const sheet = h('div', { class: 'yhx-sheet yhx-modal', role: 'dialog', 'aria-modal': 'true' });
      mask.appendChild(sheet);
      sheet.appendChild(h('div', { class: 'yhx-hd' },
        h('div', { class: 'yhx-hd-title', html: ICON.plus + '<span>自定义 UBB</span>' }),
        h('div', { class: 'yhx-grow' }),
        h('button', { class: 'yhx-iconbtn', type: 'button', 'aria-label': '关闭', html: ICON.close, onclick: () => close() }),
      ));
      const body = h('div', { class: 'yhx-body' });
      sheet.appendChild(body);
      const ft = h('div', { class: 'yhx-ft' });
      sheet.appendChild(ft);
      const listWrap = h('div', { class: 'yhx-cu-list' });
      const renderList = () => {
        listWrap.textContent = '';
        const items = this.items();
        if (!items.length) {
          listWrap.appendChild(h('div', { class: 'yhx-cu-list-empty', text: '还没有自定义 UBB，在下方填写并保存。' }));
          return;
        }
        items.forEach((it) => {
          const row = h('div', { class: 'yhx-cu-list-row' });
          row.appendChild(this.iconNode(it.icon));
          row.appendChild(h('div', { class: 'yhx-cu-list-main' },
            h('div', { class: 'yhx-cu-list-title', text: it.title || '(未命名)' }),
            h('div', { class: 'yhx-cu-list-code', text: it.code }),
          ));
          row.appendChild(h('button', { class: 'yhx-btn', type: 'button', text: '编辑', onclick: () => loadItem(it) }));
          row.appendChild(h('button', { class: 'yhx-btn danger', type: 'button', text: '删除', onclick: () => {
            this.saveItems(this.items().filter((x) => x.id !== it.id));
            this.injectAll();
            renderList();
            UI.toast('已删除「' + (it.title || '未命名') + '」');
          } }));
          listWrap.appendChild(row);
        });
      };
      body.appendChild(listWrap);
      const codeTa = h('textarea', { class: 'yhx-field yhx-cu-code', placeholder: 'UBB 模板，{} 为参数占位符，如 [url={}]{}[/url]' });
      const titleInp = h('input', { class: 'yhx-field', type: 'text', placeholder: 'UBB 注释（悬浮在工具栏按钮上显示）' });
      const paramsWrap = h('div', { class: 'yhx-cu-params' });
      const paramVals = [];
      const countPh = (code) => (String(code || '').match(/\{\}/g) || []).length;
      const renderParams = (n) => {
        paramsWrap.textContent = '';
        if (!n) {
          paramsWrap.appendChild(h('div', { class: 'yhx-cu-hint', text: '模板中没有 {} 占位符，点击按钮将直接插入整段 UBB。' }));
          return;
        }
        for (let i = 0; i < n; i++) {
          const v = paramVals[i] || {};
          const row = h('div', { class: 'yhx-cu-param-row' });
          row.appendChild(h('div', { class: 'yhx-cu-param-head', text: '参数 ' + (i + 1) }));
          const nameInp = h('input', { class: 'yhx-field', type: 'text', placeholder: '参数名（如 链接地址 / 显示文字）', value: v.name || '' });
          nameInp.addEventListener('input', () => { paramVals[i] = paramVals[i] || {}; paramVals[i].name = nameInp.value; });
          row.appendChild(nameInp);
          paramsWrap.appendChild(row);
        }
      };
      codeTa.addEventListener('input', () => renderParams(countPh(codeTa.value)));
      body.appendChild(h('div', { class: 'yhx-cu-label', text: 'UBB 代码' }));
      body.appendChild(codeTa);
      body.appendChild(h('div', { class: 'yhx-cu-label', text: 'UBB 注释（工具栏按钮悬浮提示）' }));
      body.appendChild(titleInp);
      body.appendChild(h('div', { class: 'yhx-cu-label', text: '参数（随 {} 占位符数量自动生成）' }));
      body.appendChild(paramsWrap);
      const iconPreview = h('div', { class: 'yhx-cu-icon-preview', style: 'display:none' });
      const setIcon = (url) => {
        iconUrl = url || '';
        iconPreview.textContent = '';
        if (!iconUrl) { iconPreview.style.display = 'none'; return; }
        iconPreview.style.display = 'block';
        if (/^<svg/i.test(iconUrl.trim())) iconPreview.innerHTML = iconUrl.trim();
        else iconPreview.appendChild(h('img', { src: iconUrl, alt: '', referrerpolicy: 'no-referrer' }));
      };
      const fileInp = h('input', { class: 'yhx-cu-file', type: 'file', accept: 'image/*' });
      fileInp.addEventListener('change', () => {
        const f = fileInp.files && fileInp.files[0];
        if (!f) return;
        UI.toast('正在上传图标…');
        Uploader.upload(f, 'img').then((url) => {
          setIcon(url);
          UI.toast('图标已上传', 'ok');
        }).catch((err) => {
          UI.toast('图标上传失败：' + (err && err.message ? err.message : '未知错误'), 'error');
        });
        fileInp.value = '';
      });
      const urlInp = h('input', { class: 'yhx-field', type: 'url', placeholder: '图标外链 URL' });
      urlInp.addEventListener('input', debounce(() => { if (urlInp.value.trim()) setIcon(urlInp.value.trim()); }, 300));
      const b64Ta = h('textarea', { class: 'yhx-field yhx-cu-b64', placeholder: 'base64 图片（data:image/… 开头，直接粘贴）' });
      b64Ta.addEventListener('input', debounce(() => {
        const v = b64Ta.value.trim();
        if (/^data:image\//i.test(v)) setIcon(v);
      }, 300));
      const svgTa = h('textarea', { class: 'yhx-field yhx-cu-b64', placeholder: 'SVG 代码（<svg …>…</svg>，直接粘贴）' });
      svgTa.addEventListener('input', debounce(() => {
        const v = svgTa.value.trim();
        if (/^<svg/i.test(v)) setIcon(v);
      }, 300));
      const iconRow = h('div', { class: 'yhx-cu-icon-row' },
        h('label', { class: 'yhx-btn', type: 'button' }, '本地上传', fileInp),
        h('button', { class: 'yhx-btn', type: 'button', text: '清除图标', onclick: () => { setIcon(''); urlInp.value = ''; b64Ta.value = ''; svgTa.value = ''; } }),
      );
      body.appendChild(h('div', { class: 'yhx-cu-label', text: '图标（本地上传 / 外链 / base64 / svg 代码，可留空用默认「T」）' }));
      body.appendChild(iconRow);
      body.appendChild(urlInp);
      body.appendChild(b64Ta);
      body.appendChild(svgTa);
      body.appendChild(iconPreview);
      const save = () => {
        const code = codeTa.value.trim();
        if (!code) { UI.toast('UBB 代码不能为空', 'error'); codeTa.focus(); return; }
        const n = countPh(code);
        while (paramVals.length < n) paramVals.push({});
        const item = {
          id: editingId || ('cu_' + Date.now() + '_' + Math.floor(Math.random() * 1e4)),
          code: code,
          title: titleInp.value.trim(),
          params: paramVals.slice(0, n).map((p) => ({ name: (p.name || '').trim() })),
          icon: iconUrl,
        };
        const list = this.items();
        const idx = list.findIndex((x) => x.id === item.id);
        if (idx > -1) list[idx] = item; else list.push(item);
        this.saveItems(list);
        this.injectAll();
        close();
        UI.toast('自定义 UBB 已保存', 'ok');
      };
      ft.appendChild(h('button', { class: 'yhx-btn', type: 'button', text: '取消', onclick: () => close() }));
      ft.appendChild(h('button', { class: 'yhx-btn primary', type: 'button', text: '保存', onclick: save }));
      const loadItem = (it) => {
        editingId = it.id;
        codeTa.value = it.code || '';
        titleInp.value = it.title || '';
        paramVals.length = 0;
        (it.params || []).forEach((p) => paramVals.push({ name: p.name || '' }));
        renderParams(countPh(codeTa.value));
        setIcon(it.icon || '');
        urlInp.value = /^https?:/i.test(it.icon || '') ? it.icon : '';
        b64Ta.value = /^data:image\//i.test(it.icon || '') ? it.icon : '';
        svgTa.value = /^<svg/i.test(it.icon || '') ? it.icon : '';
        body.scrollTop = 0;
      };
      renderList();
      renderParams(0);
      function close() {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey);
        mask.classList.remove('is-open');
        setTimeout(() => mask.remove(), 280);
      }
      let closed = false;
      function onKey(e) { if (e.key === 'Escape') close(); }
      document.addEventListener('keydown', onKey);
      mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
      UI.root.appendChild(mask);
      mask.hidden = false;
      requestAnimationFrame(() => mask.classList.add('is-open'));
    },
  };
  Registry.register(customUbb);
  const ubbSelWrap = {
    id: 'ubbSelWrap',
    name: '输入框选中文字快捷填充UBB',
    group: '浏览增强',
    order: 33,
    defaultEnabled: true,
    icon: ICON.selWrap,
    desc: '在输入框内选中文字后，再点击工具栏的按钮，自动将UBB标签填充在选中的文字前后。',
    _onClick: null,
    active() { return true; },
    WRAP: {
      link: (sel) => ['[url=' + sel + ']', '[/url]'],
      img: () => ['[img]', '[/img]'],
      video: () => ['[movie]', '[/movie]'],
      audio: () => ['[audio]', '[/audio]'],
      wymusic: () => ['[wymusic]', '[/wymusic]'],
      b: () => ['[b]', '[/b]'],
      i: () => ['[i]', '[/i]'],
      u: () => ['[u]', '[/u]'],
      s: () => ['[strike]', '[/strike]'],
      center: () => ['[center]', '[/center]'],
      left: () => ['[left]', '[/left]'],
      code: () => ['[code]', '[/code]'],
      md: () => ['[md]', '[/md]'],
    },
    onClick(e) {
      const btn = e.target && e.target.closest ? e.target.closest('.ubb-btn[data-k]') : null;
      if (!btn) return;
      const box = btn.closest('.ubb-box');
      const ta = box ? box.querySelector('textarea') : null;
      if (!ta) return;
      this.syncRichSelection(ta);
      const build = this.WRAP[btn.getAttribute('data-k')];
      if (!build) return;
      const s = ta.selectionStart, en = ta.selectionEnd;
      const sel = ta.value.slice(s, en);
      if (!sel) return;
      e.preventDefault();
      e.stopPropagation();
      const parts = build(sel);
      ta.value = ta.value.slice(0, s) + parts[0] + sel + parts[1] + ta.value.slice(en);
      const np = s + parts[0].length + sel.length + parts[1].length;
      try { ta.setSelectionRange(np, np); } catch (_) {}
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
    },
    syncRichSelection(ta) {
      try {
        if (typeof ubbPreview === 'undefined' || !ubbPreview._inst || !ubbPreview._inst.get) return false;
        const inst = ubbPreview._inst.get(ta);
        if (!inst || !inst.rich) return false;
        const r = ubbPreview.readRange(inst);
        if (!r) return false;
        ta.selectionStart = r.start;
        ta.selectionEnd = r.end;
        return r.end > r.start;
      } catch (_) { return false; }
    },
    init() {
      this._onClick = (e) => { try { this.onClick(e); } catch (_) {} };
      document.addEventListener('click', this._onClick, true);
    },
    destroy() {
      if (this._onClick) { document.removeEventListener('click', this._onClick, true); this._onClick = null; }
    },
    status() { return '选中文字后点链接/图片等按钮直接包裹'; },
  };
  Registry.register(ubbSelWrap);
  const fileReplyBtn = {
    id: 'fileReplyBtn',
    name: '文件回帖按钮样式',
    group: '编辑器增强',
    order: 25,
    defaultEnabled: false,
    icon: ICON.fileReply,
    desc: '把回帖区的「文件回帖」超链接改成和「快速回复」按钮一致的样式，点击跳转行为不变。',
    active() { return true; },
    init() { document.documentElement.classList.add('yhx-file-reply-btn'); },
    destroy() { document.documentElement.classList.remove('yhx-file-reply-btn'); },
    status() {
      return document.querySelectorAll('a.reply-file-link').length ? '已应用按钮样式' : '当前页面无文件回帖入口';
    },
  };
  Registry.register(fileReplyBtn);
  const notifyFloor = {
    id: 'notifyFloor',
    name: '回复默认通知楼主',
    group: '编辑器增强',
    order: 26,
    defaultEnabled: false,
    icon: ICON.notify,
    desc: '回复时自动勾选「通知楼主」，不用每次手动点。',
    _obs: null,
    active() { return true; },
    apply() {
      const cb = document.querySelector('#cbx, input[name="sendmsg"]');
      if (!cb || cb.checked) return;
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    },
    init() {
      this.apply();
      this._obs = new MutationObserver(() => this.apply());
      this._obs.observe(document.body, { childList: true, subtree: true });
    },
    destroy() {
      if (this._obs) { this._obs.disconnect(); this._obs = null; }
      const cb = document.querySelector('#cbx, input[name="sendmsg"]');
      if (cb && cb.checked) {
        cb.checked = false;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },
    status() {
      const cb = document.querySelector('#cbx, input[name="sendmsg"]');
      if (!cb) return '当前页面无回复框';
      return cb.checked ? '已勾选通知楼主' : '未勾选';
    },
  };
  Registry.register(notifyFloor);
  Registry.register(ubbPreview);
  Registry.register(customEmoji);
  const IN_FRAME = (() => { try { return window.top !== window.self; } catch (_) { return false; } })();
  function boot() {
    injectCSS();
    if (IN_FRAME) {
      const f = Registry.map.get('customReward');
      if (f && Registry.isOn('customReward')) {
        try { f.init && f.init(Registry.ctx()); } catch (e) { }
      }
      return;
    }
    UI.mount();
    Registry.boot();
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
  W.__yhx = {
    version: VERSION,
    registry: Registry,
    store: Store,
    bus: Bus,
    config: Config,
    ui: UI,
    icons: ICON,
    emoji: EmojiData,
    uploader: Uploader,
    toast: (m, t) => UI.toast(m, t),
    previewClearCache: () => topicPreview.clearCache(),
  };
})();
