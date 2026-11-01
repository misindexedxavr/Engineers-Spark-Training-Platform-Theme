// Keep the CTFd Jinja template aligned with Vite's cache-busted asset names.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const index = fs.readFileSync(path.join(here, "static", "index.html"), "utf8");
const js = index.match(/src="([^"]+\.js)"/)?.[1];
const css = index.match(/href="([^"]+\.css)"/)?.[1];

if (!js || !css) throw new Error("Built Vite assets were not found in static/index.html");

const templatePath = path.join(here, "templates", "base.html");
let template = fs.readFileSync(templatePath, "utf8");

// Match any previous theme name, so a renamed theme cannot keep stale hashes.
template = template.replace(/href="\/themes\/[^/]+\/static\/[^\"]+\.css"/g, `href="${css}"`);
template = template.replace(/src="\/themes\/[^/]+\/static\/[^\"]+\.js"/g, `src="${js}"`);
fs.writeFileSync(templatePath, template, "utf8");

console.log(`Synced CTFd template assets:\n  CSS ${css}\n  JS  ${js}`);
