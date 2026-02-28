# RetroAmp

Winamp-inspired retro MP3 player built with Electron + Vite + React + TypeScript.

<p align="left">
  <img src="docs/images/demo.gif" width="520" />
</p>

![UI](docs/images/retroamp-ui.png)

## Features

- Local audio file open (`OPEN`)
- Multi-file add to playlist (append)
- Playlist numbering (`01`, `02`, ...)
- Long filename ellipsis in playlist rows
- Empty state (`No tracks`)
- Play / Pause / Stop / Prev / Next
- Position and volume sliders
- Current time / total duration display
- Playlist panel fills bottom area on first launch
- Playlist viewport shows up to 5 rows, then vertical scroll

## Tech Stack

- Electron
- Vite
- React 18
- TypeScript 5
- CSS

## Run (Dev)

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Notes:
- In some Windows environments, `electron-builder` packaging can fail due to symlink permission issues (`winCodeSign` extraction).
- App build (`tsc` + `vite build`) and local Electron run can still work.

## Project Structure

```text
electron/      # main, preload
src/           # renderer UI (React)
docs/images/   # screenshots
```

## License

MIT
