import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    webExtension({
      // Your manifest.json file is the entry point for the plugin
      manifest: 'manifest.json',
      // The plugin will automatically detect and bundle your
      // background.js, content.js, popup.js, and any assets
      // referenced in manifest.json or your HTML/CSS/JS.
      // It handles copying images from your 'images' folder as well.
    }),
  ],
  build: {
    // This specifies the output directory for your bundled extension.
    // All built files will be placed inside a 'dist' folder.
    outDir: 'dist',
    // This clears the 'dist' directory before each build, ensuring a clean slate.
    emptyOutDir: true,
  },
});