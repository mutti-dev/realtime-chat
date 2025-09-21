# realtime-chat — developer notes

# To run ngrok   ngrok http --domain=equal-useful-buck.ngrok-free.app 8000

This README contains quick instructions on how to change the codebase, what to watch out for, and common commands for local development.

Summary
- Backend: Django + Channels (websockets). App module: api/chat.
- Frontend: React Native app under `app/src`.
- Authentication: JWT tokens stored by the mobile client (secure module).
- File uploads: profile thumbnail via REST `/chat/profile/` (multipart/form-data). Message files are accepted via websocket base64 or REST if added.

Before you change anything
1. Create a git branch for your work.
2. Never commit secrets (env files, tokens). Use environment variables.
3. Run tests (if present) and lint before opening PR.

Backend: typical change workflow
1. Modify models in `api/chat/models.py`.
   - If you add/remove fields, create a migration:
     - python manage.py makemigrations
     - python manage.py migrate
   - If you add ImageField/FileField, ensure MEDIA_ROOT is configured in settings and your development server serves media.

2. Update serializers in `api/chat/serializers.py` to expose any new fields to the client.

3. If you change behavior or add endpoints:
   - Add or update views in `api/chat/views.py`.
   - Update `api/chat/urls.py` so the endpoint is reachable at `/chat/...`.

4. WebSocket consumer changes (real-time events):
   - Modify `api/chat/consumers.py`. Maintain event names (e.g. `message.send`, `user.update`) consistently between server and client.
   - Keep helper methods consistent: use `send_group(self, group, source, data)` to publish events.

5. After model/serializer changes:
   - Run migrations.
   - If you change authentication or tokens, re-authenticate the mobile client.

Image/file handling
- The consumer uses Pillow for server-side image resizing/compression. Ensure Pillow is installed in your Python environment.
- The REST profile endpoint (`POST /chat/profile/`) accepts multipart for `thumbnail` and JSON fields for `first_name`, `password`, `settings`, etc.
- Be mindful of file size limits (configured in consumer constants). Increase only if storage allows.

Frontend (React Native) changes
1. Global state is in `app/src/core/global.js` (zustand). Keep this in sync with server fields:
   - `user` object, `themeMode`, `notificationsEnabled`.
2. Theme & notifications:
   - App reads `themeMode` and `notificationsEnabled` from global state. Update `login`, `init`, and response handlers to set these when the server returns user data.
   - Persist changes via websocket first (if connected) or REST fallback to `/chat/profile/`. Use `secure.get('tokens')` to attach Authorization headers.
3. Uploading thumbnail:
   - Use `useGlobal().uploadThumbnail(file)` with a File-like object `{ uri, name, type }`. The client will POST FormData to `/chat/profile/` (authorized).
4. Messages & file uploads:
   - Text messages are sent over websocket `message.send`.
   - Media can be sent as base64 over websocket or via REST upload (prefer REST multipart to avoid base64 bloat).

Auth & tokens
- Tokens are stored using the `secure` helper in the client. For REST calls you must include `Authorization: Bearer <access>` (the client code reads tokens from `secure` and adds headers).
- If you change password on server, the client may need to re-login.

Common commands
- Backend
  - python -m venv .venv
  - .venv\Scripts\activate (Windows) / source .venv/bin/activate (mac/linux)
  - pip install -r requirements.txt
  - python manage.py makemigrations
  - python manage.py migrate
  - python manage.py runserver
  - For Channels development: daphne or run via manage.py runserver with ASGI configured
- Frontend (React Native)
  - npm install / yarn
  - npx react-native start
  - npx react-native run-android / run-ios (or use Expo if your project uses it)
  - Rebuild native app if you change native modules

Deployment & environment
- Use environment variables for secrets (DJANGO_SECRET_KEY, DATABASE_URL, ALLOWED_HOSTS, etc.).
- Configure MEDIA storage (S3 or other) for production.
- Ensure workers/consumers (Channels layers + Redis) are properly configured in production.

Troubleshooting tips
- Syntax errors in global.js: check braces and ensure only one export default exists.
- Websocket auth failures: verify token exists in `secure` and URL matches `ws://ADDRESS/chat/?token=...`.
- Image previews not showing: ensure utils.image handles data URIs and server absolute paths.
- After model changes always run makemigrations/migrate.

If you add features
- Update serializers and tests to cover new fields.
- Update the mobile app to read/modify new user fields from `useGlobal` store.
- Inform team about breaking API changes (event names or payloads).

Contact
- Add a short note here with your preferred contact (code reviewers) for large changes.

---

How to add any settings and bind with backend..example for notification

✅ Steps for Notifications
1. Backend (Django)

Add a field on your UserProfile or User model, for example:

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    notifications_enabled = models.BooleanField(default=True)


Make sure your /chat/profile/ API and user.update socket event include notifications_enabled in the serializer response.

2. Global Store (useGlobal.js)

You already did this 🎉

Key spots where you included notificationsEnabled:

init() → set from API on app start

login() → set from API after login

logout() → reset to null

updateSettings / updateUser / uploadThumbnail → update local state after API response

responseUserUpdate and responseThumbnail → update when server pushes changes

So the global store is ✅ done.

3. SettingsScreen UI

Add a Switch for notifications:

const notificationsEnabled = useGlobal(state => state.notificationsEnabled);
const updateSettings = useGlobal(state => state.updateSettings);

<Switch
  value={notificationsEnabled ?? true}
  onValueChange={(value) => updateSettings({ notifications_enabled: value })}
  thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
  trackColor={{ false: '#ccc', true: theme.colors.primary + '80' }}
/>


Now the toggle will:

Update UI immediately.

Call updateSettings() → sends change to API.

API response updates global state again → ensures consistency.

4. App Usage

Whenever you need to check if notifications are enabled in your app, read from the store:

const notificationsEnabled = useGlobal(state => state.notificationsEnabled);

if (notificationsEnabled) {
  // show in-app notification
}

🔁 Steps to Follow for Any New User Setting (like theme, notifications, language, etc.)

Backend → Add a field to user profile + expose via REST/Socket.

Global Store

Add a property in the state (like notificationsEnabled).

Initialize it in init() and login().

Reset in logout().

Update it in updateSettings, updateUser, uploadThumbnail, and socket responses (responseUserUpdate, responseThumbnail).

UI → Add a toggle, picker, or switch bound to that global store field.

Persistence → When user changes, call updateSettings({ newField: value }) so it’s saved backend-side.