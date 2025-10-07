const VERSION = "5.4.296";

// TODO: Automate

function getPrebuiltModernBrowsers(version) {
    return `https://github.com/mozilla/pdf.js/releases/download/v${version}/pdfjs-${version}-dist.zip`;
}

function getPrebuiltOlderBrowsers(version) {
    return `https://github.com/mozilla/pdf.js/releases/download/v${version}/pdfjs-${version}-legacy-dist.zip`;
}
