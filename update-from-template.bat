@echo off
setlocal

rem Ensure .gitattributes exists with merge rule for personalbest.ini
echo [1/6] Preparing .gitattributes for locally-kept files...
if not exist .gitattributes (
  echo data/personalbest.ini merge=ours>.gitattributes
  echo src/data/config.json merge=ours>>.gitattributes
  echo update-from-template.bat merge=ours>>.gitattributes
)

rem Add upstream remote if missing
echo [2/6] Checking for remote "upstream"...
for /f "tokens=*" %%r in ('git remote') do (
  if /i "%%r"=="upstream" set HAS_UPSTREAM=1
)
if not defined HAS_UPSTREAM (
  echo        Adding remote upstream...
  git remote add upstream https://github.com/yeftakun/ac-lapboard.git
)

echo [3/6] Waiting for confirmation before update...
set /p _="Need to update? (Enter) "

rem Fetch and merge from upstream
echo [4/6] Fetching changes from upstream...
git fetch upstream
if errorlevel 1 goto :error

echo [5/6] Merging changes from upstream/master...
git merge upstream/master -m "update from template"
if errorlevel 1 goto :error

echo [6/6] Pushing merged changes to origin...
git push
if errorlevel 1 goto :error

echo Your web has been updated!
echo Now github actions should run build workflow...
set /p _="(Enter) "
goto :eof

:error
echo Update failed. Please check the git output above.
set /p _="(Enter) "
exit /b 1
