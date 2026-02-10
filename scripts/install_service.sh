#!/usr/bin/env bash
set -euo pipefail

# Adjust paths/user as needed.
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


