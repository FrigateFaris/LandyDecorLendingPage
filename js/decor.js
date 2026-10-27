// Landy Decor — сцены на прокрутке и интерактив.
// GSAP + ScrollTrigger — сцены, Lenis — плавная прокрутка. Без библиотек или при «уменьшении движения»
// страница остаётся статичной и полностью рабочей (видео, панели, ролики, заявка).

(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  initHeroVideo();
  initVideos();
  initTones();
  initCountdown();
  initAccordion();
  initReels();
  initTalk();
  initForm();
  initGridToggle();
  if (!hasGsap || reduce) { initPlainLinks(); return; }

  root.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);

  // ---------- Плавная прокрутка и якоря ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
  };
  document.querySelectorAll('[data-to]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollToEl(a.dataset.to); }));

  // ---------- Шапка и полоса прогресса ----------
  const hdr = document.getElementById('hdr');
  let lastY = 0;
  const onScroll = y => {
    hdr.classList.toggle('solid', y > 60);
    hdr.classList.toggle('hide', y > lastY && y > innerHeight * 0.8);
    lastY = y;
  };
  lenis ? lenis.on('scroll', e => onScroll(e.scroll)) : addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // ---------- 1. Первый экран: после заставки ----------
  const LOADER_END = 1.7;
  gsap.fromTo('.intro-frame', { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, duration: 3, ease: 'power2.out', delay: LOADER_END - 0.3 });
  gsap.fromTo('.intro-caption .eyebrow, .intro-caption h1, .hero-actions, .hero-card, .hero-bar', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: LOADER_END + 0.2 });
  gsap.fromTo('.hero-thumbs a', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 1, ease: 'expo.out', stagger: 0.08, delay: LOADER_END + 0.8 });
  gsap.fromTo('.intro-meta', { opacity: 0 }, { opacity: 1, duration: 1, delay: LOADER_END + 0.5 });
  // уход первого экрана: текст поднимается и гаснет. Видео не сдвигаем — иначе его мягкий нижний край
  // обрезается границей экрана и получается резкая линия перед манифестом.
  gsap.to('.intro-caption, .intro-meta', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.intro', start: '30% top', end: 'bottom top', scrub: true } });

  // ---------- Заголовки секций: слова поднимаются из-под маски ----------
  document.querySelectorAll('main h2:not(.chapter h2), .acc-body h3, .step h4, .det h4').forEach(h => {
    const words = splitWords(h, 'mask');
    gsap.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.045, scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
  });
  ScrollTrigger.batch('main .eyebrow', { start: 'top 92%', once: true, onEnter: els => els.forEach((el, i) => setTimeout(() => el.classList.add('drawn'), i * 80)) });

  // ---------- 2. Манифест: слова проявляются, цифры считаются ----------
  document.querySelectorAll('[data-split]').forEach(el => {
    gsap.fromTo(splitWords(el), { opacity: 0.12 }, { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });
  document.querySelectorAll('[data-num]').forEach(b => {
    const to = +b.dataset.num, from = to > 1000 ? to - 12 : 0, o = { v: from };
    gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v); }, scrollTrigger: { trigger: b, start: 'top 88%', once: true } });
  });

  // ---------- 3. Работы: горизонтальная плёнка ----------
  const track = document.querySelector('.h-track');
  const dist = () => Math.max(track.scrollWidth - innerWidth, 0);
  const countEl = document.querySelector('.h-count b');
  const cards = gsap.utils.toArray('.h-card');
  const hTween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.works', start: 'top top', end: () => '+=' + dist(), pin: '.works-pin', scrub: 1, invalidateOnRefresh: true,
      onUpdate: self => { countEl.textContent = String(Math.min(cards.length, Math.round(self.progress * (cards.length - 1)) + 1)).padStart(2, '0'); }
    }
  });
  cards.forEach(card => {
    // ±5% от ширины фото (124% карточки) = ±6.2% карточки — меньше запаса в 12%, края фото не видны
    gsap.fromTo(card.querySelector('.h-img > *'), { xPercent: 5 }, { xPercent: -5, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
    gsap.fromTo(card, { scale: 0.86, opacity: 0.4 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left 100%', end: 'left 55%', scrub: true } });
  });

  // ---------- 4. Кино-сцена «день → вечер»: вечер шторкой закрывает день, кадр раскрывается, боковые кадры разлетаются ----------
  const frame = document.querySelector('.cine-frame');
  // стартовая ширина кадра = 6 колонок сетки (на телефоне — 62% экрана)
  const startScale = () => {
    if (innerWidth <= 900) return 0.62;
    const g = document.querySelector('.cine-words'), cs = getComputedStyle(g);
    const inner = g.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), gap = parseFloat(cs.columnGap);
    return Math.min(1, ((inner - 11 * gap) / 12 * 6 + gap * 5) / innerWidth);
  };
  gsap.timeline({ scrollTrigger: { trigger: '.cine', start: 'top top', end: '+=240%', pin: '.cine-pin', scrub: 1, invalidateOnRefresh: true } })
    .set(frame, { scale: startScale, borderRadius: 24 }, 0)
    // 1) день → вечер: ночное видео выезжает поверх дневного фото, боковые кадры плывут навстречу
    .fromTo('.cine-night', { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 0.6 }, 0)
    .to('.ct-day', { opacity: 0, duration: 0.15 }, 0.3)
    .fromTo('.ct-night', { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.42)
    .fromTo('.cs-l', { y: 0 }, { y: '-6vh', ease: 'none', duration: 0.6 }, 0)
    .fromTo('.cs-r', { y: 0 }, { y: '6vh', ease: 'none', duration: 0.6 }, 0)
    // 2) кадр раскрывается на весь экран, слова и боковые кадры разлетаются в разные стороны
    .fromTo(frame, { scale: startScale, borderRadius: 24 }, { scale: 1, borderRadius: 0, ease: 'power2.inOut', duration: 1, immediateRender: false }, 0.65)
    .to('.cw-l', { xPercent: -40, opacity: 0, ease: 'power2.in', duration: 0.7 }, 0.7)
    .to('.cw-r', { xPercent: 40, opacity: 0, ease: 'power2.in', duration: 0.7 }, 0.7)
    .to('.cs-l', { x: '-45vw', y: '30vh', rotation: -10, opacity: 0, ease: 'power2.in', duration: 0.75 }, 0.68)
    .to('.cs-r', { x: '45vw', y: '-30vh', rotation: 10, opacity: 0, ease: 'power2.in', duration: 0.75 }, 0.68)
    .to('.ct-night', { opacity: 0, duration: 0.2 }, 1.35)
    .fromTo('.cine-shade', { opacity: 0.2 }, { opacity: 1, duration: 0.5 }, 1.1)
    .fromTo('.cine-cap > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' }, 1.45);

  // ---------- 5. История: смена сцен ----------
  const scenes = document.querySelectorAll('.sm-img');
  const yearEl = document.querySelector('[data-year]');
  const navItems = document.querySelectorAll('.story-nav span');
  document.querySelectorAll('.chapter').forEach(ch => {
    ScrollTrigger.create({
      trigger: ch, start: 'top 55%', end: 'bottom 55%',
      onToggle: self => {
        if (!self.isActive) return;
        const i = ch.dataset.scene;
        scenes.forEach(s => s.classList.toggle('is-active', s.dataset.scene === i));
        navItems.forEach(n => n.classList.toggle('is-active', n.dataset.nav === i));
        if (i !== '2') window.__talkPause && window.__talkPause();
        if (yearEl.textContent !== ch.dataset.year) {
          gsap.timeline()
            .to(yearEl, { yPercent: -110, duration: 0.35, ease: 'power2.in' })
            .add(() => { yearEl.textContent = ch.dataset.year; })
            .fromTo(yearEl, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
        }
      }
    });
    gsap.fromTo(ch.querySelectorAll('.eyebrow, h2, p, .sign'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: ch, start: 'top 70%' } });
  });

  // ---------- 7. Панели услуг: выезжают по очереди ----------
  gsap.fromTo('.acc-item', { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.acc', start: 'top 85%', once: true } });

  // ---------- 8. Ролики: лента въезжает сбоку ----------
  gsap.fromTo('.reel', { opacity: 0, x: 120 }, { opacity: 1, x: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.reel-row', start: 'top 85%', once: true } });

  // ---------- 9–10. Кадры процесса и деталей: шторка + наезд, внутри — параллакс ----------
  gsap.utils.toArray('[data-reveal-img]').forEach((box, i) => {
    const inner = box.querySelector('img, video');
    gsap.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', delay: (i % 3) * 0.12, scrollTrigger: { trigger: box, start: 'top 88%', once: true } });
    if (inner) gsap.fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', delay: (i % 3) * 0.12, scrollTrigger: { trigger: box, start: 'top 88%', once: true } });
  });

  // ---------- 11. Заявка ----------
  gsap.fromTo('.faq details, .contact-cards a', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.fin', start: 'top 75%', once: true } });
  gsap.fromTo('.lead', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.fin', start: 'top 75%', once: true } });

  // ---------- Подвал: LANDY·DECOR по буквам ----------
  const big = document.querySelector('.ftr-big');
  big.innerHTML = [...big.textContent].map(ch => `<span class="lt">${ch}</span>`).join('');
  gsap.fromTo(big.querySelectorAll('.lt'), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: '.ftr', start: 'top 85%', once: true } });

  // ---------- Мелкие элементы: мягко поднимаются группами ----------
  gsap.set('[data-r]', { opacity: 0, y: 40 });
  ScrollTrigger.batch('[data-r]', { start: 'top 92%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09 }) });

  // ---------- Кнопки слегка тянутся за курсором ----------
  if (finePointer) document.querySelectorAll('.btn, .arr').forEach(btn => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
    btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });

  addEventListener('load', () => ScrollTrigger.refresh());

  function splitWords(el, mode) {
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span');
          if (mode === 'mask') { s.className = 'wm'; const i = document.createElement('span'); i.className = 'wi'; i.textContent = part; s.appendChild(i); out.push(i); }
          else { s.className = 'w'; s.textContent = part; out.push(s); }
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
    return out;
  }
})();

// ---------- Якоря без плавной прокрутки ----------
function initPlainLinks() {
  document.querySelectorAll('[data-to]').forEach(a => a.addEventListener('click', e => {
    const el = document.querySelector(a.dataset.to);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
  }));
}

// ---------- Видео первого экрана: горизонтальная нарезка для компьютера, вертикальная — для телефона ----------
function initHeroVideo() {
  const v = document.querySelector('video.hero-vid');
  if (!v) return;
  const portrait = matchMedia('(max-aspect-ratio: 4/5)').matches;
  if (portrait) {
    v.poster = v.dataset.mobPoster;
    const img = document.querySelector('.intro-poster');
    if (img) img.src = v.dataset.mobPoster;
  }
  v.src = portrait ? v.dataset.mob : v.dataset.desk;
  const go = () => v.play().catch(() => {});
  go();
  v.addEventListener('canplay', go, { once: true });
  addEventListener('load', go, { once: true });
  ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(ev => addEventListener(ev, go, { once: true, passive: true }));
}

// ---------- Видео-петли: грузим и играем, только когда видны ----------
function initVideos() {
  const vids = document.querySelectorAll('video.vid');
  const start = v => { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.play().catch(() => {}); };
  if (!('IntersectionObserver' in window)) { vids.forEach(start); return; }
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start(e.target) : e.target.pause()), { rootMargin: '200px 0px' });
  vids.forEach(v => io.observe(v));
}

// ---------- Общий фон: тон берётся у секции, которая пересекает середину экрана ----------
function initTones() {
  const secs = document.querySelectorAll('[data-tone]:not(body)');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) document.body.dataset.tone = e.target.dataset.tone; }), { rootMargin: '-50% 0px -50% 0px' });
  secs.forEach(s => io.observe(s));
  // огни на паузе, когда бархатного тона нет на экране
  new MutationObserver(() => document.body.classList.toggle('paused', document.body.dataset.tone !== 'velvet')).observe(document.body, { attributes: true, attributeFilter: ['data-tone'] });
}

// ---------- Отсчёт до Нового года (Ташкент, UTC+5) ----------
function initCountdown() {
  const counters = document.querySelectorAll('[data-countdown]');
  if (!counters.length) return;
  const year = new Date(Date.now() + 5 * 3600e3).getUTCFullYear() + 1;
  const target = Date.UTC(year, 0, 1) - 5 * 3600e3;
  const pad = n => String(n).padStart(2, '0');
  const render = () => {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    counters.forEach(c => {
      const set = (sel, v) => { const b = c.querySelector(sel); if (b && b.textContent !== v) b.textContent = v; };
      set('[data-d]', String(Math.floor(s / 86400)));
      set('[data-h]', pad(Math.floor(s % 86400 / 3600)));
      set('[data-m]', pad(Math.floor(s % 3600 / 60)));
      set('[data-s]', pad(s % 60));
    });
  };
  render(); setInterval(render, 1000);
}

// ---------- Панели «Что оформляем»: наведение / нажатие раскрывает, пока блок на экране — листаются сами ----------
function initAccordion() {
  const acc = document.querySelector('.acc');
  if (!acc) return;
  const items = [...acc.querySelectorAll('.acc-item')];
  const open = it => items.forEach(x => x.classList.toggle('is-open', x === it));
  let touched = false, timer = null;
  const desktop = matchMedia('(min-width: 901px) and (hover: hover)').matches;
  items.forEach(it => {
    if (desktop) it.addEventListener('mouseenter', () => { touched = true; open(it); });
    it.addEventListener('click', () => { touched = true; open(it); });
    it.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); touched = true; open(it); } });
  });
  acc.addEventListener('mouseleave', () => { touched = false; });
  if (!desktop || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) timer = setInterval(() => {
      if (touched) return;
      const i = items.findIndex(x => x.classList.contains('is-open'));
      open(items[(i + 1) % items.length]);
    }, 4200);
  }, { threshold: 0.5 }).observe(acc);
}

// ---------- Ролики: наведение — превью без звука, клик — на весь экран ----------
function initReels() {
  const row = document.querySelector('.reel-row');
  if (!row) return;
  const reels = [...row.querySelectorAll('.reel')];
  const play = r => { const v = r.querySelector('video'); if (!v.src) v.src = r.dataset.src; v.play().then(() => r.classList.add('on')).catch(() => {}); };
  const stop = r => { r.querySelector('video').pause(); r.classList.remove('on'); };
  const hover = matchMedia('(hover: hover)').matches;
  if (hover) reels.forEach(r => { r.addEventListener('mouseenter', () => play(r)); r.addEventListener('mouseleave', () => stop(r)); });
  else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.intersectionRatio > 0.7 ? play(e.target) : stop(e.target)), { threshold: [0, 0.7, 1] });
    reels.forEach(r => io.observe(r));
  }
  // стрелки и перетаскивание мышью
  const step = () => reels[0].getBoundingClientRect().width + parseFloat(getComputedStyle(row).columnGap || 16);
  document.querySelectorAll('.arr').forEach(b => b.addEventListener('click', () => row.scrollBy({ left: step() * +b.dataset.dir * 2, behavior: 'smooth' })));
  let down = false, sx = 0, sl = 0, moved = false;
  row.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = row.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; row.classList.add('dragging'); } row.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; row.classList.remove('dragging'); });
  // окно на весь экран
  const lb = document.getElementById('lb'), lv = lb.querySelector('video');
  const close = () => { lv.pause(); lv.removeAttribute('src'); lv.load(); lb.hidden = true; document.documentElement.style.overflow = ''; };
  reels.forEach(r => r.addEventListener('click', e => {
    if (moved) { e.preventDefault(); moved = false; return; }
    stop(r); lb.hidden = false; document.documentElement.style.overflow = 'hidden';
    lv.src = r.dataset.src; lv.muted = false; lv.play().catch(() => {});
  }));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-close')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) close(); });
}

// ---------- Видео-обращение Нигины в истории ----------
function initTalk() {
  const scene = document.querySelector('.sm-talk');
  if (!scene) return;
  const v = scene.querySelector('video');
  const playTalk = () => {
    // на телефоне сцена скрыта — играем видео внутри главы
    if (!scene.offsetParent) { const m = document.querySelector('.chapter-talk video'); m && m.play(); return; }
    scene.classList.add('playing'); v.controls = true; v.muted = false; v.play().catch(() => {});
  };
  window.__talkPause = () => { if (!v.paused) v.pause(); };
  v.addEventListener('pause', () => scene.classList.remove('playing'));
  v.addEventListener('play', () => scene.classList.add('playing'));
  document.querySelectorAll('[data-talk]').forEach(b => b.addEventListener('click', playTalk));
}

// ---------- Заявка → тот же Google Apps Script, что и у Landy School ----------
function initForm() {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOMyCZAZD522SU1C0Ru19f2DAdRa_EFn78YkiFJ8kUB-JDhqaNykBwId73Ztb5WXfE/exec';
  const form = document.getElementById('leadForm');
  if (!form) return;
  const ok = document.getElementById('leadOk');
  const note = form.querySelector('#fnote');
  // «Обсудить такой проект» в панелях услуг подставляет объект в поле «Объект и сроки»
  document.querySelectorAll('[data-pick]').forEach(a => a.addEventListener('click', () => {
    if (!note.value.trim()) note.value = `Интересует: ${a.dataset.pick}`;
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.querySelector('#fname'), phone = form.querySelector('#fphone');
    let bad = false;
    [name, phone].forEach(i => { const empty = !i.value.trim(); i.classList.toggle('err', empty); bad = bad || empty; });
    if (bad) { (name.value.trim() ? phone : name).focus(); return; }
    const btn = form.querySelector('button[type="submit"]'), original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Отправляем...';
    fetch(SCRIPT_URL, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fname: name.value, fphone: phone.value, format: note.value.trim() || '—', source: 'Landy Decor' })
    })
      .then(() => { ok.classList.add('show'); form.reset(); })
      .catch(() => { btn.textContent = 'Ошибка. Попробуйте ещё раз'; })
      .finally(() => setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 2600));
  });
}

// ---------- G — показать / скрыть колонки сетки ----------
function initGridToggle() {
  addEventListener('keydown', e => {
    if (!['g', 'п'].includes(e.key.toLowerCase())) return;
    if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
    document.body.classList.toggle('show-grid');
  });
}
