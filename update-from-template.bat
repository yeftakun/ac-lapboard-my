@echo off
setlocal

echo [1/8] Ensuring .gitattributes merge rules...
if not exist .gitattributes (
  type nul > .gitattributes
)
findstr /C:"src/data/meta.json merge=ours" .gitattributes >nul || ^
  echo src/data/meta.json merge=ours>>.gitattributes
findstr /C:"src/data/laptime.json merge=ours" .gitattributes >nul || ^
  echo src/data/laptime.json merge=ours>>.gitattributes
findstr /C:"src/data/temp_laptime.json merge=ours" .gitattributes >nul || ^
  echo src/data/temp_laptime.json merge=ours>>.gitattributes
findstr /C:"src/data/old_laptime.json merge=ours" .gitattributes >nul || ^
  echo src/data/old_laptime.json merge=ours>>.gitattributes
findstr /C:"data/personalbest.ini merge=ours" .gitattributes >nul || ^
  echo data/personalbest.ini merge=ours>>.gitattributes
findstr /C:"update-from-template.bat merge=ours" .gitattributes >nul || ^
  echo update-from-template.bat merge=ours>>.gitattributes
findstr /C:"README.md merge=ours" .gitattributes >nul || ^
  echo README.md merge=ours>>.gitattributes

echo [2/8] Checking for remote "upstream"...
for /f "tokens=*" %%r in ('git remote') do (
  if /i "%%r"=="upstream" set HAS_UPSTREAM=1
)
if not defined HAS_UPSTREAM (
  echo        Adding remote upstream...
  git remote add upstream https://github.com/yeftakun/ac-lapboard.git || goto :error
)

echo [3/8] Waiting for confirmation before update...
set /p _="Need to update? (Enter) "

echo [4/8] Fetching changes from upstream and origin...
git fetch upstream || goto :error
git fetch origin || goto :error

echo [5/8] Merging changes from upstream/master...
git merge upstream/master -m "update from template"
if errorlevel 1 goto :error

echo [6/8] Rebase onto origin/master to include remote changes...
git pull --rebase --autostash origin master
if errorlevel 1 goto :error

echo [7/8] Showing status...
git status -sb

echo [8/8] Pushing merged changes to origin...
git push --force-with-lease
if errorlevel 1 goto :error

echo.
echo Your web has been updated!
echo If there are changes, GitHub Actions will run the build workflow next...
set /p _="(Enter) "
goto :eof

:error
echo Update failed. Please check the git output above.
set /p _="(Enter) "
exit /b 1