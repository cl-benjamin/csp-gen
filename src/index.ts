// processHTML.ts
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { JSDOM } from 'jsdom';

interface Config {
  cspHeaderName?: string;
}

function loadConfig(configPath = path.join(process.cwd(), 'config.js')): Config {
  try {
    const config = require(configPath);
    return config;
  } catch (err) {
    console.error(`Error loading config file: ${err}`);
    return {};
  }
}

function extractAndSetHash(filePath: string, configPath: string): void {
  const config: Config = loadConfig(configPath);
  const html: string = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const elementsWithStyle = document.querySelectorAll('[style]');
  let styleString = '';
  elementsWithStyle.forEach((element: Element) => {
    styleString += element.getAttribute('style') || '';
  });

  const hash = crypto.createHash('sha256').update(styleString).digest('base64');

  const cspHeaderName = config.cspHeaderName || 'Content-Security-Policy';
  const existingCSP = document.querySelector(`meta[http-equiv='${cspHeaderName}']`) as HTMLMetaElement | null;

  if (existingCSP) {
    const content = existingCSP.getAttribute('content');
    if (content) {
      existingCSP.setAttribute('content', `style-hash-${hash} ${content}`);
    }
  } else {
    const head = document.querySelector('head') as HTMLHeadElement;
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', cspHeaderName);
    meta.setAttribute('content', `style-hash-${hash}`);
    if (head.firstChild) {
      head.insertBefore(meta, head.firstChild);
    } else {
      head.appendChild(meta);
    }
  }

  const modifiedHTML = dom.serialize();
  fs.writeFileSync(filePath, modifiedHTML, 'utf8');
  console.log(`Hash added to ${cspHeaderName} in ${filePath}`);
}

function processHTMLFiles(dirPath: string, configPath: string): void {
  fs.readdirSync(dirPath).forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processHTMLFiles(filePath, configPath);
    } else if (path.extname(filePath) === '.html') {
      extractAndSetHash(filePath, configPath);
    }
  });
}

export { processHTMLFiles };