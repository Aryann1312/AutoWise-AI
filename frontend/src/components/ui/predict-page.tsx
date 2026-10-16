import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  CircleHelp,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import defaultMetadata from "@/data/car_metadata.json";

export interface VehicleFormData {
  brand: string;
  model: string;
  year: number;
  km_driven: number;
  fuel: "Petrol" | "Diesel" | "CNG";
  seller_type: string;
  transmission: "Manual" | "Automatic";
  owner: string;
}

export interface PredictionResult {
  predicted_price: number;
  coverage?: number;
  car_age?: number;
  model_name?: string;
  reference_year?: number;
  note?: string;
}

export interface PredictPageProps {
  brandModels?: Record<string, string[]>;
  getCoverage?: (brand: string, model: string) => number;
  onPredict?: (formData: VehicleFormData) => Promise<PredictionResult | null> | void;
  evaluationMetrics?: Record<string, any>;
  onBackToLanding?: () => void;
}

const SELLER_OPTIONS = ["Individual", "Dealer", "Trustmark Dealer"];
const OWNER_OPTIONS = [
  "First Owner",
  "Second Owner",
  "Third Owner",
  "Fourth & Above Owner",
  "Test Drive Car",
];

// Helper Tooltip Component
function FormLabelWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex items-center justify-between mb-1.5 relative">
      <Label className="text-xs font-medium text-zinc-300">{label}</Label>
      <div
        className="relative flex items-center cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
        title={tooltip}
      >
        <CircleHelp className="w-3.5 h-3.5" />
        {show && (
          <div className="absolute right-0 bottom-full mb-1.5 w-52 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] leading-tight shadow-2xl z-50 pointer-events-none">
            {tooltip}
          </div>
        )}
      </div>
    </div>
  );
}

export function PredictPage({
  brandModels = defaultMetadata.brand_models,
  getCoverage,
  onPredict,
  evaluationMetrics = defaultMetadata.metrics,
  onBackToLanding,
}: PredictPageProps) {
  // Brand selection
  const brandList = Object.keys(brandModels).sort();
  const initialBrand = brandList.includes("Maruti") ? "Maruti" : brandList[0] || "Maruti";
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);

  // Available models for the chosen brand
  const availableModels = brandModels[selectedBrand] || ["Standard"];
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0] || "Swift");

  // Form states (kept matching original app.py requirements)
  const [year, setYear] = useState<number>(2020);
  const [kmDriven, setKmDriven] = useState<number>(45000);
  const [fuel, setFuel] = useState<"Petrol" | "Diesel" | "CNG">("Petrol");
  const [sellerType, setSellerType] = useState<string>("Individual");
  const [transmission, setTransmission] = useState<"Manual" | "Automatic">("Manual");
  const [owner, setOwner] = useState<string>("First Owner");

  // UI state
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const evalSectionRef = useRef<HTMLDivElement | null>(null);

  // Reset model when brand changes
  const handleBrandChange = (newBrand: string) => {
    setSelectedBrand(newBrand);
    const newModels = brandModels[newBrand] || [];
    if (newModels.length > 0) {
      setSelectedModel(newModels[0]);
    }
  };

  // Safe data coverage lookup
  const count = getCoverage
    ? getCoverage(selectedBrand, selectedModel)
    : (defaultMetadata.brand_model_counts as Record<string, number>)[
        `${selectedBrand}::${selectedModel}`
      ] || 0;

  // Particle Canvas Setup (rising tiny specks)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    interface Particle {
      x: number;
      y: number;
      w: number;
      h: number;
      opacity: number;
      speed: number;
    }

    let particles: Particle[] = [];

    const initParticles = () => {
      const count = Math.floor((width * height) / 14000);
      particles = Array.from({ length: Math.min(count, 120) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        w: 0.7,
        h: 2.2,
        opacity: 0.15 + Math.random() * 0.35,
        speed: 0.2 + Math.random() * 0.45,
      }));
    };

    initParticles();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -5) {
          p.y = height + 5;
          p.x = Math.random() * width;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.w, p.h);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Form submission handler
  const handlePredictSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsPredicting(true);

    const formData: VehicleFormData = {
      brand: selectedBrand,
      model: selectedModel,
      year: Number(year) || 2020,
      km_driven: Number(kmDriven) || 45000,
      fuel,
      seller_type: sellerType,
      transmission,
      owner,
    };

    try {
      if (onPredict) {
        const customRes = await onPredict(formData);
        if (customRes) {
          setResult(customRes);
          setIsPredicting(false);
          return;
        }
      }

      // Default to live backend prediction endpoint
      const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: formData.brand,
          car_model: formData.model,
          year: formData.year,
          km_driven: formData.km_driven,
          fuel: formData.fuel,
          seller_type: formData.seller_type,
          transmission: formData.transmission,
          owner: formData.owner,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          predicted_price: data.predicted_price,
          coverage: data.coverage,
          car_age: data.car_age,
          model_name: data.model_name,
          reference_year: data.reference_year,
        });
      } else {
        throw new Error("Local inference server offline");
      }
    } catch {
      // Statistical fallback computation if server is disconnected
      const refYear = defaultMetadata.reference_year || 2026;
      const age = Math.max(0, refYear - formData.year);
      const baseEstimate =
        350000 * Math.pow(0.9, age) * (1 - Math.min(0.5, formData.km_driven / 300000));
      const fuelMult = formData.fuel === "Diesel" ? 1.15 : formData.fuel === "CNG" ? 0.95 : 1.0;
      const transMult = formData.transmission === "Automatic" ? 1.25 : 1.0;
      const calculated = Math.max(25000, Math.round(baseEstimate * fuelMult * transMult));

      setResult({
        predicted_price: calculated,
        coverage: count,
        car_age: age,
        model_name: "Statistical Surrogate",
        reference_year: refYear,
        note: "Estimated via statistical safeguard model",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const scrollToEvaluation = () => {
    setShowEvaluation(true);
    setTimeout(() => {
      evalSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Evaluation active metrics
  const activeModelMetrics =
    evaluationMetrics["Random Forest"] ||
    evaluationMetrics[Object.keys(evaluationMetrics)[0]] || {
      MAE: 134194.39,
      RMSE: 224061.26,
      R2: 0.7585,
    };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-50 overflow-y-auto selection:bg-rose-500 selection:text-white">
      {/* Dynamic Keyframes Styling */}
      <style>{`
        @keyframes lineScaleX {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 0.7; }
        }
        @keyframes lineScaleY {
          0% { transform: scaleY(0); opacity: 0; }
          100% { transform: scaleY(1); opacity: 0.7; }
        }
        @keyframes shimmerH {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes shimmerV {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes cardFadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-card-fade-up {
          animation: cardFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }
      `}</style>

      {/* Subtle top vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 255, 255, 0.06), transparent 70%)",
        }}
      />

      {/* Animated Accent Lines Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Horizontal Lines (18%, 50%, 82%) */}
        {[18, 50, 82].map((topPercent, i) => (
          <div
            key={`h-line-${topPercent}`}
            className="absolute left-0 right-0 h-[1px] bg-[#27272a] opacity-70 origin-left"
            style={{
              top: `${topPercent}%`,
              animation: `lineScaleX 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.2}s both`,
            }}
          >
            <div
              className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent"
              style={{
                animation: `shimmerH 6s ease-in-out ${0.5 + i * 1.5}s infinite`,
              }}
            />
          </div>
        ))}

        {/* Vertical Lines (22%, 50%, 78%) */}
        {[22, 50, 78].map((leftPercent, i) => (
          <div
            key={`v-line-${leftPercent}`}
            className="absolute top-0 bottom-0 w-[1px] bg-[#27272a] opacity-70 origin-top"
            style={{
              left: `${leftPercent}%`,
              animation: `lineScaleY 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + i * 0.2}s both`,
            }}
          >
            <div
              className="absolute inset-0 h-1/3 w-full bg-gradient-to-b from-transparent via-zinc-400/30 to-transparent"
              style={{
                animation: `shimmerV 7s ease-in-out ${1 + i * 1.5}s infinite`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Full-screen Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none mix-blend-screen opacity-50 z-0"
      />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLanding}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-2 h-8"
            >
              ← Landing
            </Button>
          )}
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 select-none">
            AutoWise AI
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={scrollToEvaluation}
          className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs sm:text-sm font-medium transition-all group"
        >
          <span>Model Evaluation</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] px-4 py-10 sm:py-14">
        {/* Content Above the Card (Centred) */}
        <div className="flex flex-col items-center text-center mb-8 max-w-xl">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[11px] font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            <span>AI-POWERED VALUATION</span>
          </div>

          {/* H1 Title */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2 text-[#ffd9cc]">
            AutoWise AI
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-400 text-sm max-w-md text-center leading-relaxed">
            Estimate fair market selling prices for used vehicles using trained
            machine learning models.
          </p>
        </div>

        {/* Prediction Input Card */}
        <Card className="w-full max-w-3xl border-zinc-800 bg-zinc-900/70 backdrop-blur-md shadow-2xl relative animate-card-fade-up">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-zinc-100 tracking-tight">
              Enter Vehicle Specifications
            </CardTitle>
            <div className="border-b border-zinc-800/80 pt-3" />
          </CardHeader>

          <CardContent className="pt-2">
            <form onSubmit={handlePredictSubmit} className="space-y-6">
              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* 1. Car Brand */}
                  <div>
                    <FormLabelWithTooltip
                      label="Car Brand"
                      tooltip="Select the vehicle manufacturer."
                    />
                    <Select value={selectedBrand} onValueChange={handleBrandChange}>
                      <SelectTrigger className="h-11 bg-zinc-950 border-zinc-800 text-zinc-50 focus:ring-1 focus:ring-zinc-600">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-h-60">
                        {brandList.map((brand) => (
                          <SelectItem
                            key={brand}
                            value={brand}
                            className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Car Model (dependent on brand) */}
                  <div>
                    <FormLabelWithTooltip
                      label="Car Model"
                      tooltip={`Models available for ${selectedBrand} in dataset.`}
                    />
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-11 bg-zinc-950 border-zinc-800 text-zinc-50 focus:ring-1 focus:ring-zinc-600">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-h-60">
                        {availableModels.map((model) => (
                          <SelectItem
                            key={model}
                            value={model}
                            className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Manufacturing Year */}
                  <div>
                    <FormLabelWithTooltip
                      label="Manufacturing Year"
                      tooltip="Dataset records range from 1995 to 2026."
                    />
                    <Input
                      type="number"
                      min={1995}
                      max={2026}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="h-11 bg-zinc-950 border-zinc-800 text-zinc-50 focus:ring-1 focus:ring-zinc-600"
                    />
                  </div>

                  {/* 4. Kilometres Driven */}
                  <div>
                    <FormLabelWithTooltip
                      label="Kilometres Driven"
                      tooltip="Total distance recorded on the odometer in km."
                    />
                    <Input
                      type="number"
                      min={0}
                      max={500000}
                      step={1000}
                      value={kmDriven}
                      onChange={(e) => setKmDriven(Number(e.target.value))}
                      className="h-11 bg-zinc-950 border-zinc-800 text-zinc-50 focus:ring-1 focus:ring-zinc-600"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* 1. Fuel Type (selection buttons: Petrol, Diesel, CNG - LPG removed) */}
                  <div>
                    <FormLabelWithTooltip
                      label="Fuel Type"
                      tooltip="Primary engine propulsion fuel."
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {(["Petrol", "Diesel", "CNG"] as const).map((type) => {
                        const isActive = fuel === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFuel(type)}
                            className={`h-11 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center border ${
                              isActive
                                ? "bg-zinc-50 text-zinc-900 border-zinc-50 shadow-sm"
                                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Seller Type */}
                  <div>
                    <FormLabelWithTooltip
                      label="Seller Type"
                      tooltip="Category of vehicle seller."
                    />
                    <Select value={sellerType} onValueChange={setSellerType}>
                      <SelectTrigger className="h-11 bg-zinc-950 border-zinc-800 text-zinc-50 focus:ring-1 focus:ring-zinc-600">
                        <SelectValue placeholder="Select Seller Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
                        {SELLER_OPTIONS.map((st) => (
                          <SelectItem
                            key={st}
                            value={st}
                            className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Transmission (selection buttons: Manual, Automatic) */}
                  <div>
                    <FormLabelWithTooltip
                      label="Transmission"
                      tooltip="Gearbox transmission type."
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {(["Manual", "Automatic"] as const).map((type) => {
                        const isActive = transmission === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setTransmission(type)}
                            className={`h-11 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center border ${
                              isActive
                                ? "bg-zinc-50 text-zinc-900 border-zinc-50 shadow-sm"
                                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Previous Ownership */}
                  <div>
                    <FormLabelWithTooltip
                      label="Previous Ownership"
                      tooltip="Number of registered previous owners on RC."
                    />
                    <Select value={owner} onValueChange={setOwner}>
                      <SelectTrigger className="h-11 bg-zinc-950 border-zinc-800 text-zinc-50 focus:ring-1 focus:ring-zinc-600">
                        <SelectValue placeholder="Select Ownership" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
                        {OWNER_OPTIONS.map((ow) => (
                          <SelectItem
                            key={ow}
                            value={ow}
                            className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            {ow}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Data Coverage Info Box */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="rounded-lg bg-sky-500/10 p-3 flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 flex-shrink-0 text-sky-300" />
                  <p className="text-sm text-sky-200">
                    <strong>Data Coverage:</strong> {count} historical listings in
                    dataset for{" "}
                    <strong>
                      {selectedBrand} {selectedModel}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Centered Predict Selling Price Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={isPredicting}
                  className="w-full max-w-sm h-12 rounded-xl font-bold text-zinc-950 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(90deg, #ff4d4d 0%, #ff7a3d 100%)",
                    boxShadow: "0 0 25px rgba(255, 90, 45, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 35px rgba(255, 90, 45, 0.65)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 25px rgba(255, 90, 45, 0.4)";
                  }}
                >
                  {isPredicting ? (
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4 animate-spin" />
                      Evaluating Fair Price...
                    </span>
                  ) : (
                    "Predict Selling Price!"
                  )}
                </button>
              </div>
            </form>

            {/* Prediction Output Display */}
            {result && (
              <div className="mt-8 pt-6 border-t border-zinc-800/80 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                        Estimated Fair Market Value
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight">
                        ₹{result.predicted_price.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-zinc-400 sm:max-w-xs space-y-1">
                    <div>
                      Model:{" "}
                      <span className="text-zinc-200 font-medium">
                        {result.model_name || "Random Forest"}
                      </span>
                    </div>
                    <div>
                      Vehicle Age:{" "}
                      <span className="text-zinc-200 font-medium">
                        {result.car_age ?? Math.max(0, 2026 - year)} yrs
                      </span>
                    </div>
                    {result.note && (
                      <div className="text-zinc-500 italic text-[11px]">
                        {result.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Evaluation & Benchmarking Section */}
        <div ref={evalSectionRef} className="w-full max-w-3xl mt-14 mb-10">
          <Card className="border-zinc-800 bg-zinc-900/70 backdrop-blur-md shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-zinc-100 tracking-tight">
                    Model Evaluation & Benchmarking
                  </CardTitle>
                  <p className="text-sm text-zinc-400 mt-1">
                    Test Set Performance (Random Forest Regressor)
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-zinc-300">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div className="border-b border-zinc-800/80 pt-3" />
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* MAE */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70">
                  <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">
                    Mean Absolute Error
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">
                    ₹{Number(activeModelMetrics.MAE || 134194).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Average deviation in price
                  </div>
                </div>

                {/* RMSE */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70">
                  <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">
                    Root Mean Squared Error
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">
                    ₹{Number(activeModelMetrics.RMSE || 224061).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Sensitivity to larger outliers
                  </div>
                </div>

                {/* R2 Score */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70">
                  <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">
                    R² Score
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {Number(activeModelMetrics.R2 || 0.7585).toFixed(4)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Variance explained on test data
                  </div>
                </div>
              </div>

              {/* Model Comparison Table */}
              <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/60">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    Model Comparison (Held-out Test Set)
                  </span>
                  <span className="text-[11px] text-zinc-500">Cross-validated</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 font-medium">
                      <tr>
                        <th className="py-2.5 px-4">Algorithm</th>
                        <th className="py-2.5 px-4">MAE</th>
                        <th className="py-2.5 px-4">RMSE</th>
                        <th className="py-2.5 px-4">R² Score</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      <tr className="hover:bg-zinc-900/30">
                        <td className="py-2.5 px-4 font-sans text-zinc-200">
                          Linear Regression
                        </td>
                        <td className="py-2.5 px-4">₹1,85,109</td>
                        <td className="py-2.5 px-4">₹3,16,404</td>
                        <td className="py-2.5 px-4 text-zinc-400">0.5184</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-500">
                          Baseline
                        </td>
                      </tr>
                      <tr className="bg-emerald-500/5 hover:bg-emerald-500/10">
                        <td className="py-2.5 px-4 font-sans font-semibold text-emerald-300 flex items-center gap-1.5">
                          <span>Random Forest</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-sans font-normal">
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-200">
                          ₹1,34,194
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-200">
                          ₹2,24,061
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-300">
                          0.7585
                        </td>
                        <td className="py-2.5 px-4 font-sans text-emerald-400">
                          Deployed
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default PredictPage;
