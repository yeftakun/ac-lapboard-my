@echo off
setlocal enabledelayedexpansion

echo [0/7] Cleaning stale rebase/merge state...
if exist ".git\rebase-merge" git rebase --abort >nul 2>&1
if exist ".git\MERGE_HEAD" git merge --abort >nul 2>&1

echo [1/7] Ensuring .gitattributes merge rules...
if not exist .gitattributes type nul > .gitattributes
for %%L in (
  "src/data/meta.json merge=ours"
  "src/data/laptime.json merge=ours"
  "src/data/temp_laptime.json merge=ours"
  "src/data/old_laptime.json merge=ours"
  "data/personalbest.ini merge=ours"
  "README.md merge=ours"
  "update-from-template.bat merge=ours"
) do (
  findstr /C:"%%~L" .gitattributes >nul || echo %%~L>>.gitattributes
)

echo [2/7] Checking for remote ""upstream""...
set HAS_UPSTREAM=
for /f "tokens=1" %%r in ('git remote') do if /i "%%r"=="upstream" set HAS_UPSTREAM=1
if not defined HAS_UPSTREAM (
  echo        Adding remote upstream...
  git remote add upstream https://github.com/yeftakun/ac-lapboard.git || goto :error
)

echo [3/7] Fetching changes from upstream and origin...
git fetch upstream || goto :error
git fetch origin || goto :error

echo [4/7] Merging upstream/master (preferring ours on conflicts)...
git merge -X ours upstream/master -m "update from template" || goto :error

echo [5/7] Merging origin/master (preferring ours on conflicts)...
git merge -X ours origin/master -m "sync with origin" || goto :error

echo [6/7] Showing status...
git status -sb

echo [7/7] Pushing to origin if ahead...
git push --force-with-lease || goto :error

echo.
echo Your web has been updated!
echo If there are changes, GitHub Actions will run the build workflow next...
set /p _="(Enter) "
goto :eof

:error
echo Update failed. Please check the git output above.
set /p _="(Enter) "
exit /b 1