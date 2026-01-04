import { useMemo, useState } from 'react';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
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
  { key: 'date', label: 'Date' },
];

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

  const uniqueTracks = useMemo(() => Array.from(new Set(dataset.map((row) => row.track))).sort(), [dataset]);
  const uniqueCars = useMemo(() => Array.from(new Set(dataset.map((row) => row.car))).sort(), [dataset]);
  const trackSelectValue = uniqueTracks.includes(filters.track) ? filters.track : '';
  const carSelectValue = uniqueCars.includes(filters.car) ? filters.car : '';

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
        <label className="space-y-2 text-sm uppercase tracking-wide text-[var(--muted)]">
          <span>Track</span>
          <input
            placeholder="Cari track"
            value={filters.track}
            onChange={(event) => setFilters((prev) => ({ ...prev, track: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm uppercase tracking-wide text-[var(--muted)]">
          <span>Car</span>
          <input
            placeholder="Cari mobil"
            value={filters.car}
            onChange={(event) => setFilters((prev) => ({ ...prev, car: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm uppercase tracking-wide text-[var(--muted)]">
          <span>Preset Track</span>
          <select value={trackSelectValue} onChange={(event) => setFilters((prev) => ({ ...prev, track: event.target.value }))}>
            <option value="">Semua track</option>
            {uniqueTracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm uppercase tracking-wide text-[var(--muted)]">
          <span>Preset Car</span>
          <select value={carSelectValue} onChange={(event) => setFilters((prev) => ({ ...prev, car: event.target.value }))}>
            <option value="">Semua mobil</option>
            {uniqueCars.map((car) => (
              <option key={car} value={car}>
                {car}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>
          {sorted.length} lap&nbsp;•&nbsp;{filters.track || filters.car ? 'Filter aktif' : 'Semua data'}
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
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-[var(--muted)]">
                    Tidak ada data yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                sorted.map((row, index) => {
                  const isPb = pbByTrack.get(row.track)?.laptime_ms === row.laptime_ms;
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
                        {isPb && <span className="badge-pb ml-3">PB</span>}
                      </td>
                      <td>{row.date}</td>
                      <td className="text-xs text-[var(--muted)]">Hotlap</td>
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
