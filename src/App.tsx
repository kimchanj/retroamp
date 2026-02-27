import { useEffect, useRef, useState } from "react"
import "./App.css"

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const visTimerRef = useRef<number | null>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fileName, setFileName] = useState("No Track Loaded")
  const [volume, setVolume] = useState(0.7)
  const [bars, setBars] = useState<number[]>([10, 30, 15, 50, 20, 45, 12, 35, 25, 40])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const loaded = () => setDuration(audio.duration || 0)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", loaded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", loaded)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // 재생중일 때만 "가짜" 비주얼라이저 움직이기
  useEffect(() => {
    if (visTimerRef.current) {
      window.clearInterval(visTimerRef.current)
      visTimerRef.current = null
    }

    if (playing) {
      visTimerRef.current = window.setInterval(() => {
        setBars((prev) => prev.map(() => 8 + Math.floor(Math.random() * 55)))
      }, 120)
    } else {
      // 멈추면 살짝 내려가게
      setBars((prev) => prev.map((v) => Math.max(8, Math.floor(v * 0.5))))
    }

    return () => {
      if (visTimerRef.current) window.clearInterval(visTimerRef.current)
    }
  }, [playing])

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (playing) {
        audio.pause()
        setPlaying(false)
      } else {
        await audio.play()
        setPlaying(true)
      }
    } catch (e) {
      console.error(e)
      setPlaying(false)
    }
  }

  const stop = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setCurrentTime(0)
    setPlaying(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const audio = audioRef.current
    if (!audio) return

    audio.src = url
    audio.currentTime = 0
    setCurrentTime(0)
    setDuration(0)
    setFileName(file.name)
    setPlaying(false)
  }

  const openFilePicker = () => {
    ;(document.getElementById("fileInput") as HTMLInputElement | null)?.click()
  }

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrentTime(value)
  }

  return (
    <div className="player">
      {/* 드래그 가능한 상단바 */}
      <div className="titlebar-drag">
        <div>RETROAMP</div>
        <div className="winbtns">
          {/* 나중에 minimize/close IPC 붙일 자리 */}
          <div className="winbtn" title="minimize" />
          <div className="winbtn" title="close" />
        </div>
      </div>

      <div className="mainRow">
        <div className="visualizer">
          {bars.map((h, i) => (
            <div key={i} className="bar" style={{ height: `${h}px` }} />
          ))}
        </div>

        <div className="display">
          <div className="song">{fileName}</div>
          <div className="time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      <div className="sliders">
        <div className="sliderRow">
          <span>POS</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
          />
        </div>

        <div className="sliderRow">
          <span>VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="controls">
        <button title="Prev" onClick={() => {}}>⏮</button>
        <button title="Play/Pause" onClick={togglePlay}>{playing ? "⏸" : "▶"}</button>
        <button title="Stop" onClick={stop}>⏹</button>
        <button title="Next" onClick={() => {}}>⏭</button>
        <button title="Open" onClick={openFilePicker}>OPEN</button>
        <button title="Playlist" onClick={() => alert("Playlist next!")}>PL</button>

        <input
          id="fileInput"
          className="fileInput"
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
        />
      </div>

      <audio ref={audioRef} />
    </div>
  )
}