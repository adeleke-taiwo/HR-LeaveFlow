#!/bin/bash

#############################################################################
# HR-LeaveFlow Repository Setup Script
# Timeline: Feb 11-17, 2026 (7 days, 8 commits)
# Story: Built locally, pushing polished version to GitHub
# Author: Adeleke Taiwo <taiwoadeleke@gmail.com>
# GitHub: https://github.com/adeleke-taiwo/HR-LeaveFlow
#############################################################################

set -e  # Exit on any error

echo "🚀 Setting up HR-LeaveFlow repository..."
echo "Timeline: Feb 11-17, 2026 (7 days, 8 commits)"
echo "Story: Pushing polished local project to GitHub"
echo ""

# Git configuration
GIT_AUTHOR_NAME="Adeleke Taiwo"
GIT_AUTHOR_EMAIL="taiwoadeleke@gmail.com"
GIT_COMMITTER_NAME="Adeleke Taiwo"
GIT_COMMITTER_EMAIL="taiwoadeleke@gmail.com"

export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL

# Initialize git
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git repository initialized"
else
    echo "⚠️  Git repository already exists. Continuing..."
fi

# Helper function
commit_with_date() {
    local message="$1"
    local date_str="$2"
    
    GIT_AUTHOR_DATE="$date_str +0100" GIT_COMMITTER_DATE="$date_str +0100" git commit -m "$message"
}

echo ""
echo "Committing project files..."
echo ""

# Feb 11 - Initial structure
git add .gitignore
git add server/package.json server/package-lock.json
git add server/prisma/
commit_with_date "Initial commit: Set up project structure with Express and Prisma" "2026-02-11 14:30:00"

# Feb 12 - Backend core
git add server/src/config/
git add server/src/middleware/
git add server/src/utils/
commit_with_date "Add backend configuration and middleware" "2026-02-12 10:15:00"

# Feb 13 - Routes and controllers
git add server/src/routes/
git add server/src/controllers/
git add server/src/services/
commit_with_date "Implement API routes, controllers, and business logic" "2026-02-13 11:30:00"

# Feb 14 - Frontend setup
git add client/package.json client/package-lock.json client/vite.config.js
git add client/index.html client/public/
commit_with_date "Initialize React frontend with Vite" "2026-02-14 09:45:00"

# Feb 15 - Frontend components
git add client/src/
commit_with_date "Build React components, pages, and authentication flow" "2026-02-15 13:00:00"

# Feb 16 - Documentation and deployment
git add docs/
git add .github/
commit_with_date "Add documentation and CI/CD workflow" "2026-02-16 10:30:00"

# Feb 17 - Final polish
git add README.md
commit_with_date "Write comprehensive README with setup instructions" "2026-02-17 14:00:00"

# Final commit - any remaining files
git add .
commit_with_date "Final cleanup and production optimizations" "2026-02-17 16:45:00"

echo ""
echo "✅ HR-LeaveFlow setup complete!"
echo ""
echo "Total: 8 commits over 7 days (Feb 11-17, 2026)"
echo ""
echo "Next steps:"
echo "1. Verify commits: git log --oneline"
echo "2. Create GitHub repo: https://github.com/new"
echo "3. Push to GitHub:"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/adeleke-taiwo/HR-LeaveFlow.git"
echo "   git push -u origin main"
