@echo off
echo Starting the Transformer Maintenance Monitoring System...

:: Start the Node.js server
start /min node index.js

:: Wait for the server to start (adjust the timeout if needed)
timeout /t 5 >nul

:: Open the web page in the default browser
start http://localhost:3099

echo Application is running. The browser will open shortly...
pause