#!/usr/bin/env bash
set -euo pipefail

# One-command Debian/Ubuntu systemd installer so FundPilot MY survives reboots automatically
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_USER="${SUDO_USER:-$(whoami)}"
NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"
PORT="${PORT:-3000}"

if [ -z "$NODE_BIN" ] || [ -z "$NPM_BIN" ]; then
  echo "Error: node and npm must be installed before running setup-systemd.sh"
  exit 1
fi

echo "==> Building production bundle in ${APP_DIR}..."
cd "$APP_DIR"
"$NPM_BIN" install
"$NPM_BIN" run build

chmod +x "$APP_DIR/scripts/server-sync.sh"

SERVICE_PATH="/etc/systemd/system/fundpilot.service"
echo "==> Writing systemd unit to ${SERVICE_PATH}..."

cat > "$SERVICE_PATH" <<EOF
[Unit]
Description=FundPilot MY — Self-Improving Layman Fund Manager Dashboard
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
ExecStart=${NODE_BIN} ${APP_DIR}/server/index.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "==> Reloading systemd & enabling fundpilot.service on boot..."
systemctl daemon-reload
systemctl enable --now fundpilot.service
systemctl restart fundpilot.service

CRON_FILE="/etc/cron.d/fundpilot-sync"
echo "==> Installing weekday auto-pull cron (${CRON_FILE})..."
cat > "$CRON_FILE" <<EOF
# Pull latest GitHub Actions market calibration updates Mon-Fri at 01:15 UTC (09:15 AM MYT)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
15 1 * * 1-5 ${RUN_USER} ${APP_DIR}/scripts/server-sync.sh >> /var/log/fundpilot-sync.log 2>&1
EOF
chmod 0644 "$CRON_FILE"

echo ""
echo "============================================================"
echo " FundPilot MY is now reboot-proof via systemd!"
echo " - Service status : systemctl status fundpilot"
echo " - Live logs      : journalctl -u fundpilot -f"
echo " - Listening port : http://$(hostname -I | awk '{print $1}'):${PORT}"
echo "============================================================"
