import React, { useState, useEffect } from "react";
import { TeamShowcase, TeamMember } from "@/components/ui/team-showcase";
import { DriftingCarLoader } from "./components/DriftingCarLoader";
import PredictPage from "@/components/ui/predict-page";
import carSuvImg from "./assets/car_suv.png";
import moneyBagImg from "./assets/money_bag.png";
import odometerImg from "./assets/odometer_gauge.png";
import rupeeCoinImg from "./assets/rupee_coin.png";

function TypewriterText({
  text,
  speed = 80,
  startDelay = 300,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayText(text);
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => setIsTyping(false), 500);
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return (
    <span className="inline-flex items-center justify-center min-h-[1.3em]" aria-label={text}>
      <span>{displayText}</span>
      <span
        className={`inline-block w-[2.5px] sm:w-[3px] h-[0.8em] ml-1.5 bg-blue-400 rounded-full align-middle transition-opacity duration-300 ${
          isTyping ? "animate-pulse opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
    </span>
  );
}

const mlTeamMembers: TeamMember[] = [
  {
    name: "CAR SPECS",
    role: "Brand & Model",
    imageSrc: carSuvImg,
    themeColor: "bg-[#F9D4D5]", // Light Pink
    imageStyle: { maxHeight: "60%", bottom: "14px" },
  },
  {
    name: "VALUATION",
    role: "Optimal Pricing",
    imageSrc: moneyBagImg,
    themeColor: "bg-[#D1E5E6]", // Light Blue
    imageStyle: { maxHeight: "64%", bottom: "12px" },
  },
  {
    name: "USAGE & AGE",
    role: "Odometer & History",
    imageSrc: odometerImg,
    themeColor: "bg-[#EAE1DA]", // Beige
    imageStyle: { maxHeight: "62%", bottom: "14px" },
  },
  {
    name: "RUPEE QUOTE",
    role: "Fair Market ₹",
    imageSrc: rupeeCoinImg,
    themeColor: "bg-[#FDEACC]", // Light Yellow
    imageStyle: { maxHeight: "65%", width: "88%", bottom: "16px" },
    hasCoinShine: true,
  },
];

export default function App() {
  // Default to landing page when user opens the site
  const [currentView, setCurrentView] = useState<"landing" | "predict">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "predict") return "predict";
    }
    return "landing";
  });

  const [isLoading, setIsLoading] = useState(false);

  const launchPredictPage = () => {
    if (isLoading) return;
    setIsLoading(true);

    // 1 complete rotation of the drifting car (1.5s) before opening Predict page
    setTimeout(() => {
      setIsLoading(false);
      setCurrentView("predict");
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", "?view=predict");
      }
    }, 1500);
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", window.location.pathname);
    }
  };

  if (currentView === "predict") {
    return <PredictPage onBackToLanding={handleBackToLanding} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Drifting Car Loader Overlay (triggers upon clicking LAUNCH) */}
      {isLoading && (
        <DriftingCarLoader
          text="Loading Valuation Engine..."
          rotationDuration={1.5}
        />
      )}

      {/* Top Navigation Bar: Centered App Name */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 h-16 flex items-center justify-between px-6">
        <h1
          className="text-2xl sm:text-3xl text-white tracking-widest text-center select-none mx-auto"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
          }}
        >
          AutoWise AI
        </h1>
        <button
          onClick={launchPredictPage}
          className="text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800 rounded-md px-3 py-1.5 bg-zinc-900/60"
        >
          Go to Predictor →
        </button>
      </header>

      {/* Main Section ending at the four pillars structure */}
      <main className="flex-1 flex flex-col justify-center items-center py-10 px-4">
        <div className="w-full max-w-7xl relative overflow-hidden flex flex-col items-center">
          {/* Subtle background ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

          <TeamShowcase
            title={
              <div className="flex flex-col items-center justify-center mb-6 text-center">
                <span
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-normal text-white leading-tight"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontWeight: 700,
                  }}
                >
                  AUTOWISE AI
                </span>
                <span
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-widest text-slate-200 mt-2 uppercase"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontWeight: 700,
                  }}
                >
                  <TypewriterText text="SMART CAR VALUATION" speed={75} startDelay={350} />
                </span>
              </div>
            }
            description="Why wasting time on so many different platforms for searching, interviewing and find out that it’s not a good fit? We do all of these for you. No more back and forth. Get matched today."
            buttonText="LAUNCH"
            members={mlTeamMembers}
            onButtonClick={launchPredictPage}
            className="bg-transparent text-white py-4"
          />
        </div>
      </main>
    </div>
  );
}
