# Repository Rules & Autonomous Workflow Guidelines

## Git Workflow Habits (Mandatory)
1. **Commit Author Attribution**:
   - Always commit using `--author="ankitjha93 <93ankitjha@gmail.com>"`.
2. **Automatic Remote Push**:
   - Immediately after completing any `git commit`, run `git push origin <branch>` without waiting for the user to request it.
   - Pushing committed code to the remote repository is a mandatory, continuous habit.
3. **Pre-Push Validation**:
   - Ensure the working tree is clean and automated tests/builds pass before pushing.
