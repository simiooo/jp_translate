import { favicons } from "favicons";
import {writeFile} from 'fs/promises'
import {join} from 'path'
const source = "public/logo.png"; // Source image(s). `string`, `buffer` or array of `string`

const configuration = {
  path: "/", // Path for overriding default icons path. `string`
//   appName: null, // Your application's name. `string`
//   appShortName: null, // Your application's short_name. `string`. Optional. If not set, appName will be used
//   appDescription: null, // Your application's description. `string`
//   developerName: null, // Your (or your developer's) name. `string`
//   developerURL: null, // Your (or your developer's) URL. `string`
//   cacheBustingQueryParam: null, // Query parameter added to all URLs that acts as a cache busting system. `string | null`
  dir: "auto", // Primary text direction for name, short_name, and description
  lang: "en-US", // Primary language for name and short_name
  background: "#fff", // Background colour for flattened icons. `string`
//   theme_color: "#fff", // Theme color user for example in Android's task switcher. `string`
//   appleStatusBarStyle: "black-translucent", // Style for Apple status bar: "black-translucent", "default", "black". `string`
//   display: "standalone", // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
//   orientation: "any", // Default orientation: "any", "natural", "portrait" or "landscape". `string`
//   scope: "/", // set of URLs that the browser considers within your app
//   start_url: "/?homescreen=1", // Start URL when launching the application from a device. `string`
//   preferRelatedApplications: false, // Should the browser prompt the user to install the native companion app. `boolean`
//   relatedApplications: undefined, // Information about the native companion apps. This will only be used if `preferRelatedApplications` is `true`. `Array<{ id: string, url: string, platform: string }>`
//   version: "1.0", // Your application's version string. `string`
//   pixel_art: false, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
//   loadManifestWithCredentials: false, // Browsers don't send cookies when fetching a manifest, enable this to fix that. `boolean`
//   manifestMaskable: false, // Maskable source image(s) for manifest.json. "true" to use default source. More information at https://web.dev/maskable-icon/. `boolean`, `string`, `buffer` or array of `string`
  icons: {
    // Platform Options:
    // - offset - offset in percentage
    // - background:
    //   * false - use default
    //   * true - force use default, e.g. set background for Android icons
    //   * color - set background for the specified icons
    //
    android: false, // Create Android homescreen icon. `boolean` or `{ offset, background }` or an array of sources
    appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset, background }` or an array of sources
    appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
    favicons: true, // Create regular favicons. `boolean` or `{ offset, background }` or an array of sources
    windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
    yandex: false, // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
  },
//   shortcuts: [
//     // Your applications's Shortcuts (see: https://developer.mozilla.org/docs/Web/Manifest/shortcuts)
//     // Array of shortcut objects:
//     {
//       name: "View your Inbox", // The name of the shortcut. `string`
//       short_name: "inbox", // optionally, falls back to name. `string`
//       description: "View your inbox messages", // optionally, not used in any implemention yet. `string`
//       url: "/inbox", // The URL this shortcut should lead to. `string`
//       icon: "test/inbox_shortcut.png", // source image(s) for that shortcut. `string`, `buffer` or array of `string`
//     },
//     // more shortcuts objects
//   ],
};

try {
  const response = await favicons(source, configuration);
  response.images.forEach((image) => {
    writeFile(join("src/assets/", image.name), image.contents)
  })
  console.log(response.images); // Array of { name: string, contents: <buffer> }
  console.log(response.files); // Array of { name: string, contents: <string> }
  console.log(response.html); // Array of strings (html elements)
} catch (error) {
  console.log(error.message); // Error description e.g. "An unknown error has occurred"
}