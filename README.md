# Assetto Corsa Lap Board

Lap time board mandiri yang mengadopsi struktur halaman `/assetto-corsa` dari personal site referensi. Proyek ini hanya fokus pada konten lap board dengan tema yang sama.

## Struktur

```
.
├─ data/
│  └─ personalbest.ini        # sumber asli dari game
├─ scripts/
│  └─ convert-personalbest.mjs # konversi INI → JSON
├─ src/
│  ├─ components/
│  │  └─ LapTable.jsx          # tabel interaktif (React)
│  ├─ data/
│  │  └─ laptime.json          # hasil konversi, di-import ke halaman
│  │  └─ config.json           # preferensi (featured lap)
│  ├─ layouts/
│  │  └─ Base.astro            # layout + tema
│  ├─ pages/
│  │  ├─ index.astro           # halaman utama lap board
│  │  └─ assetto-corsa.astro   # alias opsional (konten sama)
│  └─ styles/
│     └─ globals.css           # Tailwind + CSS variables (tema sama)
```

## Workflow

1. Salin `personalbest.ini` dari `%USERPROFILE%\Documents\Assetto Corsa\cfg/` ke folder `data/`.
2. Jalankan `npm install` (sekali) lalu gunakan skrip berikut:
   - `npm run dev` – menjalankan Astro dev server.
   - `npm run laps:convert` – hanya mengonversi INI ke JSON.
   - `npm run build` – menjalankan konversi **dan** build Astro untuk deploy GitHub Pages.
3. Halaman `/assetto-corsa` meng-import `src/data/laptime.json` secara langsung, sehingga build output sudah menyertakan data terbaru tanpa fetch ekstra.
4. Atur preferensi lewat `src/data/config.json`:
   - `driverProfile` → nama driver, gear (`gamepad`/`wheel-pedal`/`keyboard-mouse`) + tautan profil.
   - `featuredLap` → kontrol lap unggulan.
   - `meta` → judul, deskripsi, URL situs, dan OG image.

## Catatan Tambahan

- Layout dan warna mengikuti tema personal site: kombinasi light (cobalt) dan dark (graphite + racing red).
- Komponen tabel mendukung filter, preset dropdown, sorting, dan highlight PB per track.
- Feel free untuk mengganti font/warna sesuai branding lain; cukup update `src/styles/globals.css`.
