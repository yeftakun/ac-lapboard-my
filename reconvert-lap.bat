@echo off
setlocal

echo [1/4] Pulling latest...
git pull || goto :error

echo [2/4] Removing lap data files...
del /f /q "src\data\laptime.json" 2>nul
del /f /q "src\data\temp_laptime.json" 2>nul
del /f /q "src\data\old_laptime.json" 2>nul
del /f /q "src\data\meta.json" 2>nul

echo [3/4] Commit changes...
git add "src/data/laptime.json" "src/data/temp_laptime.json" "src/data/old_laptime.json" "src/data/meta.json"
git commit -m "chore: reconvert lap data" || goto :error

echo [4/4] Push...
git push || goto :error

echo Done.
goto :eof

:error
echo Failed. Check logs above.
exit /b 1