// ===== STATE =====
let recording = false;
let timerInterval = null;
let seconds = 0;
let cameraOn = true;
let micOn = true;
let localStream = null;
let playbackInterval = null;

const questions = [
  "Tell me about yourself and your background.",
  "Describe a challenging project you worked on.",
  "How do you handle working under pressure?",
  "Where do you see yourself in 5 years?",
  "What's your greatest technical strength?",
  "Tell me about a time you failed and what you learned.",
  "How do you approach learning new technologies?",
  "Describe your ideal team environment.",
];
let qIndex = 0;

const sessions = [
  { name: "Behavioural interview — Alex P.", duration: "8:22", clarity: 88, pace: 71, struct: 82, overall: 81 },
  { name: "Technical interview — Sam K.",    duration: "12:05", clarity: 74, pace: 58, struct: 55, overall: 62 },
  { name: "Mock HR interview — Jordan L.",   duration: "6:48",  clarity: 92, pace: 85, struct: 89, overall: 89 },
];

// ===== CAMERA =====
async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('local-video').srcObject = localStream;
  } catch (e) {
    console.warn('Camera not available — running in demo mode');
  }
}
startCamera();

// ===== RECORDING =====
function toggleRecording() {
  recording = !recording;
  const btn = document.getElementById('btn-record');
  const status = document.getElementById('rec-status');
  if (recording) {
    btn.innerHTML = '<span class="rec-dot"></span> Stop recording';
    btn.classList.add('recording');
    status.textContent = '● Recording';
    status.classList.add('recording');
    startTimer();
    startMetrics();
  } else {
    btn.innerHTML = '<span class="rec-dot"></span> Start recording';
    btn.classList.remove('recording');
    status.textContent = 'Saved';
    status.classList.remove('recording');
    stopTimer();
    saveSession();
  }
}

// ===== TIMER =====
function startTimer() {
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${m}:${s}`;
  }, 1000);
}
function stopTimer() {
  clearInterval(timerInterval);
}

// ===== METRICS SIMULATION =====
function startMetrics() {
  const targets = {
    clarity: Math.floor(Math.random() * 25) + 70,
    pace:    Math.floor(Math.random() * 30) + 55,
    struct:  Math.floor(Math.random() * 25) + 65,
  };
  let current = { clarity: 0, pace: 0, struct: 0 };
  const interval = setInterval(() => {
    if (!recording) { clearInterval(interval); return; }
    ['clarity','pace','struct'].forEach(k => {
      if (current[k] < targets[k]) {
        current[k] = Math.min(current[k] + Math.floor(Math.random() * 4) + 1, targets[k]);
        document.getElementById(`m-${k}`).textContent = current[k] + '%';
        document.getElementById(`b-${k}`).style.width = current[k] + '%';
      }
    });
  }, 400);
}

// ===== EV POWER SIMULATION =====
let soc = 78;
setInterval(() => {
  soc = Math.max(5, Math.min(100, soc + (Math.random() > 0.5 ? 0.3 : -0.2)));
  const rounded = Math.round(soc);
  document.getElementById('soc-display').textContent = rounded;
  document.getElementById('m-ev').textContent = rounded + '%';
  document.getElementById('b-ev').style.width = rounded + '%';
  const dot = document.getElementById('ev-dot');
  if (soc < 10) {
    dot.style.background = '#ff4f4f';
    if (recording) {
      toggleRecording(); // graceful stop on low power
      showAlert('Low EV power — recording saved automatically.');
    }
  } else if (soc < 25) {
    dot.style.background = '#f5b731';
  } else {
    dot.style.background = '#1dcb8a';
  }
}, 3000);

function showAlert(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:20px;right:20px;background:#1a1a24;border:1px solid rgba(245,183,49,0.4);color:#f5b731;font-family:DM Mono,monospace;font-size:12px;padding:12px 20px;border-radius:8px;z-index:999;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

// ===== CAMERA / MIC TOGGLE =====
function toggleCamera() {
  cameraOn = !cameraOn;
  if (localStream) {
    localStream.getVideoTracks().forEach(t => t.enabled = cameraOn);
  }
}
function toggleMic() {
  micOn = !micOn;
  if (localStream) {
    localStream.getAudioTracks().forEach(t => t.enabled = micOn);
  }
}

// ===== QUESTIONS =====
function nextQuestion() {
  qIndex = (qIndex + 1) % questions.length;
  const el = document.getElementById('question-text');
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = questions[qIndex];
    el.style.transition = 'opacity .3s';
    el.style.opacity = '1';
  }, 150);
}

// ===== SAVE SESSION (demo) =====
function saveSession() {
  const list = document.getElementById('recordings-list');
  const count = document.getElementById('rec-count');
  const newItem = document.createElement('div');
  newItem.className = 'rec-item';
  const m = String(Math.floor(seconds / 60)).padStart(2,'0');
  const s = String(seconds % 60).padStart(2,'0');
  const score = Math.floor(Math.random() * 20) + 70;
  newItem.innerHTML = `
    <div class="rec-thumb">▶</div>
    <div class="rec-info">
      <div class="rec-name">New session — ${new Date().toLocaleTimeString()}</div>
      <div class="rec-meta">Just now · ${m}:${s}</div>
    </div>
    <div class="rec-scores-mini">
      <span class="ms teal">Score ${score}%</span>
    </div>
    <button class="btn-review">Review ↗</button>
  `;
  list.prepend(newItem);
  const n = list.querySelectorAll('.rec-item').length;
  count.textContent = `${n} session${n !== 1 ? 's' : ''}`;
}

// ===== CRITIQUE =====
function openCritique(idx) {
  const s = sessions[idx];
  document.getElementById('critique-panel').style.display = 'block';
  document.getElementById('critique-title').textContent = `AI Critique — ${s.name}`;
  document.getElementById('player-title').textContent = s.name;
  document.getElementById('player-time').textContent = `0:00 / ${s.duration}`;
  document.getElementById('crit-overall').textContent = s.overall + '%';
  document.getElementById('critique-panel').scrollIntoView({ behavior: 'smooth' });
}
function closeCritique() {
  document.getElementById('critique-panel').style.display = 'none';
  clearInterval(playbackInterval);
}
function simPlayback() {
  let p = 0;
  clearInterval(playbackInterval);
  playbackInterval = setInterval(() => {
    p = Math.min(p + 0.5, 100);
    document.getElementById('player-progress').style.width = p + '%';
    if (p >= 100) clearInterval(playbackInterval);
  }, 100);
}
