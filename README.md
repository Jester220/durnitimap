# DurnitiMap

Public-service transparency web app for Bangladesh.

## Database setup (every team member)
1. Start Apache and MySQL in XAMPP.
2. Open http://localhost/phpmyadmin → Import tab.
3. Import `database/schema.sql`, then `database/seed.sql`.
4. In the `backend` folder run `npm install` and then `npm run migrate` (applies the Module 2 database changes; run it again after every `git pull`).

## Git rules
- Never commit to `main` or `dev` directly.
- Work on `feature/...` branches and open a Pull Request into `dev`.
- Run `git pull origin dev` before starting work.

## Module 2
See `docs/MODULE2_TEAM_BOUNDARIES.md` for who owns which folder and how to add a feature.
Map: open http://localhost:5173/map (offices need coordinates; admins set them in Admin > Edit office).
