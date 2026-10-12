# DurnitiMap

Public-service transparency web app for Bangladesh.

## Database setup (every team member)
1. Start Apache and MySQL in XAMPP.
2. Open http://localhost/phpmyadmin → Import tab.
3. Import `database/schema.sql`, then `database/seed.sql`.

## Git rules
- Never commit to `main` or `dev` directly.
- Work on `feature/...` branches and open a Pull Request into `dev`.
- Run `git pull origin dev` before starting work.