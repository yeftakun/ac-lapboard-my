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

function formatDelta(ms) {
  if (!Number.isFinite(ms)) return null;
  const sign = ms > 0 ? '+' : ms < 0 ? '-' : '';
  const absMs = Math.abs(ms);
  const minutes = Math.floor(absMs / 60000);
  const remainingMs = absMs % 60000;
  const seconds = Math.floor(remainingMs / 1000);
  const millis = remainingMs % 1000;

  if (minutes === 0) {
    return `${sign}${seconds}.${String(millis).padStart(3, '0')}`;
  }

  return `${sign}${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function keyOf(lap) {
  return `${lap.car}__${lap.track}`;
}

function pickBaseLap(lap) {
  const ms = Number(lap.laptime_ms);
  return {
    car: lap.car,
    track: lap.track,
    date: lap.date,
    laptime_ms: Number.isFinite(ms) ? ms : null,
    laptime_display: formatLap(Number.isFinite(ms) ? ms : null),
  };
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`Failed to read ${filePath}: ${err.message}`);
    return [];
  }
}

function mapByKey(arr) {
  const map = new Map();
  for (const item of arr) {
    map.set(keyOf(item), item);
  }
  return map;
}

const iniPath = path.resolve('data/personalbest.ini');
const outDir = path.resolve('src/data');
const outPath = path.join(outDir, 'laptime.json');
const oldPath = path.join(outDir, 'old_laptime.json');
const tempPath = path.join(outDir, 'temp_laptime.json');
const metaPath = path.join(outDir, 'meta.json');

const formatDateOnlyUTC = (dateLike) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(dateLike);

fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(iniPath)) {
  console.warn(`Skipping conversion: missing ${iniPath}`);
  fs.writeFileSync(outPath, '[]');
  fs.writeFileSync(oldPath, '[]');
  fs.writeFileSync(tempPath, '[]');
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ lastModifiedMs: null, lastModifiedISO: null, lastModifiedDateUTC: null }, null, 2),
    'utf-8',
  );
  process.exit(0);
}

const text = fs.readFileSync(iniPath, 'utf-8');
const lines = text.split(/\r?\n/);
const iniStats = fs.statSync(iniPath);

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

const currentLapsWithDelta = readJsonArray(outPath);
const currentMap = mapByKey(currentLapsWithDelta);
const oldBaseline = readJsonArray(oldPath).map(pickBaseLap);
const oldMap = mapByKey(oldBaseline);
const newOldMap = new Map(oldMap);

const nextLaps = rows.map(pickBaseLap);
fs.writeFileSync(tempPath, JSON.stringify(nextLaps, null, 2), 'utf-8');

const updatedRows = nextLaps.map((lap) => {
  const key = keyOf(lap);
  const curr = currentMap.get(key);
  const prev = oldMap.get(key);

  let delta = null;

  if (curr && Number.isFinite(curr.laptime_ms) && curr.laptime_ms === lap.laptime_ms) {
    delta = Number.isFinite(curr.old_ms) ? curr.old_ms : null; // unchanged; keep delta
  } else if (curr && Number.isFinite(curr.laptime_ms)) {
    delta = lap.laptime_ms - curr.laptime_ms;
    newOldMap.set(key, pickBaseLap(curr)); // only update old when lap actually changed
  } else if (prev && Number.isFinite(prev.laptime_ms)) {
    delta = lap.laptime_ms - prev.laptime_ms;
  }

  return {
    ...lap,
    old_ms: delta,
    old_display: formatDelta(delta),
  };
});

fs.writeFileSync(outPath, JSON.stringify(updatedRows, null, 2), 'utf-8');
console.log(`Converted ${updatedRows.length} laps → ${path.relative(process.cwd(), outPath)}`);

const oldArray = Array.from(newOldMap.values()).map(pickBaseLap);
fs.writeFileSync(oldPath, JSON.stringify(oldArray, null, 2), 'utf-8');
console.log(`Updated old laps → ${path.relative(process.cwd(), oldPath)}`);

const meta = {
  lastModifiedMs: iniStats.mtimeMs,
  lastModifiedISO: iniStats.mtime.toISOString(),
  lastModifiedDateUTC: formatDateOnlyUTC(iniStats.mtime),
};

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
console.log(`Wrote meta → ${path.relative(process.cwd(), metaPath)}`);
