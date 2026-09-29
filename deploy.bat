@echo off
chcp 65001 >nul
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;%PATH%"

echo =========================================================
echo    Micro Racing - GitHub 一鍵授權與全自動部署系統
echo =========================================================
echo.
echo 正在啟動 GitHub 瀏覽器授權...
echo 請在自動開啟的瀏覽器視窗中，點擊綠色的 [Authorize github] 即可。
echo.
gh auth login --hostname github.com --git-protocol https --web

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 授權失敗或已取消，請重新執行。
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =========================================================
echo [1/3] 正在設定 Git 認證憑據...
echo =========================================================
gh auth setup-git

echo.
echo =========================================================
echo [2/3] 正在將 19 個遊戲模組推送到 GitHub main 分支...
echo =========================================================
git branch -M main
git remote set-url origin https://github.com/s11311014-alt/retro-game-project.git
git push -u origin main

echo.
echo =========================================================
echo [3/3] 正在透過 GitHub API 自動啟用 GitHub Pages 靜態託管...
echo =========================================================
gh api repos/s11311014-alt/retro-game-project/pages -f "source[branch]=main" -f "source[path]=/" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo (Pages 可能已在先前建立，正在更新設定...)
    gh api -X PUT repos/s11311014-alt/retro-game-project/pages -f "source[branch]=main" -f "source[path]=/" 2>nul
)

echo.
echo =========================================================
echo 🎉 全部自動化部署完成！
echo.
echo 請稍候約 1 分鐘（讓 GitHub Actions 完成靜態建置），
echo 接著直接點開下方網址即可暢玩：
echo.
echo 🎮 https://s11311014-alt.github.io/retro-game-project/
echo =========================================================
echo.
pause
