# James' Ladder on Google Play

The Android app is the same web app inside a Capacitor wrapper. `index.html` stays the
one source; the `android/` folder is the wrapper.

| | |
|---|---|
| App ID | `io.github.drtumorface.jamesladder` (permanent once published) |
| Version | 1.0.0, version code 1 (`android/app/build.gradle`) |
| Android | 7.0 and up (SDK 24), targets SDK 36 |
| Permissions | none asked for |

## Everyday commands

Run these in the project folder.

```bash
npm install
```
Once, after cloning.

```bash
npm run apk
```
Copies the app into `www/`, syncs it into `android/` and builds a test APK at
`android/app/build/outputs/apk/debug/app-debug.apk`.

```bash
npm run open
```
Opens the project in Android Studio.

After changing `index.html`, run `npm run sync` (or `npm run apk`) so the Android
project gets the new copy. `npm run icons` redraws the launcher icon and launch
screen from `icons/make_icons.py`.

The build needs `android/local.properties` pointing at the Android SDK. It is not
in git because the path is per computer. Android Studio writes it, or create it with:

```
sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk
```

## Try it on your phone

**USB.** On the phone, open Settings → About phone and tap *Build number* seven
times. Then go to Settings → System → Developer options and turn on *USB
debugging*. Plug the phone in and accept the prompt on it, then run:

```bash
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
```

**Without a cable.** Copy `app-debug.apk` to the phone (Drive, email, USB storage)
and open it. Android asks you to allow installs from that app once.

The test build is signed with a throwaway debug key. Uninstall it before
installing the Play Store version.

### What to check on the phone

- The launcher icon and the cream launch screen look right.
- The status bar and gesture bar don't cover the top bar, bottom tabs or sheets,
  in portrait and landscape.
- The status bar icons stay readable after ☀/☾ Theme.
- Back closes the chord card or a sheet, then a screen, then puts the app away.
- Sound plays on the first tap, through headphones and the speaker. It stops when
  you switch apps.
- Piano and guitars play straight away, with no download.
- The privacy link opens, and back returns to your sketch.
- Close the app from Recents and reopen it: your sketch is still there.

## Release build (you do this, not Claude)

The signing key proves updates come from you. Claude never handles it or its
passwords.

1. In Android Studio (`npm run open`), choose **Build → Generate Signed App Bundle
   or APK → Android App Bundle**.
2. **Create new…** key store. Save it **outside** this folder (for example
   `Documents\keys\james-ladder-upload.jks`), choose passwords and fill in your
   name. Key alias: `upload`.
3. Pick the **release** variant and finish. The bundle lands at
   `android/app/release/app-release.aab`.
4. Back up the `.jks` file and its passwords, for example in a password manager.
   Play keeps the key that actually signs the app (Play App Signing), so a lost
   upload key can be reset through Play support. That takes days, so don't lose it.

For each update, raise `versionCode` (1 → 2 → 3…) and `versionName` in
`android/app/build.gradle`, then build a new bundle with the same key.

## Play Console

1. **Account.** Sign up at play.google.com/console: a one-off US$25 fee and an
   identity check. Start early, because verification can take a few days.
2. **Create app.** Name *James' Ladder*, type *App*, *Free*. Free can't later
   become paid, but in-app purchases can be added later.
3. **Closed test first.** New personal accounts must run a closed test with at
   least **12 testers opted in for 14 days in a row** before production is unlocked.
   Upload `app-release.aab` to a closed testing track and invite testers by email
   or Google Group.
4. **App content** answers:
   - Privacy policy: `https://drtumorface-sys.github.io/James-Ladder/privacy.html`
   - Ads: no
   - Data safety: the app collects and shares **no** user data
   - App access: everything works without an account
   - Target audience: 13 and over (choosing under-13 brings in the Families policy)
   - Content rating questionnaire: no violence, user content, gambling or data
     sharing, which gives an "Everyone" / PEGI 3 rating
5. **Store listing.** Category *Music & Audio*; short and full description; a
   512×512 icon (`icons/icon-512.png`); a 1024×500 feature graphic; at least 2
   phone screenshots.
6. After the 14 days, apply for **production access** from the dashboard and
   answer the questions about your test.
