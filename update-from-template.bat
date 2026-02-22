@echo off
setlocal

rem Ensure .gitattributes exists with merge rule for personal data
echo [1/8] Preparing .gitattributes for locally-kept files...
if not exist .gitattributes (
  rem keep local preferences from being overwritten
  echo data/personalbest.ini merge=ours>.gitattributes
  echo src/data/config.json merge=ours>>.gitattributes
  echo src/data/laptime.json merge=ours>>.gitattributes
  echo src/data/temp_laptime.json merge=ours>>.gitattributes
  echo src/data/old_laptime.json merge=ours>>.gitattributes
  echo src/data/meta.json merge=ours>>.gitattributes
  echo update-from-template.bat merge=ours>>.gitattributes
  echo README.md merge=ours>>.gitattributes
)

echo [2/8] Checking for remote "upstream"...
for /f "tokens=*" %%r in ('git remote') do (
  if /i "%%r"=="upstream" set HAS_UPSTREAM=1
)
if not defined HAS_UPSTREAM (
  echo        Adding remote upstream...
  git remote add upstream https://github.com/yeftakun/ac-lapboard.git
)

echo [3/8] Waiting for confirmation before update...
set /p _="Need to update? (Enter) "

echo [4/8] Fetching changes from upstream and origin...
git fetch upstream
if errorlevel 1 goto :error
git fetch origin
if errorlevel 1 goto :error

echo [5/8] Merging changes from upstream/master...
git merge upstream/master -m "update from template"
if errorlevel 1 goto :error

echo [6/8] Rebase onto origin/master to include remote changes...
git pull --rebase origin master
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
