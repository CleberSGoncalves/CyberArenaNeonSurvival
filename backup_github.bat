@echo off
echo [*] Sincronizando backup no GitHub (Cyber Arena: Neon Survival)...
git add .
git commit -m "auto: deploy e build Cyber Arena: Neon Survival (CrazyGames HTML5)"
git push -u origin main
echo [OK] Backup concluido com sucesso!
