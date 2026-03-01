import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import './App.css';

type Track = {
  id: string;
  name: string;
  src: string;
};
type RepeatMode = 'one' | 'all' | 'off';

function basename(filePath: string) {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

function toFileUrl(filePath: string) {
  if (!filePath) return '';
  if (filePath.startsWith('file://')) return filePath;
  let normalized = filePath.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(normalized)) normalized = `/${normalized}`;
  return encodeURI(`file://${normalized}`);
}

function fmtTime(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [pendingAutoplayIndex, setPendingAutoplayIndex] = useState<number | null>(null);

  const invokeMain = useCallback(async (channel: string, ...args: unknown[]) => {
    try {
      const ipc = window.ipcRenderer;
      if (ipc?.invoke) return await ipc.invoke(channel, ...args);
    } catch {
      // ignore
    }
    return undefined;
  }, []);

  const closeWindow = useCallback(async () => {
    try {
      if (window.retroamp?.closeWindow) {
        const closed = await window.retroamp.closeWindow();
        if (closed) return;
      }
      await invokeMain('retroamp:window-close');
      if (typeof window.close === 'function') window.close();
    } catch {
      // ignore
    }
  }, [invokeMain]);

  const syncWindowPlaylistState = useCallback(
    async (visible: boolean) => {
      const collapsed = !visible;
      try {
        if (window.retroamp?.setPlaylistCollapsed) {
          const ok = await window.retroamp.setPlaylistCollapsed(collapsed);
          if (ok) return true;
        }
        const ok = await invokeMain('retroamp:window-set-playlist-collapsed', collapsed);
        if (ok === true) return true;
      } catch {
        // ignore
      }
      try {
        window.resizeTo(window.outerWidth, collapsed ? 302 : 460);
      } catch {
        // ignore
      }
      return false;
    },
    [invokeMain],
  );

  const currentTrack = useMemo(() => playlist[currentIndex] ?? null, [playlist, currentIndex]);

  const selectTrack = useCallback(
    async (idx: number, opts?: { autoplay?: boolean }) => {
      const a = audioRef.current;
      const t = playlist[idx];
      if (!a || !t) return;

      setCurrentIndex(idx);
      setCurrentTime(0);
      setDuration(0);
      a.src = t.src;

      if (opts?.autoplay) {
        try {
          await a.play();
        } catch {
          // ignore
        }
      }
    },
    [playlist],
  );

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;

    const onTime = () => setCurrentTime(a.currentTime || 0);
    const onMeta = () => setDuration(a.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (playlist.length === 0) return;
      if (currentIndex < 0) return;

      if (repeatMode === 'one') {
        void selectTrack(currentIndex, { autoplay: true });
        return;
      }

      const next = currentIndex + 1;
      if (next < playlist.length) {
        void selectTrack(next, { autoplay: true });
      } else if (repeatMode === 'all') {
        void selectTrack(0, { autoplay: true });
      } else {
        setIsPlaying(false);
      }
    };

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);

    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, [playlist, currentIndex, volume, selectTrack, repeatMode]);

  const addTracks = (tracks: Track[], opts?: { autoplay?: boolean }) => {
    if (tracks.length === 0) return;
    setPlaylist((prev) => {
      if (opts?.autoplay) {
        setPendingAutoplayIndex(prev.length);
      }
      return [...prev, ...tracks];
    });
    setShowPlaylist(true);
  };

  const addTracksFromPaths = (paths: string[], opts?: { autoplay?: boolean }) => {
    if (paths.length === 0) return;
    const timestamp = Date.now();
    const tracks: Track[] = paths.map((p, i) => ({
      id: `${timestamp}-${i}`,
      name: basename(p),
      src: toFileUrl(p),
    }));
    addTracks(tracks, opts);
  };

  const addTracksFromFiles = (files: FileList | null, opts?: { autoplay?: boolean }) => {
    if (!files || files.length === 0) return;
    const timestamp = Date.now();
    const tracks: Track[] = Array.from(files).map((file, i) => ({
      id: `${timestamp}-local-${i}`,
      name: file.name,
      src: URL.createObjectURL(file),
    }));
    addTracks(tracks, opts);
  };

  useEffect(() => {
    if (pendingAutoplayIndex == null) return;
    if (!playlist[pendingAutoplayIndex]) return;
    void selectTrack(pendingAutoplayIndex, { autoplay: true });
    setPendingAutoplayIndex(null);
  }, [pendingAutoplayIndex, playlist, selectTrack]);

  const openFiles = async () => {
    try {
      const paths = (await window.retroamp?.openAudioFiles?.()) ?? [];
      if (paths.length > 0) {
        addTracksFromPaths(paths, { autoplay: true });
        return;
      }
    } catch {
      // fallback to local file input
    }

    fileInputRef.current?.click();
  };

  const play = async () => {
    const a = audioRef.current;
    if (!a) return;

    if (!currentTrack && playlist.length > 0) {
      await selectTrack(0, { autoplay: true });
      return;
    }

    try {
      await a.play();
    } catch {
      // ignore
    }
  };

  const pause = () => audioRef.current?.pause();

  const stop = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const prev = async () => {
    if (playlist.length === 0) return;
    const idx = currentIndex <= 0 ? 0 : currentIndex - 1;
    await selectTrack(idx, { autoplay: true });
  };

  const next = async () => {
    if (playlist.length === 0) return;
    const idx = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, playlist.length - 1);
    await selectTrack(idx, { autoplay: true });
  };

  const seek = (v: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v;
    setCurrentTime(v);
  };

  const setVol = (v: number) => {
    const a = audioRef.current;
    const nextVolume = Math.max(0, Math.min(1, v));
    setVolume(nextVolume);
    if (a) a.volume = nextVolume;
  };

  useEffect(() => {
    void syncWindowPlaylistState(showPlaylist);
  }, [showPlaylist, syncWindowPlaylistState]);

  const togglePlaylist = useCallback(() => {
    setShowPlaylist((prev) => !prev);
  }, []);

  const toggleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'all') return 'one';
      if (prev === 'one') return 'off';
      return 'all';
    });
  };

  const repeatLabel = repeatMode === 'one' ? 'RPT 1' : repeatMode === 'all' ? 'RPT ALL' : 'RPT OFF';

  return (
    <div className="player">
      <div className="titlebar-drag">
        <div>RETROAMP</div>
        <div className="winbtns">
          <button
            className="winbtn"
            title="Close"
            aria-label="Close"
            onClick={() => {
              void closeWindow();
            }}
          >
            X
          </button>
        </div>
      </div>

      <div className="mainRow">
        <div className={isPlaying ? 'visualizer playing' : 'visualizer'} aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bar"
              style={
                {
                  '--bar-h': `${14 + ((i * 11) % 42)}px`,
                  '--bar-d': `${0.45 + ((i % 4) * 0.12)}s`,
                  '--bar-delay': `${(i % 5) * 0.08}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="display">
          <div className="song">{currentTrack ? currentTrack.name : 'No Track Loaded'}</div>
          <div className="time">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </div>
        </div>
      </div>

      <div className="sliders">
        <div className="sliderRow">
          <span className="label">POS</span>
          <input
            className="range"
            type="range"
            min={0}
            max={Math.max(0, duration)}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
          />
        </div>

        <div className="sliderRow">
          <span className="label">VOL</span>
          <input
            className="range"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVol(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="controls">
        <button onClick={() => void prev()} title="Prev">
          {'<<'}
        </button>
        <button onClick={() => (isPlaying ? pause() : void play())} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '||' : '>'}
        </button>
        <button onClick={stop} title="Stop">
          {'[]'}
        </button>
        <button onClick={() => void next()} title="Next">
          {'>>'}
        </button>
        <button onClick={() => void openFiles()} title="Open files">
          {'OPEN'}
        </button>
        <button
          className="repeatBtn"
          onClick={toggleRepeatMode}
          title="Repeat mode"
          aria-pressed={repeatMode !== 'off'}
        >
          {repeatLabel}
        </button>
        <button
          onClick={togglePlaylist}
          title="Playlist"
          aria-pressed={showPlaylist}
        >
          PL
        </button>
      </div>

      <input
        ref={fileInputRef}
        className="fileInput"
        type="file"
        accept="audio/*"
        multiple
        onChange={(e) => {
          addTracksFromFiles(e.target.files, { autoplay: true });
          e.currentTarget.value = '';
        }}
      />

      <div className={showPlaylist ? 'playlistPanel' : 'playlistPanel collapsed'}>
        <div className="playlistBody">
          {playlist.length === 0 ? (
            <div className="playlistEmpty">No tracks</div>
          ) : (
            playlist.map((t, idx) => (
              <div
                key={t.id}
                className={idx === currentIndex ? 'playlistItem active' : 'playlistItem'}
                onDoubleClick={() => void selectTrack(idx, { autoplay: true })}
              >
                <span className="playlistIdx">{String(idx + 1).padStart(2, '0')}</span>
                <span className="playlistName" title={t.name}>
                  {t.name}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="playlistHint">
          {showPlaylist ? 'Double click a track to play' : 'Playlist hidden - press PL to expand'}
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
