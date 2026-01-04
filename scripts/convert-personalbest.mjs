import fs from 'fs';
import path from 'path';

function stripPrefix(value) {
  return typeof value === 'string' ? value.replace(/^(ks_|ks-)/i, '') : value;
}

function prettifyLabel(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word) || word.length <= 3) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function toLocalDateYYYYMMDD(epochMs, offsetHours = 8) {
  const date = new Date(epochMs + offsetHours * 3600 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLap(ms) {
  if (!Number.isFinite(ms)) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

const iniPath = path.resolve('data/personalbest.ini');
const outDir = path.resolve('src/data');
const outPath = path.join(outDir, 'laptime.json');

fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(iniPath)) {
  console.warn(`Skipping conversion: missing ${iniPath}`);
  fs.writeFileSync(outPath, '[]');
  process.exit(0);
}

const text = fs.readFileSync(iniPath, 'utf-8');
const lines = text.split(/\r?\n/);

const rows = [];
let current = null;

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line) continue;

  if (line.startsWith('[') && line.endsWith(']')) {
    const section = line.slice(1, -1);
    const delimiter = section.indexOf('@');
    const rawCar = delimiter >= 0 ? section.slice(0, delimiter) : section;
    const rawTrack = delimiter >= 0 ? section.slice(delimiter + 1) : 'UNKNOWN';
    const cleanedCar = stripPrefix(rawCar);
    const cleanedTrack = stripPrefix(rawTrack);
    current = {
      car: prettifyLabel(cleanedCar.replace(/[_-]+/g, ' ').trim()),
      track: prettifyLabel(cleanedTrack.replace(/[_-]+/g, ' ').trim()),
      date: null,
      laptime_ms: null,
    };
    continue;
  }

  if (!current) continue;
  const [key, rawValue] = line.split('=');
  if (!key || rawValue == null) continue;

  if (key === 'DATE') {
    const epoch = Number(rawValue);
    if (Number.isFinite(epoch)) {
      current.date = toLocalDateYYYYMMDD(epoch);
    }
  } else if (key === 'TIME') {
    const lap = Number(rawValue);
    if (Number.isFinite(lap)) {
      current.laptime_ms = lap;
    }
  }

  if (current.date && Number.isFinite(current.laptime_ms)) {
    rows.push({
      ...current,
      laptime_display: formatLap(current.laptime_ms),
    });
    current = null;
  }
}

fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf-8');
console.log(`Converted ${rows.length} laps → ${path.relative(process.cwd(), outPath)}`);
