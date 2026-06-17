@echo off
echo Starting Budget70 System...

echo Starting Frontend Server...
cd frontend
start cmd /k "npm run dev"

echo System started! Frontend running at http://localhost:5173
echo (Backend has been migrated to Supabase Cloud)
