@echo off
chcp 65001 >nul
echo ==============================================================================
echo [GIT SETUP] Tu dong khoi tao Git va tao 3 Commit theo yeu cau de bai
echo Sinh vien: Phi Duc Phi - MSV: DTC241200011 - De 20: Booking Tour
echo ==============================================================================

if not exist ".git" (
    echo [*] Khoi tao Git Repository...
    git init
    git branch -M main
)

echo.
echo [*] Thuc hien Commit 1: Web App + PostgreSQL + pgAdmin + Nginx (HTTPS & Security Headers)...
git add app/ database/ pgadmin/ nginx/
git commit -m "feat(web-proxy): deploy tour booking web app with postgresql, pgadmin and nginx reverse proxy with SSL"

echo.
echo [*] Thuc hien Commit 2: Tich hop Prometheus + Grafana giam sat he thong...
git add monitoring/
git commit -m "feat(monitoring): integrate prometheus and grafana for web, postgresql, nginx and container metrics"

echo.
echo [*] Thuc hien Commit 3: He thong Log tap trung Loki + Promtail, LogQL va Hardening...
git add logging/ docker-compose.yml .env.example .gitignore README.md docs/ scripts/
git commit -m "feat(logging-hardening): implement loki and promtail centralized logging with logql and security hardening"

echo.
echo ==============================================================================
echo [HOAN TAT] Da tao thanh cong 3 Commit chuan theo yeu cau de bai!
echo De day len GitHub cua ban, hay chay cac lenh sau:
echo   git remote add origin https://github.com/dtc241200011/dtc241200011_phiducphi.git
echo   git push -u origin main
echo ==============================================================================
pause

