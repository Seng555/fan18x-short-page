"use client";

import { useEffect, useRef, useState } from "react";
import Hls, { Level } from "hls.js";
import { FaExpand } from "react-icons/fa";
import FloatingActions from "./FloatingActions";



type Props = {
  videos: string; // .m3u8 or .mp4
  title: string;
  description?: string;
  poster?: string;
  active?: boolean;
  username?: string;
 
};

export default function VideoPage({
  videos,
  title,
  description = "This is a sample caption for a TikTok-like video page.",
  poster = "/poster.jpg",
  active = true,
  username = "@admin"
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const rafRef = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showUi, setShowUi] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1);

  const isHls = /\.m3u8($|\?)/i.test(videos);
  const isLive = !Number.isFinite(duration) || duration === 0;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const destroy = () => {
      stopTicker();
      try { v.pause(); } catch { }
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      v.removeAttribute("src");
      while (v.firstChild) v.removeChild(v.firstChild);
      v.load();
      setTime(0); setDuration(0); setBufferedEnd(0);
    };

    if (!active) { destroy(); return; }

    const onLoadedMeta = () => setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    const onProgress = () => {
      if (v.buffered.length) setBufferedEnd(v.buffered.end(v.buffered.length - 1));
    };
    const onPlay = () => { setPlaying(true); startTicker(); };
    const onPause = () => { setPlaying(false); stopTicker(); };

    if (isHls) {
      const canNative = v.canPlayType("application/vnd.apple.mpegurl");
      if (canNative) {
        v.src = videos;
        v.play().catch(() => { });
      } else if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: true, enableWorker: true, backBufferLength: 30 });
        hlsRef.current = hls;
        hls.loadSource(videos);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLevels(hls.levels);
          setSelectedLevel(hls.currentLevel);
          v.play().catch(() => { });
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
          setSelectedLevel(data.level);
        });
      } else {
        v.src = videos;
      }
    } else {
      v.src = videos;
      v.play().catch(() => { });
    }

    v.muted = muted;
    v.volume = volume;

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("progress", onProgress);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      destroy();
    };
  }, [active, videos]);

  function startTicker() {
    const v = videoRef.current;
    if (!v || rafRef.current) return;
    const tick = () => {
      setTime(v.currentTime || 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }
  function stopTicker() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => { }) : v.pause();
  };
  const onSeek = (val: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = Math.min(Math.max(val, 0), duration);
    setTime(v.currentTime);
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const onVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(v.muted);
  };
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    } else {
      (el.requestFullscreen?.() ||
        (el as any).webkitRequestFullscreen?.() ||
        (el as any).mozRequestFullScreen?.() ||
        (el as any).msRequestFullscreen?.()).catch(() => { });
    }
  };
  const onQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = parseInt(e.target.value);
    setSelectedLevel(level);
    if (hlsRef.current) hlsRef.current.currentLevel = level;
  };

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return "00:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const armAutoHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowUi(false), 2000) as unknown as number;
  };
  const onMouseMove = () => { setShowUi(true); armAutoHide(); };
  const onMouseLeave = () => setShowUi(false);
  const onTouchStart = () => { setShowUi(true); armAutoHide(); };

  const playedPct = duration ? (time / duration) * 100 : 0;
  const bufferPct = duration ? (Math.min(bufferedEnd, duration) / duration) * 100 : 0;

  return (
    <section
      ref={containerRef}
      className="relative h-full w-full overflow-hidden group"
      aria-label={title}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
    >
      <video
        ref={videoRef}
        poster={poster}
        loop
        playsInline
        preload="none"
        crossOrigin="anonymous"
        className="h-full w-full object-contain bg-black cursor-pointer"
        onClick={togglePlay}
        controls={false}
        muted={muted}
      />

      {/* Play icon overlay */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          aria-hidden="true"
        >
          <button
            className="text-white text-6xl bg-black/30 rounded-full p-4"
            onClick={togglePlay}
          >
            ►
          </button>
        </div>
      )}


      {/* Controls */}
      <div
        className={`absolute left-0 right-0 bottom-0 z-20 px-3 pb-safe pt-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-200 ${showUi ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          } group-hover:opacity-100 group-hover:pointer-events-auto`}
      >
        <div className="flex flex-col-reverse sm:flex-row w-full gap-3">
          {/* Progress bar (full width on mobile, grows on desktop) */}
          {!isLive && (
            <div className="w-full sm:flex-1">
              <div className="relative h-2 w-full rounded bg-white/25">
                <div
                  className="absolute left-0 top-0 h-full rounded bg-white/40"
                  style={{ width: `${bufferPct}%` }}
                />
                <div
                  className="absolute left-0 top-0 h-full rounded bg-red-500"
                  style={{ width: `${playedPct}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={Math.max(duration, 0.1)}
                  step={0.1}
                  value={time}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="absolute left-0 top-0 h-2 w-full appearance-none bg-transparent"
                />
              </div>

              <div className="mt-1 flex justify-between text-xs text-white/90">
                <span>{fmt(time)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>
          )}
          {/* Left controls (mute, volume, quality, fullscreen) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={toggleMute}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white"
            >
              {muted ? "🔇" : "🔊"}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolume(parseFloat(e.target.value))}
              className="w-full sm:w-20 accent-white"
            />

            {isHls && levels.length > 0 && (
              <select
                value={selectedLevel}
                onChange={onQualityChange}
                className="text-white bg-black/30 border border-white/30 rounded text-xs px-2 py-1 min-w-[80px]"
                title="Quality"
              >
                <option value={-1}>Auto</option>
                {levels.map((lvl, i) => (
                  <option key={i} value={i}>
                    {lvl.height}p
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={toggleFullscreen}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white"
            >
              <FaExpand />
            </button>
          </div>


        </div>
      </div>
      <div className="absolute bottom-5 left-4 right-4 z-10 text-white pointer-events-none">
        <h2 className="font-bold">{username}</h2>
        <p className="text-sm">{description}</p>
      </div>
      <FloatingActions />
    </section>
  );
}
