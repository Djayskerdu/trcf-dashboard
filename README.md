# TRCF Youth Jam Dashboard

Next.js dashboard + Google Sheets database (through a Google Apps Script backend).
Everything — attendance, members, follow-ups, events, leaders, finance — is now added,
edited and deleted **from the dashboard** (Manage Data tab). No more typing in the sheet.

## Logging in

Every visitor must log in. Accounts live in an `Accounts` sheet (passwords are salted + hashed, never stored in plain text).

| Role   | Can do |
|--------|--------|
| leader | Everything, plus create/disable accounts, reset passwords, send push reminders, view history log |
| admin  | View and manage all data (attendance, members, follow-up, events, leaders, finance), QR scan, welcome QR emails |
| staff  | View attendance / events / leaders and **add** attendance |

The backend enforces these roles — hiding a tab in the UI is not the only protection.
Sessions last 7 days. 5 wrong passwords lock that username for 10 minutes.

## One-time setup

1. **Backend** — open the Google Sheet → Extensions → Apps Script → replace everything with `apps-script/Code.gs`.
2. In `setupFirstLeader()` set your username / name / temporary password, then **Run** it once (approve permissions). This creates the `Accounts` sheet.
3. Project Settings → **Script properties** → add `ONESIGNAL_API_KEY` (your OneSignal REST API key). Only needed for push reminders.
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** (Keep "Execute as: Me" and "Who has access: Anyone" — the login system is what protects the data.) Keeping the same deployment keeps the same URL.
5. **Frontend** — `npm install`, then `npm run dev` (or deploy to Vercel). If your script URL changed, set `GAS_URL` (see `.env.example`).
6. Log in, click **Change password**, then create accounts for your team under **Admin → Accounts**.

Forgot the only leader password? Run `resetPasswordFromEditor()` in the Apps Script editor.

## Project layout

```
apps-script/Code.gs      Backend (paste into Apps Script)
app/page.jsx             Dashboard (all the existing tabs)
app/components/          LoginScreen, ManageData, AccountsPanel, ChangePassword, Modal
app/lib/api.js           Session + API helper
app/lib/access.js        Which role sees which tabs
app/lib/tables.js        Form definitions per sheet (keep in sync with TABLES in Code.gs)
app/api/gas/route.js     Server proxy to Apps Script
```

## Notes

- Editing the sheet by hand still works (the `onEdit` first-timer automation is kept).
- Adding a **First Timer = Yes** attendance record automatically creates the Member ID and Follow Up entry, same as before.
- If a row was changed/removed in the sheet while someone had the old copy open, saving is refused with "Refresh and try again" instead of overwriting the wrong row.
