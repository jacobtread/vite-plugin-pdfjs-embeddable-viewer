import fs from "fs";
import path from "path";
import https from "https";
import os from "os";
import { execFile } from "child_process";
import { fileURLToPath } from "url";

const VERSION = "5.4.296";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const VENDOR_DIR = path.join(ROOT, "vendor");
const MODERN_DIR = path.join(VENDOR_DIR, "pdfjs");
const LEGACY_DIR = path.join(VENDOR_DIR, "pdfjs-legacy");

function getPrebuiltModernBrowsersURL(version) {
    return `https://github.com/mozilla/pdf.js/releases/download/v${version}/pdfjs-${version}-dist.zip`;
}

function getPrebuiltOlderBrowsersURL(version) {
    return `https://github.com/mozilla/pdf.js/releases/download/v${version}/pdfjs-${version}-legacy-dist.zip`;
}

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);

        const get = (currentUrl) => {
            https.get(currentUrl, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Follow redirect (GitHub will issue 302)
                    const nextUrl = new URL(res.headers.location, currentUrl).toString();
                    res.resume(); // discard current response
                    get(nextUrl);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to download ${currentUrl}: ${res.statusCode}`));
                    return;
                }
                res.pipe(file);
                file.on("finish", () => file.close(() => resolve(dest)));
            }).on("error", (err) => {
                fs.unlink(dest, () => reject(err));
            });
        };

        get(url);
    });
}

async function extractZip(zipPath, destDir) {
    await fs.promises.mkdir(destDir, { recursive: true });

    return new Promise((resolve, reject) => {
        const isWin = os.platform() === "win32";
        const cmd = isWin ? "powershell" : "unzip";
        const args = isWin
            ? ["-Command", `Expand-Archive -Force '${zipPath}' '${destDir}'`]
            : ["-q", zipPath, "-d", destDir];

        execFile(cmd, args, (err) => {
            if (err) reject(new Error(`Extraction failed: ${err.message}`));
            else resolve();
        });
    });
}

async function main() {
    try {
        const modernURL = getPrebuiltModernBrowsersURL(VERSION);
        const legacyURL = getPrebuiltOlderBrowsersURL(VERSION);

        await fs.promises.rm(MODERN_DIR, { recursive: true, force: true });
        await fs.promises.rm(LEGACY_DIR, { recursive: true, force: true });

        const tmpModern = path.join(os.tmpdir(), `pdfjs-modern-${VERSION}.zip`);
        const tmpLegacy = path.join(os.tmpdir(), `pdfjs-legacy-${VERSION}.zip`);

        await Promise.all([
            downloadFile(modernURL, tmpModern)
                //    
                .then(() => extractZip(tmpModern, MODERN_DIR)),
            //
            downloadFile(legacyURL, tmpLegacy)
                //
                .then(() => extractZip(tmpLegacy, LEGACY_DIR))
        ])


        fs.unlinkSync(tmpModern);
        fs.unlinkSync(tmpLegacy);

        console.log("vendor download complete")
    } catch (err) {
        console.error("failed to get pdfjs", err);
        process.exit(1);
    }
}

main();
