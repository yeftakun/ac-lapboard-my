import { useMemo, useState } from 'react';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

const SORTABLE_FIELDS = [
  { key: 'track', label: 'Track' },
  { key: 'car', label: 'Car' },
  { key: 'laptime_ms', label: 'Lap' },
  { key: 'old_ms', label: 'Δ Lap' },
  { key: 'date', label: 'Date' },
];

function formatLap(ms) {
  if (!Number.isFinite(ms)) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export default function LapTable({ rows = [] }) {
  const [filters, setFilters] = useState({ track: '', car: '' });
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const dataset = Array.isArray(rows) ? rows : [];

  const pbByTrack = useMemo(() => {
    const map = new Map();
    for (const row of dataset) {
      const best = map.get(row.track);
      if (!best || row.laptime_ms < best.laptime_ms) {
        map.set(row.track, row);
      }
    }
    return map;
  }, [dataset]);

  const filtered = useMemo(() => {
    const trackQuery = normalize(filters.track || '');
    const carQuery = normalize(filters.car || '');
    return dataset.filter((row) => {
      const matchesTrack = trackQuery ? normalize(row.track).includes(trackQuery) : true;
      const matchesCar = carQuery ? normalize(row.car).includes(carQuery) : true;
      return matchesTrack && matchesCar;
    });
  }, [dataset, filters]);

  const sorted = useMemo(() => {
    const getValue = (row, key) => (key === 'date' ? new Date(row.date).getTime() : row[key]);
    const items = [...filtered];
    items.sort((a, b) => {
      const aValue = getValue(a, sortKey);
      const bValue = getValue(b, sortKey);
      if (aValue === bValue) return 0;
      if (sortDir === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    return items;
  }, [filtered, sortKey, sortDir]);

  const clearFilters = () => setFilters({ track: '', car: '' });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="filter-grid">
        <input
          className="filter-input"
          placeholder="Search track"
          aria-label="Search track"
          value={filters.track}
          onChange={(event) => setFilters((prev) => ({ ...prev, track: event.target.value }))}
        />
        <input
          className="filter-input"
          placeholder="Search car"
          aria-label="Search car"
          value={filters.car}
          onChange={(event) => setFilters((prev) => ({ ...prev, car: event.target.value }))}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>
          {sorted.length} lap&nbsp;•&nbsp;{filters.track || filters.car ? 'Filters on' : 'All entries'}
        </span>
        <button type="button" className="btn btn-ghost text-xs" onClick={clearFilters}>
          Reset filter
        </button>
      </div>
      <div className="table-wrapper overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {SORTABLE_FIELDS.map((field) => (
                  <th
                    key={field.key}
                    role="columnheader"
                    aria-sort={sortKey === field.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => toggleSort(field.key)}
                    className="cursor-pointer select-none"
                  >
                    {field.label}
                    {sortKey === field.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={SORTABLE_FIELDS.length} className="py-8 text-center text-sm text-[var(--muted)]">
                    Nothing matches your filter.
                  </td>
                </tr>
              ) : (
                sorted.map((row, index) => {
                  const isPb = pbByTrack.get(row.track)?.laptime_ms === row.laptime_ms;
                  const deltaMs = Number(row.old_ms);
                  const hasDelta = Number.isFinite(deltaMs);
                  const deltaDisplay = hasDelta ? row.old_display : '—';
                  const prevLapDisplay = hasDelta ? formatLap(row.laptime_ms - deltaMs) : null;
                  const deltaTone = hasDelta
                    ? deltaMs < 0
                      ? 'delta-better'
                      : deltaMs > 0
                        ? 'delta-worse'
                        : 'delta-even'
                    : 'delta-unknown';
                  return (
                    <tr key={`${row.track}-${row.car}-${row.date}-${index}`}>
                      <td className="font-medium">
                        <div className="flex flex-col">
                          <span>{row.track}</span>
                          <span className="text-xs text-[var(--muted)]">{dateFormatter.format(new Date(row.date))}</span>
                        </div>
                      </td>
                      <td>{row.car}</td>
                      <td className="tabular-nums text-lg font-semibold">
                        {row.laptime_display || `${Math.round(row.laptime_ms)} ms`}
                        {isPb && (
                          <span className="badge-pb ml-3" data-tooltip="Fastest lap on this track">
                            BL
                          </span>
                        )}
                      </td>
                      <td className="tabular-nums text-sm">
                        {hasDelta ? (
                          <span
                            className={`delta-text ${deltaTone}`}
                            data-tooltip={prevLapDisplay ? `Prev: ${prevLapDisplay}` : undefined}
                          >
                            {deltaDisplay}
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td>{row.date}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
