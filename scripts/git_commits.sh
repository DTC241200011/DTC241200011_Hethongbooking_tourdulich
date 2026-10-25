#!/usr/bin/env bash
set -e

echo "=============================================================================="
echo "[GIT SETUP] Tự động khởi tạo Git và tạo 3 Commit theo yêu cầu đề bài"
echo "Sinh viên: Phí Đức Phi - MSV: DTC241200011 - Đề 20: Booking Tour"
echo "=============================================================================="

if [ ! -d ".git" ]; then
    echo "[*] Khởi tạo Git Repository..."
    git init
    git branch -M main
fi

echo ""
echo "[*] Thực hiện Commit 1: Web App + PostgreSQL + pgAdmin + Nginx (HTTPS & Security Headers)..."
git add app/ database/ pgadmin/ nginx/
git commit -m "feat(web-proxy): deploy tour booking web app with postgresql, pgadmin and nginx reverse proxy with SSL" || true

echo ""
echo "[*] Thực hiện Commit 2: Tích hợp Prometheus + Grafana giám sát hệ thống..."
git add monitoring/
git commit -m "feat(monitoring): integrate prometheus and grafana for web, postgresql, nginx and container metrics" || true

echo ""
echo "[*] Thực hiện Commit 3: Hệ thống Log tập trung Loki + Promtail, LogQL và Hardening..."
git add logging/ docker-compose.yml .env.example .gitignore README.md docs/ scripts/
git commit -m "feat(logging-hardening): implement loki and promtail centralized logging with logql and security hardening" || true

echo ""
echo "=============================================================================="
echo "[HOÀN TẤT] Đã tạo thành công 3 Commit chuẩn theo yêu cầu đề bài!"
echo "Để đẩy lên GitHub, hãy chạy:"
echo "  git remote add origin https://github.com/dtc241200011/dtc241200011_phiducphi.git"
echo "  git push -u origin main"
echo "=============================================================================="

