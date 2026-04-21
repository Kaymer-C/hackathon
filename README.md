# PeerPrep — Peer Interview Platform
### Built in VS Code · 3-person team · 1 day

---

## What this is
A peer interview platform for students. Record sessions via webcam, play back your performance, and receive AI critique on communication skills. Powered by three disciplines working in parallel:

- **Mechatronics** — Raspberry Pi pod, GPIO recording trigger, MQTT
- **Cybersecurity** — JWT auth, DTLS-SRTP, RBAC, OWASP scan
- **Electric car** — EV charging station as IoT power hub via OCPP + MQTT

---

## Run the website on your laptop (5 steps)

### Step 1 — Prerequisites
Make sure you have these installed:
- [Node.js 20+](https://nodejs.org) — `node -v` to check
- [VS Code](https://code.visualstudio.com)
- [Git](https://git-scm.com)

### Step 2 — Get the code
```bash
git clone https://github.com/yourteam/peerprep
cd peerprep
code .
```
When VS Code opens, click **Install All** on the extensions prompt.

### Step 3 — Install dependencies
```bash
npm install
```

### Step 4 — Start the website
```bash
npm run dev
```
Open http://localhost:3000 in your browser.
To open the dashboard directly: `npm run dashboard`

### Step 5 — Explore
- **Landing page** — http://localhost:3000/index.html
- **Dashboard** — http://localhost:3000/dashboard.html
  - Click **Start recording** to begin a mock session
  - Click **Review** on any past session to see AI critique
  - Watch EV power % in the sidebar — drops below 10% trigger auto-save

---

## Team setup (all 3 on the same day)

### 11 AM sync — share these values in your team chat:
```
JWT_SECRET=<one person generates, share with all>
MQTT_BROKER=<IP of whoever runs Mosquitto>
OCPP_URL=<EV teammate's machine IP>
```

### File ownership
| File | Owner |
|------|-------|
| `firmware/pod_controller.py` | Mechatronics (you) |
| `server/auth.ts` | Cybersecurity |
| `server/ev_hub.js` | Electric car |
| `index.html` + `dashboard.html` | All (shared) |

---

## Server modules (optional — for full backend)

### Cybersecurity — auth server
```bash
cd server
npm install express jsonwebtoken @types/express @types/jsonwebtoken typescript ts-node
npx ts-node auth.ts
```

### Electric car — EV hub
```bash
cd server
npm install mqtt ocpp-j-1.6
node ev_hub.js
```

### Mechatronics — pod controller (on Raspberry Pi)
```bash
pip install RPi.GPIO paho-mqtt requests --break-system-packages
python firmware/pod_controller.py
```

---

## Video demo script (4–6 PM on build day)

1. **Intro** (15 sec) — show all 3 VS Code windows side by side
2. **Mechatronics** (90 sec) — press pod button, LED turns green, ffmpeg starts
3. **Cybersecurity** (90 sec) — JWT Debugger, Thunder Client 401 vs 200
4. **Electric car** (90 sec) — MQTT dashboard, drop SoC to 8%, pod auto-saves
5. **Integration demo** (60 sec) — all 3 running, full interview session recorded
6. **Outro** (15 sec) — show final recording + AI critique score

**Tools:** OBS Studio (free) for screen + webcam recording. DaVinci Resolve (free) for splicing.

---

## Project structure
```
peerprep/
├── .vscode/
│   └── extensions.json     ← install these on first open
├── css/
│   └── style.css
├── js/
│   ├── main.js             ← landing page animations
│   └── dashboard.js        ← session, recording, critique, EV sim
├── server/
│   ├── auth.ts             ← cybersecurity: JWT + RBAC
│   └── ev_hub.js           ← electric car: OCPP + MQTT
├── firmware/
│   └── pod_controller.py   ← mechatronics: GPIO + MQTT
├── index.html              ← landing page
├── dashboard.html          ← main app
├── .env.example            ← copy to .env and fill in
└── package.json
```
