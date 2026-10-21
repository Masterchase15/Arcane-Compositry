@echo off
rem Double-click this file to start the Arcane Compositry companion site.
rem The first time, it installs what the site needs and builds it (a minute or two).
rem Then open http://localhost:3000 in your browser. Close this window to stop it.
cd /d "%~dp0"
if not exist node_modules call npm install
if not exist dist call npm run build
node server.js
pause
