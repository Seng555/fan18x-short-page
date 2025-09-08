"use client";

import { useEffect, useRef, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import VideoPage from "./VideoPage";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getRandomVideos } from "@/services/api.service";
export const config = {
	runtime: 'edge',
};

const COOLDOWN_MS = 700;
const WHEEL_THRESHOLD = 50;
const WINDOW = 1; // กี่สไลด์รอบๆ ที่อยากคงไว้เพื่อลดจอดำ (0 = เฉพาะ current)


function wheelControls(slider: any) {
  let locked = false;
  let accum = 0;
  const unlock = () => setTimeout(() => { locked = false; accum = 0; }, COOLDOWN_MS);

  slider.on("created", () => {
    const el = slider.container as HTMLElement;
    if (!el) return; // <-- ป้องกัน null
    el.addEventListener(
      "wheel",
      (e) => {
        if (!e.deltaY || !slider) return; // <-- ป้องกัน undefined
        accum += Number(e.deltaY);
        if (locked) return;
        if (accum > WHEEL_THRESHOLD) { locked = true; slider.next?.(); unlock(); }
        else if (accum < -WHEEL_THRESHOLD) { locked = true; slider.prev?.(); unlock(); }
      },
      { passive: true }
    );
  });
}

function Placeholder({ poster, title }: { poster: string; title: string }) {
  return (
    <div className="h-full w-full bg-black">
      <img src={poster} alt={title} className="h-full w-full object-cover opacity-70" />
    </div>
  );
}

export default function VideoScroller() {
  const t = useTranslations('menu');
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [showHand, setShowHand] = useState(false);
  const [videos, setVideos] = useState<Video[]>([])
  const [loding, setLoding] = useState(true)
  const videosRef = useRef(0);

  useEffect(() => {
    videosRef.current = videos.length;
  }, [videos]);

  // อ่านสถานะจาก localStorage
  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenHandGuide");
    if (!hasSeen) {
      setShowHand(true);
    }
  }, []);
  // Get Videos 
  const fetchVideos = async () => {
    try {
      const newVideos = await getRandomVideos();
      setVideos(prev => {
        const updated = [...prev, ...newVideos];
        videosRef.current = updated.length;
        // Refresh slider after state updates
        setTimeout(() => {
          slider?.current?.update(); // refresh keen-slider instance
        }, 0);
        return updated;
      });
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      if (loding) setLoding(false);
    }
  };
  useEffect(() => {
    fetchVideos();
  }, []); // [] = run once on mount

  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>(
    {
      vertical: true,
      slides: { perView: 1, spacing: 0, origin: "center" },
      rubberband: true,
      drag: true,
      loop: false,
      defaultAnimation: { duration: 300 },
      created(s) {
        const rel = s.track?.details?.rel ?? 0;
        setActive(rel);
        playOnly(containerRef.current, rel);
      },
      slideChanged(s) {
        const idx = s.track.details.rel;
        setActive(idx);
        localStorage.setItem("hasSeenHandGuide", "true");
        setShowHand(false);

        const lastIndex = videosRef.current - 1;
        console.log(idx, lastIndex);
        
        if (idx === lastIndex) {
          fetchVideos();
        }
      },
    },
    [wheelControls]
  );

  // ให้เล่นเฉพาะ current (เผื่อมีวิดีโออื่นถูกค้าง)
  function playOnly(root: HTMLDivElement | null, activeIndex: number) {
    const vids = (root?.querySelectorAll("video") ?? []) as NodeListOf<HTMLVideoElement>;
    vids.forEach((v, i) => (i === activeIndex ? v.play().catch(() => { }) : v.pause()));
  }

  // หลังเพิ่งเปลี่ยนสไลด์ ให้พยายามเล่นตัวใหม่
  useEffect(() => {
    requestAnimationFrame(() => playOnly(containerRef.current, active));
  }, [active]);

  return (
    <main className="flex-1 bg-black">
      {/* Hand Emoji Guide */}
      {showHand && (
        <div className="fixed inset-y-50 right-15 z-50 flex items-center pointer-events-none">
          <span className="animate-bounce-high text-6xl">👆</span>
        </div>
      )}
      <header className="absolute top-[1] left-1/2 z-20 flex w-[90%] max-w-3xl -translate-x-1/2 
             items-center justify-between rounded-2xl bg-black/60 px-4 py-3 shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <img src="/fan18x-logo.png" alt="Fan" className="h-10 w-auto cursor-pointer" />
          </Link>
        </div>
        {/* Tabs */}
        <nav className="flex items-center gap-6 text-white text-sm font-medium">
          {["all", "videos", "image"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`uppercase transition-colors cursor-pointer ${activeTab === tab ? "text-red-500" : "text-white/70 hover:text-white"
                }`}
            >
              {t(tab)}
            </button>
          ))}
        </nav>

        {/* Right spacer */}
        <div className="w-8" />
      </header>
      {loding ? (
        <div className="h-[100dvh] w-screen flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            {/* วงกลมหมุน */}
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            {/* ข้อความ */}
            <p className="mt-4 text-white text-lg">Loading...</p>
          </div>
        </div>
      ) :
        (<div ref={containerRef} className="h-[100dvh] w-screen bg-black pb-safe" >
          <div ref={sliderRef} className="keen-slider h-full w-full overflow-hidden" >
            {videos.map((v, i) => {
              const idx = i ?? 0;
              const dist = Math.abs(idx - (active ?? 0));
              const keepMounted = dist <= WINDOW;

              return (
                <div key={i} className="keen-slider__slide h-full w-full">
                  {keepMounted ? (
                    <VideoPage
                      videos={v.url}
                      title={typeof v.title === 'object' ? v.title.en ?? v.title.th : v.title}
                      poster={v.thumbnailUrl}
                      active={i === active}
                    />
                  ) : (
                    <Placeholder poster={v.thumbnailUrl} title={v.title?.en ?? ""} />
                  )}
                </div>
              );
            })}
          </div>
        </div>)}
    </main>
  );
}
