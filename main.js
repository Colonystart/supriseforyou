/* =====================================================
   💘 Main logic — keypass locks, counter, dots, hearts
   ===================================================== */

const $ = sel => document.querySelector(sel);

function flagName(n) { return "love_ch" + n; }
function isUnlocked(n) { return sessionStorage.getItem(flagName(n)) === "1"; }
function setUnlocked(n) { sessionStorage.setItem(flagName(n), "1"); }

function chapterNum() {
  const m = /^chapter(\d+)$/.exec(document.body.dataset.page || "");
  return m ? parseInt(m[1], 10) : 0;
}

/* ---------- floating hearts ---------- */
(function initHearts() {
  const bg = $("#heartsBg");
  if (!bg) return;
  const symbols = ["❤", "💖", "💕", "💗", "🩷"];
  for (let i = 0; i < 18; i++) {
    const h = document.createElement("span");
    h.className = "heart";
    h.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = (14 + Math.random() * 20) + "px";
    h.style.animationDuration = (8 + Math.random() * 10) + "s";
    h.style.animationDelay = (Math.random() * 10) + "s";
    bg.appendChild(h);
  }
})();

/* ---------- live days-together counter ---------- */
(function initCounter() {
  if (!document.querySelector(".d-days")) return;
  const pad = n => String(n).padStart(2, "0");
  const tick = () => {
    const diff = Date.now() - CONFIG.startDate.getTime();
    const d = Math.max(0, Math.floor(diff / 86400000));
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    document.querySelectorAll(".d-days").forEach(el => el.textContent = d.toLocaleString());
    document.querySelectorAll(".d-h").forEach(el => el.textContent = pad(h));
    document.querySelectorAll(".d-m").forEach(el => el.textContent = pad(m));
    document.querySelectorAll(".d-s").forEach(el => el.textContent = pad(s));
  };
  tick();
  setInterval(tick, 1000);
})();

/* ---------- progress dots ---------- */
(function initDots() {
  const wrap = $("#progressDots");
  if (!wrap) return;
  const current = chapterNum();
  CONFIG.chapters.forEach((ch, i) => {
    const n = i + 1;
    const dot = document.createElement("span");
    dot.className = "dot"
      + (n === current ? " active" : "")
      + (isUnlocked(n) ? " unlocked" : "");
    dot.title = isUnlocked(n) ? ch.title : "🔒 Locked";
    dot.addEventListener("click", () => { if (isUnlocked(n)) location.href = ch.file; });
    wrap.appendChild(dot);
  });
})();

/* ---------- page boot ---------- */
(function boot() {
  const page = document.body.dataset.page;

  if (page === "index") {
    wireIntroLock();
    return;
  }

  const n = chapterNum();
  if (!n) return;

  if (isUnlocked(n)) {
    reveal();
    wireNextLock(n);
    if (n === CONFIG.chapters.length) LoveMusic.tryStart(); // finale 🎵
  } else {
    showOverlay(n);
  }
})();

function reveal() {
  $("#lockOverlay").classList.add("hidden");
  $("#content").classList.remove("hidden");
}

/* Lock screen covering a chapter page (direct URL access) */
function showOverlay(n) {
  const ch = CONFIG.chapters[n - 1];
  $("#overlayTitle").textContent = "Chapter " + n + " is locked...";
  $("#overlayHint").textContent = ch.hint;

  const submit = () => {
    if ($("#overlayKey").value.trim().toLowerCase() === ch.key.toLowerCase()) {
      setUnlocked(n);
      $("#overlayErr").textContent = "";
      reveal();
      wireNextLock(n);
      if (n === CONFIG.chapters.length) LoveMusic.start(); // gesture → allowed
    } else {
      $("#overlayErr").textContent = "💔 Wrong key... try again, my love.";
      $("#overlayKey").value = "";
      $("#overlayKey").focus();
    }
  };

  $("#overlayBtn").addEventListener("click", submit);
  $("#overlayKey").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  $("#overlayKey").focus();
}

/* "Next chapter" lock at the bottom of a chapter page */
function wireNextLock(n) {
  const next = n + 1;
  if (next > CONFIG.chapters.length) return;
  if (!$("#nextLock")) return;

  const ch = CONFIG.chapters[next - 1];
  $("#nextHint").textContent = ch.hint;

  const submit = () => {
    if ($("#nextKey").value.trim().toLowerCase() === ch.key.toLowerCase()) {
      setUnlocked(next);
      location.href = ch.file;
    } else {
      $("#nextErr").textContent = "💔 That's not it... read the hint again 🥺";
      $("#nextKey").value = "";
      $("#nextKey").focus();
    }
  };

  $("#nextBtn").addEventListener("click", submit);
  $("#nextKey").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
}

/* Intro page lock → Chapter 1 */
function wireIntroLock() {
  const ch = CONFIG.chapters[0];
  $("#introHint").textContent = ch.hint;

  const submit = () => {
    if ($("#introKey").value.trim().toLowerCase() === ch.key.toLowerCase()) {
      setUnlocked(1);
      location.href = ch.file;
    } else {
      $("#introErr").textContent = "💔 Wrong key... try again, my love.";
      $("#introKey").value = "";
      $("#introKey").focus();
    }
  };

  $("#introBtn").addEventListener("click", submit);
  $("#introKey").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
}

/* "Read Again" on the finale — resets all progress */
function resetStory() {
  CONFIG.chapters.forEach((_, i) => sessionStorage.removeItem(flagName(i + 1)));
  location.href = "index.html";
}