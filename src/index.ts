import { normalizePath, type Plugin } from "vite";
import path from "node:path";
import { viteStaticCopy, type RenameFunc } from "vite-plugin-static-copy";
import { fileURLToPath } from "node:url";

interface PdfjsEmbeddableViewerOptions {
  /**
   * When enabled the "legacy" version of PDF.js designed to support
   * older browsers will be used instead
   *
   * (Default: false)
   */
  legacy?: boolean;

  /**
   * Options to provide to the viewer, you can find the list
   * of options in the source code here:
   *
   * https://github.com/mozilla/pdf.js/blob/master/web/app_options.js
   */
  options?: Record<string, unknown>;

  /**
   * When enabled the cross origin check that prevent documents from being loaded
   * from a different origin will be removed.
   *
   * (Default: false)
   */
  allowCrossOrigin?: boolean;

  /**
   * Additional configuration options to provide PDFViewerApplication.open() / getDocument
   * such as the withCredentials: true option that sends credentials with requests
   */
  openOptions?: object;

  /**
   * Custom output directory path name to use when producing the pdfjs
   * files
   */
  customOutputPath?: string;
}

export default function pdfjsEmbeddableViewer(
  config: PdfjsEmbeddableViewerOptions
): Plugin[] {
  const legacy = config.legacy ?? false;
  const viewerDirName = legacy ? "pdfjs-legacy" : "pdfjs";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const viewerDirPath = path.resolve(__dirname, "../vendor", viewerDirName);
  const outputPath = config.customOutputPath ?? "pdfjs";

  const globPath = normalizePath(path.join(viewerDirPath, "**/*"));

  const rename: RenameFunc = (_fileName, _fileExtension, fullPath) => {
    return normalizePath(path.relative(viewerDirPath, fullPath));
  };

  return [
    {
      name: "vite-plugin-pdfjs-embeddable-viewer",
    },
    ...viteStaticCopy({
      targets: [
        // Copy all source files
        {
          src: globPath,
          dest: outputPath,
          rename,
        },
        // Patch viewer.js
        {
          src: [normalizePath(path.join(viewerDirPath, "web/viewer.mjs"))],
          dest: outputPath,
          transform: (content, _fileName) => {
            const allowCrossOrigin = config.allowCrossOrigin ?? false;
            if (allowCrossOrigin) {
              content = content.replace("validateFileURL(file);", "");
            }

            return content;
          },
          rename,
        },
        // Patch viewer.html
        {
          src: [normalizePath(path.join(viewerDirPath, "web/viewer.html"))],
          dest: outputPath,
          transform: (content, _fileName) => {
            const appOptions = JSON.stringify(config.options ?? {});
            const openOptions = JSON.stringify(config.openOptions ?? {});

            content = content.replace(
              "</head>",
              `
<script>
document.addEventListener("webviewerloaded", (event) => {
    const viewerWindow = event.detail.source;
    const AppOptions = viewerWindow.PDFViewerApplicationOptions;
    const PDFViewerApplication = viewerWindow.PDFViewerApplication;

    const appOptions = ${appOptions};
    AppOptions.setAll(appOptions);

    const originalOpen = PDFViewerApplication.open;
    const customOptions = ${openOptions};

    PDFViewerApplication.open = function(args) {
        return originalOpen.call(this, { ...args, ...customOptions })
    };
})
</script>
</head>
            `
            );

            return content;
          },
          rename,
        },
      ],
    }),
  ];
}
