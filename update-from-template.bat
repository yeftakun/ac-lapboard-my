@echo off
setlocal enabledelayedexpansion

echo [0/8] Cleaning stale rebase/merge state...
if exist ".git\rebase-merge" git rebase --abort >nul 2>&1
if exist ".git\MERGE_HEAD" git merge --abort >nul 2>&1

echo [1/8] Ensuring .gitattributes merge rules...
if not exist .gitattributes type nul > .gitattributes
for %%L in (
  "update-from-template.bat merge=ours"
  "src/data/meta.json merge=ours"
  "src/data/laptime.json merge=ours"
  "src/data/temp_laptime.json merge=ours"
  "src/data/old_laptime.json merge=ours"
  "data/personalbest.ini merge=ours"
  "README.md merge=ours"
) do (
  findstr /C:"%%~L" .gitattributes >nul || echo %%~L>>.gitattributes
)

echo [2/8] Committing .gitattributes if changed...
git status --porcelain .gitattributes | findstr /r ".*" >nul && (
  git add .
  git commit -m "chore: ensure gitattributes merge rules" >nul 2>&1
)

echo [3/8] Checking for remote "upstream"...
set HAS_UPSTREAM=
for /f "tokens=1" %%r in ('git remote') do if /i "%%r"=="upstream" set HAS_UPSTREAM=1
if not defined HAS_UPSTREAM (
  git remote add upstream https://github.com/yeftakun/ac-lapboard.git || goto :error
)

echo [4/8] Fetching changes from upstream and origin...
git fetch upstream || goto :error
git fetch origin || goto :error

:: simpan commit sebelum merge untuk restore file data
for /f "delims=" %%H in ('git rev-parse HEAD') do set PRE_MERGE=%%H

echo [5/8] Merging upstream/master (preferring ours on conflicts)...
git merge -X ours upstream/master -m "update from template" || goto :error

echo [5.5/8] Keeping local versions for data files...
for %%F in (
  src/data/laptime.json
  src/data/temp_laptime.json
  src/data/old_laptime.json
  src/data/meta.json
  data/personalbest.ini
) do (
  git checkout --ours -- "%%F" 2>nul
)
git rm -f --ignore-unmatch src/data/temp_laptime.json src/data/old_laptime.json
git add src/data/laptime.json src/data/temp_laptime.json src/data/old_laptime.json src/data/meta.json data/personalbest.ini

echo [6/8] Merging origin/master (preferring ours on conflicts)...
git merge -X ours origin/master -m "sync with origin" || goto :error

echo [7/8] Showing status...
git status -sb

echo [8/8] Pushing to origin if ahead...
git push --force-with-lease || goto :error

echo(
echo Your web has been updated!
echo If there are changes, GitHub Actions will run the build workflow next...
set /p _="(Enter) "
goto :eof

:error
echo Update failed. Please check the git output above.
set /p _="(Enter) "
exit /b 1