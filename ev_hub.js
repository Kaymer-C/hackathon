// server/src/ev_hub.js
// Electric car teammate's file
const mqtt = require('mqtt');
const { RPCClient } = require('ocpp-j-1.6');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost';
const OCPP_URL    = process.env.OCPP_URL    || 'ws://localhost:8080/ocpp';
const LOW_POWER_THRESHOLD = 10; // % SoC

// ===== MQTT CLIENT =====
const mqttClient = mqtt.connect(MQTT_BROKER);
mqttClient.on('connect', () => {
  console.log('[EV] MQTT connected');
  mqttClient.subscribe('pod/status');
});

// When pod reports its status, adjust charge rate
mqttClient.on('message', (topic, message) => {
  if (topic === 'pod/status') {
    const status = message.toString();
    console.log(`[EV] Pod status: ${status}`);
    if (status === 'recording') {
      // Pod is active — boost available power
      setChargingLimit(80); // 80% of max charge rate
    } else {
      setChargingLimit(100); // full rate when pod idle
    }
  }
});

// Publish power/SoC state so pod can react
function publishPowerState(soc, voltage, chargingW) {
  const payload = JSON.stringify({ soc, voltage, chargingW, ts: Date.now() });
  mqttClient.publish('ev/power', soc.toString());      // simple SoC for pod LED
  mqttClient.publish('ev/telemetry', payload);          // full data for dashboard
  if (soc < LOW_POWER_THRESHOLD) {
    mqttClient.publish('ev/alert', 'LOW_POWER');
    console.warn(`[EV] LOW POWER: SoC ${soc}% — pod should save and stop`);
  }
}

// ===== OCPP CLIENT =====
const ocpp = new RPCClient({ endpoint: OCPP_URL, identity: 'EV_HUB_01' });

ocpp.on('open', () => {
  console.log('[EV] OCPP connected to charging station');
  // Send BootNotification
  ocpp.call('BootNotification', {
    chargePointVendor: 'PeerPrep',
    chargePointModel:  'EduStation-1',
  }).then(res => console.log('[EV] BootNotification:', res.status));
  // Start polling telemetry
  setInterval(pollTelemetry, 5000);
});

// ===== TELEMETRY POLL (simulated CAN bus read) =====
let simSoC = 78;
async function pollTelemetry() {
  // In real hardware: read from socketcan / CAN bus interface
  // Here we simulate gradual discharge + charge
  simSoC = Math.max(5, Math.min(100, simSoC + (Math.random() > 0.4 ? -0.4 : 0.2)));
  const soc      = Math.round(simSoC * 10) / 10;
  const voltage  = Math.round((350 + soc * 0.5) * 10) / 10;  // ~350-400V
  const chargingW = soc > 80 ? 3500 : 11000;                   // taper at 80%
  publishPowerState(soc, voltage, chargingW);
  // Report to OCPP backend
  try {
    await ocpp.call('MeterValues', {
      connectorId: 1,
      transactionId: 1,
      meterValue: [{
        timestamp: new Date().toISOString(),
        sampledValue: [
          { value: String(soc),      measurand: 'SoC',           unit: 'Percent' },
          { value: String(voltage),  measurand: 'Voltage',       unit: 'V' },
          { value: String(chargingW),measurand: 'Power.Active.Import', unit: 'W' },
        ]
      }]
    });
  } catch (e) {
    console.warn('[EV] MeterValues send failed:', e.message);
  }
}

// ===== CHARGING LIMIT =====
async function setChargingLimit(pct) {
  try {
    await ocpp.call('ChangeConfiguration', {
      key: 'MaxChargingProfilePower',
      value: String(Math.round(11000 * pct / 100)),
    });
    console.log(`[EV] Charge limit set to ${pct}%`);
  } catch (e) {
    console.warn('[EV] setChargingLimit failed:', e.message);
  }
}

// Connect
ocpp.connect().catch(e => {
  console.warn('[EV] OCPP connect failed — running in simulation mode');
  setInterval(pollTelemetry, 5000);
});

module.exports = { publishPowerState };
