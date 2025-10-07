# Vite plugin pdfjs embeddable viewer

This is a vite plugin which makes it easy to embed the [Mozilla pdf.js](https://github.com/mozilla/pdf.js/) PDF viewer into your 
project.

This plugin exposes options to make it easy to configure for use cases such as:
- Disabling JavaScript
- Allow viewing PDF's from another Origin

# Config

## Basic Embedding

Below is a basic configuration you probably also want to look at the other options below to
enable some of the features and options

```ts
// vite.config.ts
import pdfjsEmbeddableViewer from "vite-plugin-pdfjs-embeddable-viewer";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pdfjsEmbeddableViewer(),
  ],
});
```

## Disabling JavaScript

For security reasons you probably don't want PDF's running JavaScript, the following setup disables JavaScript in PDF files: 


```ts
// vite.config.ts
import pdfjsEmbeddableViewer from "vite-plugin-pdfjs-embeddable-viewer";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pdfjsEmbeddableViewer({
      options: {
        enableScripting: false,
      },
    }),
  ],
});
```

## Disable Cross Origin Check

By default the pdf.js viewer prevents cross origin document loading. You can disable
this default behavior using "allowCrossOrigin"

```ts
// vite.config.ts
import pdfjsEmbeddableViewer from "vite-plugin-pdfjs-embeddable-viewer";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pdfjsEmbeddableViewer({
      allowCrossOrigin: true, 
    }),
  ],
});
```

## Include Credentials

To include credentials in the request (Cookies, ...etc) use the following option:

```ts
// vite.config.ts
import pdfjsEmbeddableViewer from "vite-plugin-pdfjs-embeddable-viewer";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pdfjsEmbeddableViewer({
      openOptions: { 
        withCredentials: true 
      }
    }),
  ],
});
```

# Building

To build yourself you must run the following command to download pdfjs:

```
npm run setup:pdfjs
```

The version downloaded will be based on the version specified in `scripts/fetchPdfjs.js`