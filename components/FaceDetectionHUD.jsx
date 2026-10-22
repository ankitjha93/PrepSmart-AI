"use client";

import React, { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  ScanFace, 
  ShieldCheck, 
  SunMedium, 
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Camera,
  Mic
} from "lucide-react";
import { useFaceDetector } from "@/hooks/useFaceDetector";

/**
 * FaceDetectionHUD Component
 * Overlays live cybernetic face tracking, gaze direction, eye contact percentage,
 * posture alignment, lighting analysis, stream telemetry, and microphone equalizer onto webcam feeds.
 */
export default function FaceDetectionHUD({
  videoRef,
  isActive = true,
  onMetricsUpdate,
  showTelemetryDock = true,
  audioMeter = null, // { audioVolume, frequencyBands, isSpeaking }
}) {
  const [hudMode, setHudMode] = useState("diagnostic"); // 'diagnostic' | 'subtle' | 'off'
  
  const {
    isFaceDetected,
    faceBox,
    eyeContactScore,
    isLookingAtCamera,
    postureStatus,
    lightingQuality,
    luxScore,
    fps,
    resolutionLabel,
    streamResolution,
  } = useFaceDetector({ videoRef, isEnabled: isActive && hudMode !== "off" });

  // Propagate live telemetry metrics to parent component if callback provided
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate({
        isFaceDetected,
        faceBox,
        eyeContactScore,
        isLookingAtCamera,
        postureStatus,
        lightingQuality,
        luxScore,
        fps,
        resolutionLabel,
        streamResolution,
      });
    }
  }, [
    isFaceDetected,
    faceBox,
    eyeContactScore,
    isLookingAtCamera,
    postureStatus,
    lightingQuality,
    luxScore,
    fps,
    resolutionLabel,
    streamResolution,
    onMetricsUpdate,
  ]);

  if (!isActive) return null;

  // Posture labels and status interpretation
  const getPostureLabel = () => {
    switch (postureStatus) {
      case "tilted_left":
        return { text: "Head Tilted Left", ok: false };
      case "tilted_right":
        return { text: "Head Tilted Right", ok: false };
      case "too_low":
        return { text: "Slouching / Too Low", ok: false };
      case "too_high":
        return { text: "Framed Too High", ok: false };
      case "too_close":
        return { text: "Too Close to Camera", ok: false };
      case "too_far":
        return { text: "Step Closer / Frame Face", ok: false };
      case "searching":
        return { text: "Position face in camera", ok: false };
      case "centered":
      default:
        return { text: "Posture Centered & Poised", ok: true };
    }
  };

  const postureInfo = getPostureLabel();

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden rounded-3xl">
      
      {/* =================================================================== */}
      {/* 1. TOP HUD BANNER: EYE CONTACT & PRESENCE STATUS                    */}
      {/* =================================================================== */}
      {hudMode !== "off" && (
        <div className="absolute top-4 inset-x-0 flex items-center justify-center gap-2 px-4 pointer-events-auto">
          {!isFaceDetected ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Scanning for candidate face...</span>
            </div>
          ) : isLookingAtCamera ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all duration-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Direct Eye Contact Locked</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                {eyeContactScore}%
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/50 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/15">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Align Gaze with Camera Lens</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {eyeContactScore}%
              </span>
            </div>
          )}

          {isFaceDetected && !postureInfo.ok && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-rose-500/40 text-rose-300 text-xs font-bold shadow-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{postureInfo.text}</span>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. CYBERNETIC FACE TARGETING RETICLE & BOUNDING BOX                 */}
      {/* =================================================================== */}
      {hudMode !== "off" && (
        isFaceDetected && faceBox ? (
          <div
            style={{
              left: `${faceBox.x}%`,
              top: `${faceBox.y}%`,
              width: `${faceBox.width}%`,
              height: `${faceBox.height}%`,
            }}
            className={`absolute transition-all duration-150 ease-out pointer-events-none ${
              isLookingAtCamera ? "border-emerald-400/80 text-emerald-400" : "border-amber-400/80 text-amber-400"
            }`}
          >
            {/* Animated Corner Brackets */}
            <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-current shadow-[0_0_8px_currentColor]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-current shadow-[0_0_8px_currentColor]" />
            <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-current shadow-[0_0_8px_currentColor]" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-current shadow-[0_0_8px_currentColor]" />

            {/* Center Targeting Crosshair */}
            {hudMode === "diagnostic" && (
              <div className="absolute inset-0 flex items-center justify-center opacity-60">
                <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-current" />
                </div>
              </div>
            )}

            {/* HUD Target Info Tag */}
            {hudMode === "diagnostic" && (
              <div className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-current text-[9px] font-mono font-bold tracking-wider text-current whitespace-nowrap">
                <ScanFace className="w-2.5 h-2.5" />
                <span>AI TARGET: CANDIDATE • CONF {Math.round(faceBox.confidence * 100)}%</span>
              </div>
            )}
          </div>
        ) : (
          /* Subtle alignment guide when searching for face */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-60 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/40">
              <ScanFace className="w-8 h-8 animate-pulse text-white/30" />
              <span className="text-[10px] font-mono font-semibold tracking-wider uppercase">Frame Face Here</span>
            </div>
          </div>
        )
      )}

      {/* =================================================================== */}
      {/* 3. HUD CONTROL TOGGLE (Top-Right)                                   */}
      {/* =================================================================== */}
      <div className="absolute top-4 right-4 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (hudMode === "diagnostic") setHudMode("subtle");
            else if (hudMode === "subtle") setHudMode("off");
            else setHudMode("diagnostic");
          }}
          title={`Click to cycle HUD mode (Current: ${hudMode})`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/75 hover:bg-slate-950/95 backdrop-blur-md border border-white/15 text-slate-200 hover:text-white text-[11px] font-semibold transition-all shadow-lg cursor-pointer"
        >
          <ScanFace className={`w-3.5 h-3.5 ${hudMode !== "off" ? "text-cyan-400" : "text-slate-500"}`} />
          <span className="capitalize">{hudMode === "off" ? "HUD Off" : `HUD: ${hudMode}`}</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM TELEMETRY DOCK (Diagnostic Mode Only)                     */}
      {/* =================================================================== */}
      {showTelemetryDock && hudMode === "diagnostic" && (
        <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono shadow-xl pointer-events-auto">
          {/* Optional Real Audio Equalizer in Dock */}
          {audioMeter && (
            <>
              <div className="flex items-center gap-1.5">
                <Mic className={`w-3 h-3 ${audioMeter.isSpeaking ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
                <div className="flex items-end gap-0.5 h-3">
                  {(audioMeter.frequencyBands || [8, 8, 8, 8]).map((level, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        audioMeter.isSpeaking ? "bg-emerald-400" : "bg-slate-500"
                      }`}
                      style={{ height: `${Math.max(2, (level / 100) * 12)}px` }}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-400 font-mono">
                  {audioMeter.audioVolume}%
                </span>
              </div>
              <span className="text-white/20">•</span>
            </>
          )}

          {/* Eye Contact */}
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Eye Contact:</span>
            <span className="font-bold text-cyan-300">
              {isFaceDetected ? `${eyeContactScore}%` : "Scanning"}
            </span>
          </div>

          <span className="text-white/20">•</span>

          {/* Posture */}
          <div className="flex items-center gap-1">
            <ShieldCheck className={`w-3 h-3 ${postureInfo.ok ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="text-slate-400">Posture:</span>
            <span className={`font-bold capitalize ${postureInfo.ok ? "text-emerald-300" : "text-amber-300"}`}>
              {isFaceDetected ? postureStatus.replace("_", " ") : "Calibrating"}
            </span>
          </div>

          <span className="text-white/20">•</span>

          {/* Lighting */}
          <div className="flex items-center gap-1">
            <SunMedium className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">Lighting:</span>
            <span className="font-bold text-amber-300 capitalize">
              {lightingQuality} ({luxScore}%)
            </span>
          </div>

          <span className="text-white/20">•</span>

          {/* Stream resolution & FPS */}
          <div className="flex items-center gap-1 text-slate-400">
            <span>FPS:</span>
            <span className="text-white font-bold">{fps}</span>
            <span className="text-white/30 ml-0.5">({resolutionLabel})</span>
          </div>
        </div>
      )}
    </div>
  );
}
