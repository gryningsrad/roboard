from pathlib import Path

USB_MOUNT_ROOTS = [Path("/media/pi"), Path("/media")]

def find_usb_mount() -> Path | None:
    for root in USB_MOUNT_ROOTS:
        if not root.exists():
            continue
        for c in root.iterdir():
            if not c.is_dir():
                continue
            try:
                t = c / ".write_test"
                t.write_text("ok")
                t.unlink(missing_ok=True)
                return c
            except Exception:
                pass
    return None
