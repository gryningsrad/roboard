# Chromium kiosk autostart (Raspberry Pi OS / LXDE)
# Put this line in:
#   ~/.config/lxsession/LXDE-pi/autostart
@chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars http://localhost:8000
