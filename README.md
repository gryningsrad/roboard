# AMOS Stock Search - spares-kiosk (offline Raspberry Pi spare-parts kiosk)

## Local (offline) web app intended for a Raspberry Pi with an HDMI screen

A simple search program for a Raspberry Pie which reads information from a locally stored
Excel-file containing information om Stock Items from the PMS software AMOS.

The tool should be used for

- Searching for parts based on their name, part.no or makers.ref.
- Be able to add parts to a wish list using a bar code scanner
- More functions will probably be needed

## Features (current)

- Import Excel (.xlsx) with sheets `Parts` and `Orders`
- Before replacing all parts, exports current wishlist to USB (if mounted) as XLSX
- Search parts
- Toggle wishlist
- List orders (headers only)

## Run server (dev)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000

Adjust paths/user as needed.

SERVICE=/etc/systemd/system/spares-kiosk.service

sudo tee "$SERVICE" > /dev/null <<'EOF'
[Unit]
Description=Spares Kiosk API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/spares-kiosk/server
ExecStart=/usr/bin/python3 -m uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now spares-kiosk
echo "Installed and started spares-kiosk.service"
""", encoding="utf-8")

(scripts/"kiosk_autostart.sh").write_text("""# Chromium kiosk autostart (Raspberry Pi OS / LXDE)

Put this line in:
~/.config/lxsession/LXDE-pi/autostart

@chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars http://localhost:8000

""", encoding="utf-8")

Make scripts executable

for sh in scripts.glob("*.sh"):
os.chmod(sh, 0o755)
