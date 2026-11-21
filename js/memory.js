/* ============================================================
 * 记忆主题模块（纯展示层）
 * ------------------------------------------------------------
 * 只读取 localStorage 里已有的作答记录与掌握标记，
 * 不写入任何数据，也不改动原有做题 / SM2 / 出题逻辑。
 *
 * 提供：记忆分层、薄弱雷达、记忆风格标签、记忆收藏墙、学习小结
 * ============================================================ */

const Memory = (() => {
  /* 雷达维度：四个方向各占一条轴 */
  const DIMS = [
    { key: 'meaning', label: '释义', angle: -90 },
    { key: 'collocation', label: '搭配', angle: 0 },
    { key: 'cloze', label: '完形', angle: 90 },
    { key: 'spelling', label: '拼写', angle: 180 },
  ];

  /* 三个记忆分层 */
  const LAYERS = [
    { key: 'stable', label: '稳定记住', color: '#22ab98', desc: '连续复测都对' },
    { key: 'consolidating', label: '正在巩固', color: '#f5c451', desc: '刚答对一次' },
    { key: 'slipping', label: '容易溜走', color: '#f87171', desc: '最近又答错' },
  ];

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function clamp(n, min = 0, max = 100) {
    return Math.max(min, Math.min(max, n));
  }

  /* questionId 形如 `bookId|wordId|type` */
  function parseId(questionId) {
    const parts = String(questionId || '').split('|');
    return { bookId: parts[0] || '', wordId: parts[1] || '', type: parts[2] || 'en2zh' };
  }

  /* 把作答记录按「单词」聚合成组，组内按时间正序 */
  function groupWords(records) {
    const map = new Map();
    records.forEach((rec) => {
      const p = parseId(rec.questionId);
      if (!p.wordId) return;
      const key = `${p.bookId}:${p.wordId}`;
      let g = map.get(key);
      if (!g) {
        g = { key, bookId: p.bookId, wordId: p.wordId, items: [] };
        map.set(key, g);
      }
      g.items.push({ ...rec, type: p.type });
    });
    map.forEach((g) => g.items.sort((a, b) => (a.ts || 0) - (b.ts || 0)));
    return [...map.values()];
  }

  /* 单个单词落在哪一层 */
  function classify(g) {
    const items = g.items;
    if (!items.length) return 'stable'; // 手动标记「认识」且没做过题的词
    const last = items[items.length - 1];
    if (!last.isCorrect) return 'slipping';
    let streak = 0;
    for (let i = items.length - 1; i >= 0 && items[i].isCorrect; i--) streak += 1;
    return streak >= 2 ? 'stable' : 'consolidating';
  }

  /* ---------------- 记忆分层 ---------------- */
  function buildLayers(bookId) {
    const groups = groupWords(Store.getRecords()).filter((g) => g.bookId === bookId);
    const mastery = Store.getMastery();
    const list = groups.map((g) => ({ ...g, layer: classify(g) }));

    // 手动标记为「认识」但还没做过题的词，也算进了稳定区
    const seen = new Set(groups.map((g) => g.wordId));
    getBookWords(bookId).forEach((w) => {
      const key = Store.masteryKey(bookId, w.id);
      if (!seen.has(w.id) && mastery[key] === 'known') {
        list.push({ key, bookId, wordId: w.id, items: [], layer: 'stable' });
      }
    });

    const counts = { stable: 0, consolidating: 0, slipping: 0 };
    list.forEach((d) => { counts[d.layer] += 1; });
    return { counts, total: list.length };
  }

  /* ---------------- 薄弱雷达 ---------------- */
  function accuracyOf(items, filter) {
    const target = filter ? items.filter(filter) : items;
    if (!target.length) return null;
    return (target.filter((i) => i.isCorrect).length / target.length) * 100;
  }

  function buildRadar(bookId) {
    const groups = groupWords(Store.getRecords()).filter((g) => g.bookId === bookId);
    const all = groups.flatMap((g) => g.items);
    const overall = accuracyOf(all);
    const fallback = overall == null ? 50 : overall;

    const en2zh = accuracyOf(all, (i) => ['en2zh', 'def2word', 'word2def'].includes(i.type));
    const zh2en = accuracyOf(all, (i) => i.type === 'zh2en');

    // 含易混词的单词作答，作为「搭配 / 辨析」的观测样本
    const confusableItems = groups
      .filter((g) => {
        const w = findWord(g.wordId);
        return w && Array.isArray(w.confusables) && w.confusables.length;
      })
      .flatMap((g) => g.items);

    // 完形：作答越慢，说明越依赖语境慢慢推断
    const slowRate = all.length ? all.filter((i) => (i.durationMs || 0) > 10000).length / all.length : 0;

    const scores = {
      meaning: en2zh == null ? fallback : en2zh,
      collocation: accuracyOf(confusableItems) == null ? fallback : accuracyOf(confusableItems),
      cloze: all.length ? clamp((1 - slowRate * 0.8) * 100, 20, 100) : 50,
      spelling: zh2en == null ? fallback : zh2en,
    };
    return { scores, hasData: all.length > 0 };
  }

  /* 雷达图 SVG（纯手绘，不引第三方图表库） */
  function radarSvg(scores) {
    const W = 250;
    const H = 205;
    const CX = 125;
    const CY = 100;
    const R = 58;

    const point = (angleDeg, value) => {
      const a = (angleDeg * Math.PI) / 180;
      const rad = (value / 100) * R;
      return [CX + Math.cos(a) * rad, CY + Math.sin(a) * rad];
    };

    const rings = [25, 50, 75, 100].map((k) => {
      const pts = DIMS.map((d) => point(d.angle, k).join(',')).join(' ');
      return `<polygon points="${pts}" fill="${k === 100 ? '#f7fcfb' : 'none'}" stroke="#e3f2ee" stroke-width="1"/>`;
    }).join('');

    const axes = DIMS.map((d) => {
      const [x, y] = point(d.angle, 100);
      return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="#e3f2ee" stroke-width="1"/>`;
    }).join('');

    const shape = DIMS.map((d) => point(d.angle, clamp(scores[d.key])).join(',')).join(' ');

    const dots = DIMS.map((d) => {
      const [x, y] = point(d.angle, clamp(scores[d.key]));
      return `<circle cx="${x}" cy="${y}" r="3" fill="#158a7c"/>`;
    }).join('');

    const labels = DIMS.map((d) => {
      const [x, y] = point(d.angle, 160);
      const anchor = d.angle === -90 || d.angle === 90 ? 'middle' : (d.angle === 0 ? 'start' : 'end');
      const dy = d.angle === -90 ? -3 : (d.angle === 90 ? 10 : 3.5);
      return `<text x="${x}" y="${y + dy}" text-anchor="${anchor}" font-size="10" fill="#7b918d">${d.label} ${Math.round(clamp(scores[d.key]))}</text>`;
    }).join('');

    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="薄弱雷达图">
      ${rings}${axes}
      <polygon points="${shape}" fill="rgba(34,171,152,0.18)" stroke="#22ab98" stroke-width="1.6" stroke-linejoin="round"/>
      ${dots}${labels}
    </svg>`;
  }

  /* ---------------- 记忆风格标签 ---------------- */
  function buildTags() {
    const groups = groupWords(Store.getRecords());
    const items = groups.flatMap((g) => g.items);
    const tags = [];

    if (!items.length) {
      return [{ name: '观察期', desc: '样本还太少，多练几题后这里会长出你的记忆画像。', tone: 'neutral' }];
    }

    const wrongs = items.filter((i) => !i.isCorrect);
    const confusableWrong = groups
      .filter((g) => {
        const w = findWord(g.wordId);
        return w && Array.isArray(w.confusables) && w.confusables.length;
      })
      .flatMap((g) => g.items)
      .filter((i) => !i.isCorrect).length;

    if (wrongs.length >= 3 && confusableWrong / wrongs.length >= 0.4) {
      tags.push({ name: '辨析困难型', desc: '错的多是意思相近的词，建议把易混词成对比较着记。', tone: 'warn' });
    }

    const en2zh = accuracyOf(items, (i) => i.type === 'en2zh');
    const zh2en = accuracyOf(items, (i) => i.type === 'zh2en');
    if (en2zh != null && zh2en != null && en2zh - zh2en >= 15) {
      tags.push({ name: '拼写薄弱型', desc: '看见英文能认，反过来拼写时容易卡住。', tone: 'warn' });
    }

    let retested = 0;
    let relapse = 0;
    groups.forEach((g) => {
      if (g.items.length < 2) return;
      retested += 1;
      if (g.items.some((it, idx) => it.isCorrect && g.items.slice(idx + 1).some((n) => !n.isCorrect))) {
        relapse += 1;
      }
    });
    if (retested >= 3 && relapse / retested >= 0.35) {
      tags.push({ name: '短时记忆型', desc: '当场记得住，隔一阵会模糊，复习间隔可以拉长再回想。', tone: 'warn' });
    }

    const slowRate = items.filter((i) => (i.durationMs || 0) > 10000).length / items.length;
    if (items.length >= 5 && slowRate >= 0.45) {
      tags.push({ name: '语境依赖型', desc: '需要多想一会儿才能确认，适合放进句子里记。', tone: 'warn' });
    }

    if (!tags.length) {
      tags.push({ name: '稳健记忆型', desc: '错误分布比较均匀，遗忘曲线平稳，保持现在的节奏就好。', tone: 'good' });
    }
    return tags.slice(0, 3);
  }

  /* ---------------- 记忆收藏墙 ---------------- */
  function buildWall(bookId) {
    const groups = groupWords(Store.getRecords())
      .filter((g) => g.bookId === bookId)
      .filter((g) => g.items.length >= 2 && classify(g) === 'stable');

    return groups
      .sort((a, b) => b.items.length - a.items.length)
      .slice(0, 6)
      .map((g) => {
        const w = findWord(g.wordId) || {};
        const firstWrong = g.items.find((i) => !i.isCorrect);
        return {
          word: w.word || g.wordId,
          phonetic: w.phonetic || '',
          meaning: w.meaning || '',
          retests: g.items.length,
          firstWrong: firstWrong && firstWrong.wrongChoice ? firstWrong.wrongChoice : '',
          confusable: (w.confusables && w.confusables[0]) || '',
        };
      });
  }

  /* ---------------- 学习小结 ----------------
   * 不统计刷题数量，只描述「哪些易忘的词变稳了、哪块薄弱被补到」
   */
  function buildSummary(bookId) {
    const todayStart = Store.startOfToday();
    const records = Store.getRecords();
    const groups = groupWords(records);
    const todayItems = records.filter((r) => (r.ts || 0) >= todayStart);

    if (!todayItems.length) {
      return ['今天还没有新的记忆痕迹。哪怕只记住一个词，也是往前走了一步。'];
    }

    const consolidated = [];
    groups.forEach((g) => {
      const today = g.items.filter((i) => (i.ts || 0) >= todayStart);
      if (!today.length) return;
      const wrongBefore = g.items.some((i) => (i.ts || 0) < todayStart && !i.isCorrect);
      const correctToday = today.some((i) => i.isCorrect);
      if (wrongBefore && correctToday) consolidated.push(g);
    });

    const lines = [];
    if (consolidated.length) {
      const names = consolidated.slice(0, 3).map((g) => {
        const w = findWord(g.wordId);
        return w ? w.word : g.wordId;
      });
      const more = consolidated.length > 3 ? ' …' : '';
      lines.push(`今天把 ${consolidated.length} 个容易溜走的词重新拉稳：${names.join('、')}${more}。`);
    } else {
      lines.push('今天还没有翻盘的易忘词，重点是把新词第一次就记牢。');
    }

    const radar = buildRadar(bookId);
    const weakest = DIMS.reduce((a, b) => (radar.scores[a.key] <= radar.scores[b.key] ? a : b));
    lines.push(`目前最需要补的是「${weakest.label}」，把握度约 ${Math.round(radar.scores[weakest.key])} 分，练习会往这里多给题。`);

    const layers = buildLayers(bookId);
    if (layers.counts.stable) {
      lines.push(`已经有 ${layers.counts.stable} 个词进入稳定区，它们才是今天真正的收获。`);
    } else {
      lines.push('稳定区还空着，先让几个词连续两次答对，就算真正留住。');
    }
    return lines;
  }

  /* ---------------- 渲染：词书首页 ---------------- */
  function currentBookId() {
    const user = Store.getUser();
    return (user && user.wordbook) || 'zk';
  }

  function renderHome() {
    const bookId = currentBookId();
    const layers = buildLayers(bookId);
    const radar = buildRadar(bookId);

    const bar = document.getElementById('memory-layer-bar');
    if (bar) {
      if (!layers.total) {
        bar.innerHTML = '<div class="h-full w-full rounded-full bg-brand-50"></div>';
      } else {
        bar.innerHTML = LAYERS.map((l) => {
          const w = (layers.counts[l.key] / layers.total) * 100;
          return `<div class="h-full" style="width:${w}%;background:${l.color}"></div>`;
        }).join('');
      }
    }

    const list = document.getElementById('memory-layer-list');
    if (list) {
      list.innerHTML = LAYERS.map((l) => `
        <div class="rounded-2xl border border-brand-50 bg-paper p-3">
          <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full" style="background:${l.color}"></span>
            <p class="text-[11px] text-muted">${l.label}</p>
          </div>
          <p class="mt-1 text-lg font-semibold" style="color:${l.color}">${layers.counts[l.key]}<span class="ml-1 text-[10px] font-normal text-muted">词</span></p>
        </div>`).join('');
    }

    const radarBox = document.getElementById('memory-radar');
    if (radarBox) {
      radarBox.innerHTML = radarSvg(radar.scores);
    }

    const radarNote = document.getElementById('memory-radar-note');
    if (radarNote) {
      radarNote.textContent = radar.hasData
        ? '习题推荐基于你的薄弱和遗忘状态：越靠里，说明这块越需要补。'
        : '还没有作答数据，雷达会随着练习慢慢长出来。';
    }
  }

  /* ---------------- 渲染：我的页面 ---------------- */
  function renderMe() {
    // ★ 记忆分层与薄弱雷达已移至「我的」页，复用同一套渲染
    renderHome();
    const bookId = currentBookId();

    const tagBox = document.getElementById('memory-tags');
    if (tagBox) {
      tagBox.innerHTML = buildTags().map((t) => {
        const cls = t.tone === 'warn'
          ? 'bg-amber-50 text-amber-700'
          : (t.tone === 'good' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600');
        return `<span class="rounded-full px-3 py-1 text-[11px] font-medium ${cls}">${esc(t.name)}</span>`;
      }).join('');
    }

    const tagNote = document.getElementById('memory-tags-note');
    if (tagNote) {
      tagNote.textContent = buildTags().map((t) => t.desc).join(' ');
    }

    const wall = buildWall(bookId);
    const wallCount = document.getElementById('memory-wall-count');
    if (wallCount) wallCount.textContent = `${wall.length} 个`;
    const wallBox = document.getElementById('memory-wall');
    if (wallBox) {
      if (!wall.length) {
        wallBox.innerHTML = `<div class="col-span-2 rounded-2xl bg-paper p-4 text-center">
          <p class="text-xs text-muted">墙上还没有词</p>
          <p class="mt-1 text-[11px] text-muted">同一个单词连续两次答对，就会被挂上来</p>
        </div>`;
      } else {
        wallBox.innerHTML = wall.map((w) => `
          <div class="rounded-2xl bg-paper p-3">
            <div class="flex items-baseline justify-between">
              <p class="text-sm font-semibold text-ink">${esc(w.word)}</p>
              <span class="text-[10px] text-brand-600">复测 ${w.retests} 次</span>
            </div>
            ${w.phonetic ? `<p class="mt-0.5 text-[10px] text-muted">${esc(w.phonetic)}</p>` : ''}
            <p class="mt-1 text-[11px] leading-snug text-ink/80">${esc(w.meaning)}</p>
            ${w.firstWrong ? `<p class="mt-1.5 text-[10px] text-rose-400">当初错选：${esc(w.firstWrong)}</p>` : ''}
            ${w.confusable ? `<p class="text-[10px] text-muted">易混：${esc(w.confusable)}</p>` : ''}
          </div>`).join('');
      }
    }

    const summaryBox = document.getElementById('memory-summary');
    if (summaryBox) {
      summaryBox.innerHTML = buildSummary(bookId).map((line) => `<p>${esc(line)}</p>`).join('');
    }
  }

  return { renderHome, renderMe };
})();
