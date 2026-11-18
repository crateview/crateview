import { readFileSync } from 'node:fs';
import { recordPublication } from './docs-publication.mjs';

const request = JSON.parse(readFileSync(process.env.REQUEST_FILE, 'utf8'));
const version = request.tag.replace(/\.\d+$/, '');
const capture = JSON.parse(readFileSync(`apps/website/public/images/docs/${version}/capture.json`, 'utf8'));
recordPublication(process.cwd(), request, capture);
