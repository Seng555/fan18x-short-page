"use client";

import { useEffect, useRef, useState } from "react";
import { KeenSliderInstance, useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import VideoPage from "./VideoPage";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getRandomVideos } from "@/services/api.service";
import Image from "next/image"


const COOLDOWN_MS = 700;
const WHEEL_THRESHOLD = 50;
const WINDOW = 1; // กี่สไลด์รอบๆ ที่อยากคงไว้เพื่อลดจอดำ (0 = เฉพาะ current)


export function wheelControls(slider: KeenSliderInstance) {
  let locked = false;
  let accumulatedDelta = 0;

  const reset = () => {
    locked = false;
    accumulatedDelta = 0;
  };

  const unlock = () => setTimeout(reset, COOLDOWN_MS);

  const handleWheel = (event: WheelEvent) => {
    if (locked || !event.deltaY) return;

    accumulatedDelta += event.deltaY;

    if (accumulatedDelta > WHEEL_THRESHOLD) {
      locked = true;
      slider.next?.();
      unlock();
    } else if (accumulatedDelta < -WHEEL_THRESHOLD) {
      locked = true;
      slider.prev?.();
      unlock();
    }
  };
  slider.on("created", () => {
    const container = slider.container;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: true });
  });
}

function Placeholder({ poster, title }: { poster: string; title: string }) {
  return (
    <div className="h-full w-full bg-black">
      <Image src={poster} alt={title} width={400} height={400} className="h-full w-full object-cover opacity-70" />
    </div>
  );
}

export default function VideoScroller() {
  const t = useTranslations('menu');
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [showHand, setShowHand] = useState(false);
  const [videos, setVideos] = useState<Video[]>([])
  const [loding, setLoding] = useState(true)
  const videosRef = useRef(0);
  const [readyId, setReadyId] = useState<string[]>([])

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
      const newVideos = await getRandomVideos(readyId);
      //console.log(newVideos);

      setVideos(prev => [...prev, ...newVideos]);
      // เก็บ _id ของวิดีโอใหม่เข้า readyId
      const newIds = newVideos.map(v => v._id);
      setReadyId(prev => [...prev, ...newIds]); // push ทุก id ลง state
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
        //console.log(idx, lastIndex);

        if (idx === lastIndex) {
          // Reset if readyId > 100
          setReadyId(prev => (prev.length >= 100 ? [] : prev));
          fetchVideos();
        }
      },
    },
    [wheelControls]
  );

  // รีเฟรช slider ทุกครั้งที่ videos อัปเดต
  useEffect(() => {
    if (slider.current) {
      slider.current.update();
    }
  }, [videos, slider]);

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
            <Image src="/fan18x-logo.png" width={400} height={400} alt="Fan" className="h-10 w-auto cursor-pointer" />
          </Link>
        </div>
        {/* Tabs */}
        <nav className="flex items-center gap-6 text-white text-sm font-medium">
          {["all", /*"videos", "image"*/].map((tab) => (
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
              //console.log(JSON.stringify(v));

              return (
                <div key={i} className="keen-slider__slide h-full w-full">
                  {keepMounted ? (
                    <VideoPage
                      videos={v.url}
                      title={(v.title as any)[locale as any]}
                      poster={v.thumbnailUrl}
                      active={i === active}
                      description={(v.title as any)[locale as any]}
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
