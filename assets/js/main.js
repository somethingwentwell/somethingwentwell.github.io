/* Warren Wong — personal site interactions. No dependencies. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;

  /* ── marquee: duplicate the logo set so the -50% scroll loops seamlessly ── */
  const track = $('.marquee__track');
  if (track) {
    [...track.children].forEach((li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.append(c);
    });
  }

  /* ── year ── */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── split the profile paragraph into words for the scroll "read-along" ── */
  const split = $('[data-split]');
  if (split) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(split);
  }
  const words = split ? $$('.w', split) : [];

  /* ── reveal on scroll ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .job, .bento__cell, .side-card').forEach((el) => io.observe(el));

  /* ── scroll-linked: progress bar, nav, timeline rail, read-along, active link ── */
  const nav = $('.nav');
  const rail = $('.timeline__rail span');
  const timeline = $('.timeline');
  const links = $$('.nav__links a[href^="#"]');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, vh = innerHeight;
    const max = document.body.scrollHeight - vh;
    root.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle('is-scrolled', y > 24);

    if (timeline && rail) {
      const r = timeline.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      rail.parentElement.style.setProperty('--tp', t.toFixed(4));
    }

    if (words.length) {
      const r = split.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = reduced ? words.length : Math.round(t * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }

    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top < vh * 0.4) current = s; });
    links.forEach((a) => a.classList.toggle('is-active', current && a.getAttribute('href') === '#' + current.id));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ── cursor glow + per-card spotlight ── */
  if (finePointer) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', (e) => {
      glow.style.setProperty('--mx', e.clientX + 'px');
      glow.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
    $$('.spotlight').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', e.clientX - r.left + 'px');
        el.style.setProperty('--sy', e.clientY - r.top + 'px');
      });
    });
  }

  /* ── portrait 3D tilt ── */
  const tilt = $('.tilt');
  if (tilt && finePointer && !reduced) {
    tilt.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tilt.style.setProperty('--ry', (x - 0.5) * 14 + 'deg');
      tilt.style.setProperty('--rx', (0.5 - y) * 14 + 'deg');
      tilt.style.setProperty('--gx', x * 100 + '%');
      tilt.style.setProperty('--gy', y * 100 + '%');
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
  }

  /* ── magnetic buttons ── */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach((el) => {
      el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1), border-color .3s, color .3s';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  /* ── text scramble cycling through phrases ── */
  const scr = $('.scramble');
  if (scr && !reduced) {
    const phrases = JSON.parse(scr.dataset.phrases);
    const glyphs = '!<>-_\\/[]{}—=+*^?#01';
    let idx = 0;
    const scramble = (to) => new Promise((done) => {
      const from = scr.textContent;
      const len = Math.max(from.length, to.length);
      const q = Array.from({ length: len }, (_, i) => {
        const start = Math.floor(Math.random() * 18), end = start + Math.floor(Math.random() * 22) + 6;
        return { from: from[i] || '', to: to[i] || '', start, end, ch: '' };
      });
      let f = 0;
      const tick = () => {
        let out = '', complete = 0;
        q.forEach((c) => {
          if (f >= c.end) { complete++; out += c.to; }
          else if (f >= c.start) {
            if (!c.ch || Math.random() < 0.28) c.ch = glyphs[Math.floor(Math.random() * glyphs.length)];
            out += `<span class="glyph">${c.ch}</span>`;
          } else out += c.from;
        });
        scr.innerHTML = out;
        if (complete === q.length) done(); else { f++; requestAnimationFrame(tick); }
      };
      tick();
    });
    const loop = async () => {
      await new Promise((r) => setTimeout(r, 3200));
      idx = (idx + 1) % phrases.length;
      await scramble(phrases[idx]);
      loop();
    };
    setTimeout(() => scramble(phrases[0]).then(loop), 900);
  }

  /* ── stat counters ── */
  const counters = $$('[data-count]');
  if (!reduced) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, target = +el.dataset.count, suf = el.dataset.suffix || '';
        const t0 = performance.now(), dur = 1600;
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(target * eased) + suf;
          if (k < 1) requestAnimationFrame(step);
        };
        el.textContent = '0' + suf;
        setTimeout(() => requestAnimationFrame(step), 700);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  }

  /* ── copy + print + toast ── */
  const toast = $('.toast');
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); say('Copied — ' + b.dataset.copy); }
    catch { say(b.dataset.copy); }
  }));
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => {
    $$('.reveal').forEach((el) => el.classList.add('is-in'));
    print();
  }));

  /* ── hero field: an "evolving" node graph ──
     Nodes drift, link to neighbours, lean toward the cursor, and every so
     often one "mutates" — a mint pulse that propagates along its edges. */
  const canvas = $('.hero__field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, nodes = [], pulses = [], running = true, raf;
  const mouse = { x: -9999, y: -9999 };
  const LINK = 140;

  const build = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (W * H) / 12000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.6, heat: 0,
    }));
  };

  const mutate = () => {
    const n = nodes[Math.floor(Math.random() * nodes.length)];
    if (n) { n.heat = 1; pulses.push({ n, t: 0 }); }
  };

  const frame = () => {
    ctx.clearRect(0, 0, W, H);
    for (const n of nodes) {
      const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
      if (d < 200 && d > 1) { n.vx += (dx / d) * 0.012; n.vy += (dy / d) * 0.012; }
      n.vx *= 0.985; n.vy *= 0.985;
      n.vx += (Math.random() - 0.5) * 0.01; n.vy += (Math.random() - 0.5) * 0.01;
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      n.heat *= 0.975;
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > LINK) continue;
        const heat = Math.max(a.heat, b.heat);
        const alpha = (1 - d / LINK) * (0.24 + heat * 0.6);
        ctx.strokeStyle = heat > 0.05 ? `rgba(93,242,196,${alpha})` : `rgba(200,220,215,${alpha * 0.8})`;
        ctx.lineWidth = heat > 0.05 ? 1 : 0.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        // spread the mutation to neighbours
        if (a.heat > 0.6 && b.heat < a.heat * 0.7) b.heat = Math.max(b.heat, a.heat * 0.72);
        else if (b.heat > 0.6 && a.heat < b.heat * 0.7) a.heat = Math.max(a.heat, b.heat * 0.72);
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = n.heat > 0.05 ? `rgba(93,242,196,${0.5 + n.heat * 0.5})` : 'rgba(220,232,228,.6)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + n.heat * 2, 0, Math.PI * 2); ctx.fill();
    }
    pulses = pulses.filter((p) => {
      p.t += 0.018;
      ctx.strokeStyle = `rgba(93,242,196,${(1 - p.t) * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.n.x, p.n.y, p.t * 60, 0, Math.PI * 2); ctx.stroke();
      return p.t < 1;
    });
    if (Math.random() < 0.012) mutate();
    if (running) raf = requestAnimationFrame(frame);
  };

  build();
  if (reduced) { running = false; frame(); return; }
  frame();
  setTimeout(mutate, 1200);

  canvas.parentElement.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  canvas.parentElement.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    let best = null, bd = Infinity;
    for (const n of nodes) { const d = Math.hypot(n.x - mouse.x, n.y - mouse.y); if (d < bd) { bd = d; best = n; } }
    if (best) { best.heat = 1; pulses.push({ n: best, t: 0 }); }
  });
  let rt, onScreen = true;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  // pause the loop while the hero is scrolled away or the tab is hidden
  const sync = () => {
    const vis = onScreen && !document.hidden;
    if (vis && !running) { running = true; frame(); }
    else if (!vis && running) { running = false; cancelAnimationFrame(raf); }
  };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener('visibilitychange', sync);
})();
