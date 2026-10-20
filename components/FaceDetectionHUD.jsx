"use client";

import React, { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  ScanFace, 
  ShieldCheck, 
  SunMedium, 
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useFaceDetector } from "@/hooks/useFaceDetector";

/**
 * FaceDetectionHUD Component
 * Overlays live cybernetic face tracking, gaze direction, eye contact percentage,
 * and executive presence telemetry onto any webcam video feed.
 */
export default function FaceDetectionHUD({
  videoRef,
  isActive = true,
  onMetricsUpdate,
  showTelemetryDock = true,
}) {
  const [hudMode, setHudMode] = useState("diagnostic"); // 'diagnostic' | 'subtle' | 'off'
  
  const {
    isFaceDetected,
    faceBox,
    eyeContactScore,
    isLookingAtCamera,
    postureStatus,
    lightingQuality,
    fps,
  } = useFaceDetector({ videoRef, isEnabled: isActive && hudMode !== "off" });

  if (!isActive) return null;

  // Posture labels and badges
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
          {isLookingAtCamera ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all duration-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Direct Eye Contact Locked</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                {eyeContactScore}%
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/50 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/15 animate-bounce">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Eye Contact Alert: Look into Camera Lens</span>
            </div>
          )}

          {!postureInfo.ok && (
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
      {hudMode !== "off" && isFaceDetected && faceBox && (
        <div
          style={{
            left: `${faceBox.x}%`,
            top: `${faceBox.y}%`,
            width: `${faceBox.width}%`,
            height: `${faceBox.height}%`,
          }}
          className={`absolute transition-all duration-150 ease-out pointer-events-none ${
            isLookingAtCamera ? "border-emerald-400/80" : "border-amber-400/80"
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
              <div className="w-3 h-3 rounded-full border border-current flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-current" />
              </div>
            </div>
          )}

          {/* HUD Target Info Tag */}
          {hudMode === "diagnostic" && (
            <div className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-current text-[9px] font-mono font-bold tracking-wider text-current whitespace-nowrap">
              <ScanFace className="w-2.5 h-2.5" />
              <span>AI TARGET: CANDIDATE • CONF {(faceBox.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
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
        <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono shadow-xl pointer-events-auto">
          {/* Eye Contact */}
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Eye Contact:</span>
            <span className="font-bold text-cyan-300">{eyeContactScore}%</span>
          </div>

          <span className="text-white/20">•</span>

          {/* Posture */}
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400">Posture:</span>
            <span className="font-bold text-emerald-300 capitalize">{postureStatus.replace('_', ' ')}</span>
          </div>

          <span className="text-white/20">•</span>

          {/* Lighting */}
          <div className="flex items-center gap-1">
            <SunMedium className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">Lighting:</span>
            <span className="font-bold text-amber-300 capitalize">{lightingQuality}</span>
          </div>

          <span className="text-white/20">•</span>

          {/* FPS */}
          <div className="flex items-center gap-1 text-slate-400">
            <span>FPS:</span>
            <span className="text-white font-bold">{fps}</span>
          </div>
        </div>
      )}
    </div>
  );
}
