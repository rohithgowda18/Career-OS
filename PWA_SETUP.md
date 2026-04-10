# PWA Setup Guide

Your Event Application Tracker is now configured as a Progressive Web App (PWA)! 

## What's Been Configured

✅ **Service Worker** - Handles offline functionality and caching
✅ **Web App Manifest** - Enables installation on home screens  
✅ **PWA Meta Tags** - Added to HTML for better PWA support
✅ **Workbox Integration** - Automatic asset caching and network fallback

## Required: Add PWA Icons

For the PWA to work properly, you need to add icon files to `client/public/`. These are currently *required* by the manifest but not included:

### Required Icon Files:
- `pwa-192x192.png` - App icon (192x192)
- `pwa-512x512.png` - App icon (512x512)
- `pwa-maskable-192x192.png` - Maskable icon for adaptive designs (192x192)
- `pwa-maskable-512x512.png` - Maskable icon for adaptive designs (512x512)

### Optional Screenshot Files (for app store display):
- `pwa-screenshot-1.png` - Mobile screenshot (540x720)
- `pwa-screenshot-2.png` - Desktop screenshot (1280x720)

### Optional Shortcut Icon:
- `pwa-shortcut-96x96.png` - Icon for app shortcuts (96x96)

**Icon Guidelines:**
- Icons should have at least 5px padding from the edge for maskable variants
- Use PNG format with transparency where appropriate
- **Quick solution**: Use a tool like https://www.pwabuilder.com or https://www.favicon-generator.org to generate icons

## Build & Test

```bash
# Build the PWA
npm run build

# Start the server
npm start
```

Then visit the app in Chrome/Edge and:
1. Look for "Install" button in the address bar
2. Or use the browser menu: Three dots → "Install app"

## Features Enabled

### Caching Strategy
- **Static Assets**: Cache-first (CSS, JS, images, fonts)
- **API Calls**: Network-first with 5-minute cache fallback
- **HTML**: Network-first with cache fallback

### Offline Support
- App works offline using cached assets
- API calls show cached data when offline
- Automatic sync when back online

### Auto-Update
- Service worker checks for updates automatically
- Users are notified of new versions
- Updates install in the background

## File Structure

```
client/
  public/
    manifest.json          ← PWA manifest
    pwa-192x192.png        ← (Add these icons)
    pwa-512x512.png
    pwa-maskable-192x192.png
    pwa-maskable-512x512.png
  src/
    sw.ts                  ← Service worker base
    main.tsx              ← Contains SW registration
  index.html              ← Contains PWA meta tags
```

## Configuration Files

### `vite.config.ts`
- Configured with `VitePWA` plugin
- Workbox caching strategies defined
- Auto-generates service worker

### `client/public/manifest.json`
- PWA metadata (name, icons, theme colors)
- Install behavior configuration
- App shortcuts

### `client/index.html`
- PWA meta tags for mobile platforms
- Apple touch icons
- Theme color specifications

## Testing Checklist

- [ ] Add icon files to `client/public/`
- [ ] Run `npm run build`
- [ ] Run `npm start`
- [ ] Open in Chrome/Edge and test install button
- [ ] Test offline functionality (DevTools → Network → Offline)
- [ ] Test on mobile device
- [ ] Check Web App Install Banners
- [ ] Verify service worker in DevTools → Application → Service Workers

## Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [vite-plugin-pwa](https://vite-plugin-pwa.netlify.app/)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)

## Customization

### Change Theme Colors
Edit `vite.config.ts` and `client/public/manifest.json`:
- `theme_color` - Top bar color
- `background_color` - Splash screen color

### Add More Caching Rules
Edit the `workbox.runtimeCaching` array in `vite.config.ts` to add patterns for additional APIs or resources.

### Customize App Name
Edit in three places:
1. `vite.config.ts` - VitePWA config
2. `client/public/manifest.json` - name and short_name
3. `client/index.html` - apple-mobile-web-app-title

## Troubleshooting

**"Service worker failed to register"**
- Check browser console for errors
- Ensure you're using HTTPS (or localhost for development)
- Check that `/sw.js` is being generated in the build output

**Icons not showing**
- Add the PNG files to `client/public/`
- Verify file names match the manifest
- Check file format is PNG with transparency

**App not installable**
- Ensure manifest.json is valid JSON
- Check HTML has `<meta name="theme-color">`
- Verify icons are 192x192 and 512x512 minimum
- Service worker must be successfully registered

---

**Next Step**: Generate or design PNG icons and place them in `client/public/`!
