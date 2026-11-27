// نسخ حيّة من نوافذ البرنامج: الأزرار تعمل كما في البرنامج قدر الإمكان (المحتوى تجريبي، لا ترجمة حقيقية)
(function () {
  var root = document.documentElement;
  function en() { return root.lang === "en"; }
  function L(ar, e) { return en() ? e : ar; }
  function $(id) { return document.getElementById(id); }
  function all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }

  // ----- اللغة: النص العربي في الصفحة، والإنجليزي في data-en -----
  function applyLang() {
    all(".app [data-en]").forEach(function (el) {
      if (!el.hasAttribute("data-ar")) el.setAttribute("data-ar", el.textContent);
      el.textContent = el.getAttribute(en() ? "data-en" : "data-ar");
    });
    all(".app [data-en-ph]").forEach(function (el) {
      if (!el.hasAttribute("data-ar-ph")) el.setAttribute("data-ar-ph", el.placeholder);
      el.placeholder = el.getAttribute(en() ? "data-en-ph" : "data-ar-ph");
    });
    if (otherKey) showOther(otherKey);
    if (!current) hint();
  }
  new MutationObserver(applyLang).observe(root, { attributes: true, attributeFilter: ["lang"] });

  // ======================================================== النافذة الرئيسية
  var SAMPLES = {
    ar: ["لا شيء مجاني. العمل الجاد والإصرار يمكن أن يغيّرا حياة الإنسان.", "اضغط أي زر للمتابعة.", "وجدت خريطة قديمة. هل تريد فتحها؟"],
    en: ["Nothing is free. Hard work and determination can change a person’s life.", "Press any key to continue.", "You found an old map. Do you want to open it?"],
    fr: ["Rien n’est gratuit. Le travail et la détermination peuvent changer une vie.", "Appuyez sur une touche pour continuer.", "Vous avez trouvé une vieille carte. Voulez-vous l’ouvrir ?"],
    es: ["Nada es gratis. El trabajo duro y la determinación pueden cambiar una vida.", "Pulsa cualquier tecla para continuar.", "Encontraste un mapa antiguo. ¿Quieres abrirlo?"]
  };
  var ORIG = ["Nothing is free. Hard work and determination can change a person’s life.", "Press any key to continue.", "You found an old map. Do you want to open it?"];
  var HEARD = {
    ar: ["أهلًا بكم جميعًا في البث المباشر.", "اليوم سنتعلم شيئًا جديدًا معًا.", "لا تنسوا الاشتراك في القناة."],
    en: ["Welcome, everyone, to the live stream.", "Today we’ll learn something new together.", "Don’t forget to subscribe to the channel."],
    fr: ["Bienvenue à tous dans le direct.", "Aujourd’hui, nous allons apprendre quelque chose de nouveau.", "N’oubliez pas de vous abonner."],
    es: ["Bienvenidos todos a la transmisión.", "Hoy aprenderemos algo nuevo juntos.", "No olviden suscribirse al canal."]
  };
  var out = $("mw-out"), status = $("mw-status"), src = $("mw-src"), dst = $("mw-dst");
  var idx = -1, current = "", showOrig = false, typing = 0, liveTimer = 0, audTimer = 0, heardIdx = 0;

  function say(text) { status.textContent = text; }
  function hint() {
    out.className = "mw-out hint"; out.dir = root.dir;
    out.textContent = L("حدّد منطقة من الشاشة لترجمتها، أو شغّل زر مباشر لترجمتها باستمرار، أو زر الصوت لترجمة ما تسمعه ودبلجته.",
                        "Select an area of the screen to translate it, turn on «Live» to keep translating it, or «Audio» to translate and dub what you hear.");
  }
  function type(text, rtl, done) {
    var my = ++typing, i = 0;
    out.className = "mw-out"; out.dir = rtl ? "rtl" : "ltr";
    (function step() {
      if (my !== typing) return;
      i = Math.min(text.length, i + 2);
      out.innerHTML = "";
      out.appendChild(document.createTextNode(text.slice(0, i)));
      if (i < text.length) { var c = document.createElement("span"); c.className = "caret"; out.appendChild(c); setTimeout(step, 22); }
      else if (done) done();
    })();
  }
  function translated(n) { return (SAMPLES[dst.value] || SAMPLES.ar)[n % 3]; }
  function show(n) {
    idx = n; current = showOrig ? ORIG[n % 3] : translated(n);
    type(current, !showOrig && dst.value === "ar", function () { say("✓ " + L("تُرجم", "Translated")); });
  }
  function stopLive() { clearInterval(liveTimer); liveTimer = 0; $("mw-live").classList.remove("on"); $("mw-live").setAttribute("aria-pressed", "false"); }
  function stopAudio() { clearInterval(audTimer); audTimer = 0; $("mw-aud").classList.remove("on"); $("mw-aud").setAttribute("aria-pressed", "false"); }

  $("mw-sel").onclick = function () {
    stopAudio();
    say(L("اسحب حول أي نص على الشاشة…", "Drag around any text on screen…"));
    setTimeout(function () { show(idx + 1); }, 450);
  };
  $("mw-live").onclick = function () {
    if (liveTimer) { stopLive(); say(L("توقف المباشر", "Live stopped")); return; }
    stopAudio();
    this.classList.add("on"); this.setAttribute("aria-pressed", "true");
    say(L("مباشر: يتابع المنطقة ويترجم كلما تغيّر النص", "Live: following the area, translating whenever the text changes"));
    show(idx + 1);
    liveTimer = setInterval(function () { show(idx + 1); }, 3200);
  };
  $("mw-aud").onclick = function () {
    if (audTimer) { stopAudio(); say(L("توقفت ترجمة الصوت", "Audio translation stopped")); return; }
    stopLive();
    this.classList.add("on"); this.setAttribute("aria-pressed", "true");
    function next() {
      var list = HEARD[dst.value] || HEARD.ar;
      current = list[heardIdx++ % list.length];
      say(L("يسمع صوت الجهاز ويترجم ويدبلج…", "Listening to your PC, translating and dubbing…"));
      type(current, dst.value === "ar");
    }
    next(); audTimer = setInterval(next, 3000);
  };
  var MODES = [["تلقائي", "Auto"], ["بالإنترنت", "Online"], ["بلا إنترنت", "Offline"]], mode = 0;
  $("mw-mode").onclick = function () {
    mode = (mode + 1) % 3;
    var s = this.querySelector("span"); s.setAttribute("data-ar", MODES[mode][0]); s.setAttribute("data-en", MODES[mode][1]);
    s.textContent = MODES[mode][en() ? 1 : 0];
    say(L("وضع العمل: ", "Work mode: ") + s.textContent);
  };
  $("mw-info").onclick = function () { $("start").scrollIntoView({ behavior: "smooth" }); };
  $("mw-gear").onclick = function () { $("tour").scrollIntoView({ behavior: "smooth" }); };
  $("mw-min").onclick = function () { say(L("في البرنامج: تُطوى النافذة إلى كرة صغيرة عائمة", "In the app: the window folds into a small floating bubble")); };
  $("mw-swap").onclick = function () {
    var a = src.value, b = dst.value;
    var okA = all("option", dst).some(function (o) { return o.value === a; }), okB = all("option", src).some(function (o) { return o.value === b; });
    this.classList.toggle("spin");
    if (okA && okB) { src.value = b; dst.value = a; if (idx >= 0) show(idx); }
  };
  dst.onchange = function () { if (idx >= 0) show(idx); };
  $("mw-eye").onclick = function () { if (idx < 0) return; showOrig = !showOrig; show(idx); };
  $("mw-erase").onclick = function () { typing++; stopLive(); stopAudio(); idx = -1; current = ""; showOrig = false; hint(); say(""); };
  $("mw-redo").onclick = function () { if (idx >= 0) show(idx); };
  $("mw-copy").onclick = function () {
    if (!current) return;
    try { navigator.clipboard.writeText(current); } catch (e) {}
    say(L("نُسخت ✓", "Copied ✓"));
  };

  // ======================================================== نافذة الإعدادات
  var hub = $("hub"), otherKey = "";
  var OTHER = {
    "o-history": ["كل ما ترجمته محفوظ هنا: ابحث فيه، وانسخه، واستمع إليه، وميّز ما يهمك بنجمة.", "Everything you translated: search it, copy it, listen to it, and star what matters."],
    "o-games": ["احفظ منطقة الترجمة لكل لعبة أو برنامج، وارجع إليها بضغطة.", "Save the translation area for each game or app, and come back to it in one click."],
    "o-dict": ["كلمات تختار ترجمتها بنفسك، ونطق خاص للأسماء في الدبلجة.", "Words you translate your own way, and custom pronunciation for names in dubbing."],
    "o-guide": ["شرح كل أداة وكل إعداد، مع البحث.", "How every tool and setting works, with search."],
    "o-general": ["اللغتان، وأين تظهر الترجمة (فوق النص، أو في شريط، أو الاثنان)، والبقاء فوق كل النوافذ.", "Your two languages, where the translation shows (over the text, in a bar, or both), and staying on top."],
    "o-trans": ["خدمات الترجمة وترتيبها، والترجمة بلا إنترنت، وما يُرسل إلى الإنترنت.", "Translation services and their order, offline translation, and what goes online."],
    "o-read": ["قارئ النص (ويندوز أو Tesseract) ودقته، وتجاهل النص الذي لم يتغير.", "The text reader (Windows or Tesseract), its accuracy, and skipping unchanged text."],
    "o-look": ["فاتح أو داكن أو حسب ويندوز، وشكل شريط الترجمة، ووضع التعلم.", "Light, dark or follow Windows, the subtitle bar’s look, and learning mode."],
    "o-addons": ["لغات القراءة، ونماذج فهم الكلام، والأصوات والترجمة بلا إنترنت: نزّل ما تحتاجه فقط.", "Reading languages, speech models, voices and offline translation: download only what you need."],
    "o-sys": ["التشغيل مع ويندوز، والتحديثات، والسجل، وإعادة الضبط.", "Start with Windows, updates, the log, and reset."],
    "o-support": ["أرسل مشكلة أو فكرة، وطرق دعم البرنامج.", "Send a problem or an idea, and ways to support the app."]
  };
  function showOther(key) {
    var item = hub.querySelector('[data-go="' + key + '"] span');
    $("other-title").textContent = item ? item.textContent : "";
    $("other-desc").textContent = OTHER[key][en() ? 1 : 0];
  }
  function go(key) {
    var page = key.indexOf("o-") === 0 ? "other" : key;
    otherKey = page === "other" ? key : "";
    if (otherKey) showOther(key);
    all(".hub-page", hub).forEach(function (p) { p.classList.toggle("on", p.getAttribute("data-page") === page); });
    all(".hub-nav .it", hub).forEach(function (it) {
      if (it.getAttribute("data-go") === key) it.setAttribute("aria-current", "page"); else it.removeAttribute("aria-current");
    });
    hub.querySelector(".hub-main").scrollTop = 0;
  }
  all(".hub-nav .it", hub).forEach(function (it) { it.onclick = function () { go(it.getAttribute("data-go")); }; });
  $("hub-menu").onclick = function () { hub.classList.toggle("collapsed"); };

  // اختيارات متجاورة ومفاتيح
  all(".a-seg", hub).forEach(function (seg) {
    all("button", seg).forEach(function (b) {
      b.type = "button";
      b.onclick = function () {
        all("button", seg).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        if (seg.getAttribute("data-seg") === "wm") {
          var D = { on: ["بالإنترنت دائمًا: أدق ترجمة وأصوات طبيعية", "Always online: the best translation and natural voices"],
                    auto: ["بالإنترنت، وإن انقطع يكمل بأدوات جهازك", "Online, and continues with on-device tools if it drops"],
                    off: ["كل شيء على جهازك، لا شيء يُرسل إلى الإنترنت", "Everything on your PC; nothing goes online"] }[b.getAttribute("data-v")];
          var d = $("wm-desc"); d.setAttribute("data-ar", D[0]); d.setAttribute("data-en", D[1]); d.textContent = D[en() ? 1 : 0];
        }
      };
    });
  });
  all(".a-tog", hub).forEach(function (t) {
    t.type = "button";
    t.onclick = function () { t.setAttribute("aria-checked", t.getAttribute("aria-checked") === "true" ? "false" : "true"); };
  });

  // البحث: يُبرز الأقسام المطابقة، وEnter يفتح أولها
  $("hub-search").oninput = function () {
    var q = this.value.trim().toLowerCase();
    all(".hub-nav .it", hub).forEach(function (it) {
      var s = it.querySelector("span"), txt = ((s.getAttribute("data-ar") || s.textContent) + " " + (s.getAttribute("data-en") || "")).toLowerCase();
      it.classList.toggle("found", !!q && txt.indexOf(q) >= 0);
    });
  };
  $("hub-search").onkeydown = function (e) {
    if (e.key !== "Enter") return;
    var hit = hub.querySelector(".hub-nav .it.found");
    if (hit) { go(hit.getAttribute("data-go")); this.value = ""; this.oninput(); }
  };

  // بطاقات الأدوات
  all(".tool", hub).forEach(function (t) {
    t.onclick = function () {
      var k = t.getAttribute("data-tool");
      if (k === "media" || k === "audio") return go(k);
      $("mw").scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { (k === "live" ? $("mw-live") : $("mw-sel")).click(); }, 500);
    };
  });

  // تنزيل صوت الدبلجة: شريط تقدم ثم «جاهز»
  $("wm-dl").onclick = function () {
    var btn = this, bar = $("wm-bar"), fill = bar.querySelector("i"), p = 0;
    if (btn.disabled) return;
    btn.disabled = true; bar.style.display = "block";
    var t = setInterval(function () {
      p = Math.min(100, p + 4 + Math.random() * 8); fill.style.width = p + "%";
      if (p >= 100) {
        clearInterval(t); bar.style.display = "none";
        var s = btn.querySelector("span"); s.setAttribute("data-ar", "✓ جاهز"); s.setAttribute("data-en", "✓ Ready"); s.textContent = en() ? "✓ Ready" : "✓ جاهز";
        var need = hub.querySelector(".wm .need");
        need.innerHTML = ""; var n = document.createElement("span");
        n.setAttribute("data-ar", "كل شيء جاهز للعمل بلا إنترنت."); n.setAttribute("data-en", "Everything is ready to work offline.");
        n.textContent = n.getAttribute(en() ? "data-en" : "data-ar"); need.appendChild(n);
      }
    }, 120);
  };

  // إفلات ملف: يُعرض اسمه فقط (لا يُرفع إلى أي مكان)
  var drop = $("drop"), picker = document.createElement("input");
  picker.type = "file"; picker.accept = "video/*,audio/*,.srt";
  function took(f) {
    if (!f) return;
    var el = $("drop-file"); el.hidden = false;
    el.textContent = "✓ " + f.name + " — " + L("في البرنامج تبدأ الترجمة الآن", "in the app, translation starts now");
  }
  picker.onchange = function () { took(picker.files[0]); };
  drop.onclick = function () { picker.click(); };
  drop.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); picker.click(); } };
  drop.ondragover = function (e) { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = function () { drop.classList.remove("over"); };
  drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove("over"); took(e.dataTransfer.files[0]); };

  // اختبار السماع: مؤشر مستوى لثلاث ثوانٍ
  $("lt-btn").onclick = function () {
    var m = $("lt-meter"), bars = all("i", m), btn = this, msg = $("lt-msg");
    if (btn.disabled) return;
    btn.disabled = true; m.style.display = "inline-flex";
    var t = setInterval(function () { bars.forEach(function (b) { b.style.height = (4 + Math.random() * 18) + "px"; }); }, 110);
    setTimeout(function () {
      clearInterval(t); m.style.display = "none"; btn.disabled = false;
      msg.setAttribute("data-ar", "✓ يسمع جيدًا"); msg.setAttribute("data-en", "✓ Hearing fine");
      msg.textContent = msg.getAttribute(en() ? "data-en" : "data-ar");
    }, 3000);
  };

  // «استمع»: جملة بصوت المتصفح ونبرته (البرنامج نفسه يستخدم أصواتًا طبيعية أجود)
  all(".speak", hub).forEach(function (b) {
    b.onclick = function () {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(L("مرحبًا، هذا صوت الدبلجة.", "Hello, this is the dubbing voice."));
      u.lang = en() ? "en-US" : "ar-SA";
      var row = b.closest(".a-row"), sel = row && row.querySelector('.a-seg [aria-pressed="true"]');
      var i = sel ? all("button", sel.parentNode).indexOf(sel) : 2;
      u.pitch = row && all("button", row.querySelector(".a-seg")).length === 4 ? [0.6, 0.8, 1, 1.3][i] : 1;
      speechSynthesis.speak(u);
    };
  });

  applyLang();
})();
