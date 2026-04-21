# firmware/pod_controller.py
# Mechatronics teammate's file — runs on Raspberry Pi
import time, subprocess, requests
try:
    import RPi.GPIO as GPIO
    import paho.mqtt.client as mqtt
    HW = True
except ImportError:
    print("[POD] Hardware not found — running in simulation mode")
    HW = False

LED_PIN  = 18
BTN_PIN  = 24
DOOR_PIN = 25
BROKER   = "localhost"
API_URL  = "http://localhost:3001/api/recording"
TOKEN    = "replace_with_jwt_token"  # get from cybersecurity teammate at 11 AM sync

recording = False
proc      = None
low_power = False

# ===== MQTT =====
def on_connect(client, userdata, flags, rc):
    print(f"[POD] MQTT connected (rc={rc})")
    client.subscribe("ev/power")
    client.subscribe("ev/alert")

def on_message(client, userdata, msg):
    global low_power
    topic = msg.topic
    payload = msg.payload.decode()
    if topic == "ev/power":
        soc = float(payload)
        low_power = soc < 10.0
        if HW:
            GPIO.output(LED_PIN, not low_power)
        print(f"[POD] EV SoC: {soc:.1f}% | low_power={low_power}")
    elif topic == "ev/alert" and payload == "LOW_POWER":
        print("[POD] LOW POWER ALERT — stopping recording")
        if recording:
            stop_recording(client)

if HW:
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN,  GPIO.OUT)
    GPIO.setup(BTN_PIN,  GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(DOOR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

client = None
if HW:
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(BROKER, 1883)
    client.loop_start()

# ===== RECORDING =====
def start_recording(mqtt_client):
    global proc, recording
    if low_power:
        print("[POD] Cannot start — low power")
        return
    cmd = ["ffmpeg", "-f", "v4l2", "-i", "/dev/video0",
           "-f", "alsa", "-i", "default",
           "-c:v", "libx264", "-c:a", "aac",
           "-t", "300", "/tmp/session.mp4", "-y"]
    proc = subprocess.Popen(cmd)
    recording = True
    if HW:
        GPIO.output(LED_PIN, GPIO.HIGH)
    try:
        requests.post(f"{API_URL}/start",
                      headers={"Authorization": f"Bearer {TOKEN}"},
                      timeout=3)
    except Exception as e:
        print(f"[POD] API call failed: {e}")
    if mqtt_client:
        mqtt_client.publish("pod/status", "recording")
    print("[POD] Recording started")

def stop_recording(mqtt_client):
    global proc, recording
    if proc:
        proc.terminate()
        proc.wait()
    recording = False
    if HW:
        GPIO.output(LED_PIN, GPIO.LOW)
    try:
        requests.post(f"{API_URL}/stop",
                      headers={"Authorization": f"Bearer {TOKEN}"},
                      timeout=3)
    except Exception as e:
        print(f"[POD] API call failed: {e}")
    if mqtt_client:
        mqtt_client.publish("pod/status", "idle")
    print("[POD] Recording stopped — file saved to /tmp/session.mp4")

# ===== MAIN LOOP =====
print("[POD] Controller running. Press Ctrl+C to quit.")
if not HW:
    print("[POD] Simulation mode: type 's' to toggle recording")
    import threading
    def sim_input():
        global recording
        while True:
            cmd = input()
            if cmd.strip() == 's':
                if not recording:
                    start_recording(None)
                else:
                    stop_recording(None)
    threading.Thread(target=sim_input, daemon=True).start()
    while True:
        time.sleep(1)
else:
    try:
        last_btn = True
        while True:
            btn = GPIO.input(BTN_PIN)
            # debounce — detect falling edge
            if last_btn and not btn:
                time.sleep(0.05)
                if not GPIO.input(BTN_PIN):
                    if not recording:
                        start_recording(client)
                    else:
                        stop_recording(client)
            last_btn = btn
            # door sensor — stop on open
            if not GPIO.input(DOOR_PIN) and recording:
                print("[POD] Door opened — stopping recording")
                stop_recording(client)
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("[POD] Shutting down")
        if recording:
            stop_recording(client)
        GPIO.cleanup()
