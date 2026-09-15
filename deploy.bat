@echo off
echo ===============================================
echo Deploying Micro Racing to GitHub...
echo ===============================================
git init
git add .
git commit -m "feat: initial modular architecture refactor for micro racing game"
git branch -M main
git remote add origin https://github.com/s11311014-alt/retro-game-project.git 2>nul || git remote set-url origin https://github.com/s11311014-alt/retro-game-project.git
git push -u origin main
echo ===============================================
echo Finished! Check: https://s11311014-alt.github.io/retro-game-project/
echo ===============================================
pause
