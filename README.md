## LakbAI – System Overview

LakbAI is a multi-platform transportation application composed of three main projects:

- LakbAI-Mobile: React Native (Expo) app for passengers/drivers
- LakbAI-API: PHP backend API (Auth, Users, Passengers, etc.)
- LakbAI-Admin: React web admin for internal operations

This document gives a high-level picture of how things fit together, the core architecture decisions, and quick-start instructions for each part.

### Architecture at a Glance

- Mobile (Expo + React Native + TypeScript)
  - Clean modular auth: config → services → hooks/context → UI
  - Auth0 (via expo-auth-session) with PKCE; optional backend token exchange
  - AsyncStorage-based session management and user sync with the API
  - Expo Router for navigation and route-based screens

- API (PHP)
  - Auth endpoints, user management, passenger controller
  - Auth0 integration endpoints and user synchronization
  - Request validation, repository and service layers

- Admin (React + Vite)
  - Operational dashboards
  - User management and system configuration

### Repositories/Directories

```
LakbAI/
  LakbAI-Mobile/    # Expo app
  LakbAI-API/       # PHP backend API
  LakbAI-Admin/     # React web admin
```

### Core Mobile Concepts

- Authentication
  - `shared/services/authService.ts`: Auth0 discovery, PKCE, token exchange
  - `shared/services/sessionManager.ts`: Persist/clear session in AsyncStorage, sync to API
  - `shared/hooks/useAuth.ts`: Single hook orchestrating login/logout/session
  - `shared/providers/AuthProvider.tsx`: Context provider app-wide

- Routing
  - Expo Router under `app/` (e.g., `app/index.tsx`, `app/auth/login.tsx`, `app/passenger/home.tsx`)

- UI
  - Screens under `screens/**/views`
  - Styles under `screens/**/styles`

- Config
  - Auth0 and developer settings under `config/`

### Authentication Flow (Mobile)

1. User chooses Quick Sign-In (Auth0) or Traditional Login
2. For Quick Sign-In
   - `authService.authenticate()` performs Auth0 PKCE flow
   - Tokens fetched (direct or via backend), user info retrieved
   - `sessionManager` stores session, `useAuth` updates state
3. For Traditional Login
   - `authService.login()` placeholder exists; integrate your API
4. On success, user is routed to the appropriate home screen

### API Highlights (LakbAI-API)

- Routing in `routes/` (e.g., `api.php`, `auth_routes.php`)
- Controllers in `controllers/` (Auth, User, Passenger)
- Services and repositories in `src/services`, `src/repositories`
- Config in `config/` (db, auth0)

### Admin Highlights (LakbAI-Admin)

- Vite-based React app
- `src/components` and `src/pages` contain admin UI components and screens

---

## Quick Start

### Mobile (Expo)

Prereqs: Node LTS, npm, Xcode/Android Studio as needed.

1. Install deps
   ```bash
   cd LakbAI-Mobile
   npm install
   ```
2. Configure Auth0
   - Update values in `config/auth0Config.ts` and/or `config/auth.ts`
3. Run
   ```bash
   npx expo start
   ```

Notes:
- If using iOS Simulator, ensure bundle identifier and redirect URI match your Auth0 settings.

### API (PHP)

Prereqs: PHP 8+, Composer, a configured database.

1. Install deps
   ```bash
   cd LakbAI-API
   composer install
   ```
2. Configure
   - Set DB/Auth0 values in `config/db.php` and `config/auth0_config.php`
3. Run locally (choose your preferred PHP server) or serve via Apache/Nginx

### Admin (React Web)

1. Install deps
   ```bash
   cd LakbAI-Admin
   npm install
   ```
2. Run
   ```bash
   npm run dev
   ```

---

## Development Notes

- TypeScript: enabled in Mobile for type safety
- Linting: ESLint configured across projects
- Assets: mobile images under `LakbAI-Mobile/assets/images`
- Routing (mobile): use `app/*` file-based routes with Expo Router

### Common Tasks

- Update Auth branding/logo: `LakbAI-Mobile/assets/images/logofinal.png`
- Add new mobile screen: create under `screens/.../views`, add styles, and add route under `app/`
- Session reset during dev: use `sessionManager.clearAllAuthData()` from a debug action if needed

### Security & Privacy

- PKCE for OAuth code flow
- Ephemeral sessions supported on iOS (when configured)
- Tokens stored in AsyncStorage; consider secure storage for production hardening
- Avoid logging sensitive tokens and PII

### Roadmap / Next Steps

- Hook up traditional username/password login to API
- Add e2e auth tests (mobile)
- Tighten token storage (e.g., Expo SecureStore)
- Expand Admin dashboards for operations and analytics

---

## Troubleshooting

- Expo CLI not found / version warnings
  - Use local CLI: `npx expo start`
- iOS bundler cannot resolve image
  - Check the relative path from the component and ensure asset exists in `assets/images`
- Type errors
  - Review `tsconfig.json` and ensure imports match file paths and module settings

---

## License

Internal project. All rights reserved.


