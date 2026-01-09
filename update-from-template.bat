@echo off
setlocal

rem Ensure .gitattributes exists with merge rule for personalbest.ini
if not exist .gitattributes (
  echo data/personalbest.ini merge=ours>.gitattributes
  echo src/data/config.json merge=ours>>.gitattributes
  echo update-from-template.bat merge=ours>>.gitattributes
)

rem Add upstream remote if missing
for /f "tokens=*" %%r in ('git remote') do (
  if /i "%%r"=="upstream" set HAS_UPSTREAM=1
)
if not defined HAS_UPSTREAM (
  git remote add upstream https://github.com/yeftakun/ac-lapboard.git
)

set /p _="Need to update? (Enter) "

rem Fetch and merge from upstream
git fetch upstream
if errorlevel 1 goto :error

git merge upstream/master -m "update from template"
if errorlevel 1 goto :error

git push
if errorlevel 1 goto :error

echo Your web has been updated!
set /p _="(Enter) "
goto :eof

:error
echo Update failed. Please check the git output above.
set /p _="(Enter) "
exit /b 1
