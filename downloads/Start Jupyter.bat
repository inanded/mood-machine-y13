@echo off
title Jupyter - leave this window open
cd /d "%~dp0"
echo Starting Jupyter Notebook in your browser...
echo Leave this window open while you work. Close it when you have finished.
echo.
py -3.13 -m notebook
