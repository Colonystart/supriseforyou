/* =====================================================
   🎵 Music player — built-in music-box melody or your MP3
   ===================================================== */

const LoveMusic = (() => {
  let audioCtx = null, masterGain = null;
  let playing = false, loopTimer = null, nextStart = 0;
  let customAudio = null;
  let activeOscs = [];
  let useCustom = !!CONFIG.musicUrl;

  const NOTE_LEN = 0.55; // seconds per melody note
  const F = {
    "D3": 146.83, "F#3": 185.00, "G3": 196.00, "A3": 220.00, "B3": 246.94,
    "E4": 329.63, "F#4": 369.99, "G4": 392.00, "A4": 440.00, "B4": 493.88,
    "C#5": 554.37, "D5": 587.33, "E5": 659.25, "F#5": 739.99, "G5": 783.99, "A5": 880.00
  };

  /* Gentle Canon-style melody + bass */
  const SEQ = [
    { m: F["F#5"], b: F["D3"] }, { m: F["E5"] },
    { m: F["D5"],  b: F["A3"] }, { m: F["C#5"] },
    { m: F["B4"],  b: F["B3"] }, { m: F["A4"] },
    { m: F["B4"],  b: F["F#3"] }, { m: F["C#5"] },
    { m: F["D5"],  b: F["G3"] }, { m: F["C#5"] },
    { m: F["B4"],  b: F["D3"] }, { m: F["A4"] },
    { m: F["G4"],  b: F["G3"] }, { m: F["F#4"] },
    { m: F["G4"],  b: F["A3"] }, { m: F["E4"] },
    { m: F["D5"],  b: F["D3"] }, { m: F["F#5"] },
    { m: F["A5"],  b: F["A3"] }, { m: F["G5"] },
    { m: F["F#5"], b: F["B3"] }, { m: F["D5"] },
    { m: F["F#5"], b: F["F#3"] }, { m: F["E5"] },
    { m: F["D5"],  b: F["G3"] }, { m: F["C#5"] },
    { m: F["B4"],  b: F["D3"] }, { m: F["A4"] },
    { m: F["G4"],  b: F["G3"] }, { m: F["B4"] },
    { m: F["A4"],  b: F["A3"] }, { m: F["G4"] }
  ];

  function initCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.6;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function playNote(freq, time, dur, type, vol) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.015);      // soft attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur); // music-box decay
    osc.connect(gain).connect(masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.1);
    activeOscs.push(osc);
    osc.onended = () => { activeOscs = activeOscs.filter(o => o !== osc); };
  }

  function scheduleLoop() {
    if (!playing || useCustom) return;
    const now = audioCtx.currentTime;
    if (nextStart < now) nextStart = now + 0.08;
    let t = nextStart;
    SEQ.forEach(step => {
      if (step.b) playNote(step.b, t, 1.6, "sine", 0.14);   // bass
      playNote(step.m, t, 1.15, "triangle", 0.2);           // melody
      t += NOTE_LEN;
    });
    nextStart = t;
    loopTimer = setTimeout(scheduleLoop, (nextStart - now - 0.6) * 1000);
  }

  function start() {
    if (playing) return;
    initCtx();
    playing = true;
    nextStart = 0;

    if (useCustom) {
      if (!customAudio) {
        customAudio = new Audio(CONFIG.musicUrl);
        customAudio.loop = true;
        customAudio.volume = 0.55;
      }
      customAudio.play().catch(() => {
        // file missing or blocked → fall back to melody
        useCustom = false;
        scheduleLoop();
      });
    } else {
      const resume = audioCtx.resume ? audioCtx.resume() : Promise.resolve();
      resume.then(() => { if (playing) scheduleLoop(); }).catch(() => {});
    }
    updateUI();
  }

  function stop() {
    playing = false;
    nextStart = 0;
    clearTimeout(loopTimer);
    if (customAudio) customAudio.pause();
    if (audioCtx) {
      const stopAt = audioCtx.currentTime + 0.05;
      activeOscs.forEach(o => { try { o.stop(stopAt); } catch (e) {} });
    }
    updateUI();
  }

  /* Attempt autoplay (finale). If the browser blocks it,
     quietly reset so the button stays ready for a tap. */
  function tryStart() {
    start();
    setTimeout(() => {
      if (!playing) return;
      if (useCustom && customAudio && customAudio.paused) stop();
      else if (!useCustom && audioCtx && audioCtx.state !== "running") stop();
    }, 500);
  }

  function toggle() {
    playing ? stop() : start();
  }

  function updateUI() {
    const btn = document.getElementById("musicBtn");
    const player = document.getElementById("musicPlayer");
    if (btn) btn.textContent = playing ? "🎶" : "🎵";
    if (player) player.classList.toggle("playing", playing);
  }

  document.getElementById("musicBtn").addEventListener("click", toggle);

  return { start, stop, toggle, tryStart };
})();