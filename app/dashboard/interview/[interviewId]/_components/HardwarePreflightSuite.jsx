"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  Video, 
  Volume2, 
  VolumeX, 
  Settings2, 
  RefreshCw, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Headphones,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * HardwarePreflightSuite
 * Allows candidates to select webcams and microphones, calibrate microphone volume levels,
 * and perform an immediate 3-second voice loopback test before starting the interview.
 */
export default function HardwarePreflightSuite({
  selectedVideoDeviceId,
  onVideoDeviceChange,
  selectedAudioDeviceId,
  onAudioDeviceChange,
  audioVolume = 0,
  audioLevelStatus = "silent",
  frequencyBands = [8, 8, 8, 8],
  isSpeaking = false,
  isTestingMic = false,
  onToggleTestMic,
}) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 3-Second Loopback Recording State
  const [isLoopbackRecording, setIsLoopbackRecording] = useState(false);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [loopbackCountdown, setLoopbackCountdown] = useState(3);
  const [playbackAudioUrl, setPlaybackAudioUrl] = useState(null);

  const loopbackMediaRecorderRef = useRef(null);
  const loopbackChunksRef = useRef([]);
  const loopbackTimerRef = useRef(null);
  const audioElementRef = useRef(null);

  // Enumerate available hardware devices
  const enumerateHardware = async (showToast = false) => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;

    setIsRefreshing(true);
    try {
      // Request initial permission probe if needed to get human-readable labels
      const devices = await navigator.mediaDevices.enumerateDevices();

      const cams = devices.filter((d) => d.kind === "videoinput");
      const mics = devices.filter((d) => d.kind === "audioinput");

      setVideoDevices(cams);
      setAudioDevices(mics);

      // Auto-select first device if none selected
      if (!selectedVideoDeviceId && cams.length > 0) {
        onVideoDeviceChange(cams[0].deviceId);
      }
      if (!selectedAudioDeviceId && mics.length > 0) {
        onAudioDeviceChange(mics[0].deviceId);
      }

      if (showToast) {
        toast.success(`Detected ${cams.length} camera(s) and ${mics.length} microphone(s)`);
      }
    } catch (err) {
      console.warn("Hardware enumeration note:", err);
      if (showToast) toast.error("Could not scan devices. Please check browser permissions.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  useEffect(() => {
    enumerateHardware(false);

    // Listen for real-time device changes (plugging in USB headsets / webcams)
    const handleDeviceChange = () => enumerateHardware(false);
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      };
    }
  }, []);

  // 3-Second Audio Loopback Test
  const startLoopbackTest = async () => {
    if (isLoopbackRecording || isPlayingBack) return;

    try {
      loopbackChunksRef.current = [];
      const constraints = {
        audio: selectedAudioDeviceId && selectedAudioDeviceId !== "default"
          ? { deviceId: { exact: selectedAudioDeviceId } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const mediaRecorder = new MediaRecorder(stream);
      loopbackMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          loopbackChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(loopbackChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPlaybackAudioUrl(url);

        // Immediate automatic playback
        setIsPlayingBack(true);
        const audio = new Audio(url);
        audioElementRef.current = audio;
        audio.onended = () => {
          setIsPlayingBack(false);
          toast.success("Voice playback complete! Audio hardware calibrated.");
        };
        audio.play().catch(() => setIsPlayingBack(false));
      };

      setIsLoopbackRecording(true);
      setLoopbackCountdown(3);
      mediaRecorder.start();

      let secondsLeft = 3;
      loopbackTimerRef.current = setInterval(() => {
        secondsLeft -= 1;
        setLoopbackCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(loopbackTimerRef.current);
          if (loopbackMediaRecorderRef.current && loopbackMediaRecorderRef.current.state === "recording") {
            loopbackMediaRecorderRef.current.stop();
          }
          setIsLoopbackRecording(false);
        }
      }, 1000);
    } catch (err) {
      console.warn("Loopback test error:", err);
      toast.error("Microphone access needed to record test audio.");
      setIsLoopbackRecording(false);
    }
  };

  // Status badge helper
  const getLevelBadge = () => {
    switch (audioLevelStatus) {
      case "optimal":
        return { label: "Optimal Voice Level", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
      case "peaking":
        return { label: "Input Peaking (Too Loud)", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
      case "quiet":
        return { label: "Soft / Low Volume", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
      case "silent":
      default:
        return { label: "Listening (Silent)", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
    }
  };

  const levelBadge = getLevelBadge();

  return (
    <div className="interview-setup-anim p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Hardware Pre-Flight Diagnostics
            </h4>
            <span className="text-[11px] text-slate-400">Device routing & microphone calibration</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => enumerateHardware(true)}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Rescan connected hardware"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
        </button>
      </div>

      {/* 2-Column Device Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Camera Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-blue-500" />
            <span>Select Camera</span>
          </label>
          <select
            value={selectedVideoDeviceId || ""}
            onChange={(e) => onVideoDeviceChange(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            {videoDevices.length > 0 ? (
              videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Camera ${idx + 1}`}
                </option>
              ))
            ) : (
              <option value="">Default Web Camera</option>
            )}
          </select>
        </div>

        {/* Microphone Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-emerald-500" />
            <span>Select Microphone</span>
          </label>
          <select
            value={selectedAudioDeviceId || ""}
            onChange={(e) => onAudioDeviceChange(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            {audioDevices.length > 0 ? (
              audioDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Microphone ${idx + 1}`}
                </option>
              ))
            ) : (
              <option value="">Default Microphone</option>
            )}
          </select>
        </div>
      </div>

      {/* Live Microphone Calibration Meter */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className={`w-4 h-4 ${isSpeaking ? "text-emerald-500 animate-pulse" : "text-slate-400"}`} />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Live Speech Calibration
            </span>
          </div>

          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${levelBadge.color}`}>
            {levelBadge.label}
          </div>
        </div>

        {/* Real-Time Meter Bar */}
        <div className="space-y-1.5">
          <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            {/* Color Zone Guidelines */}
            <div className="absolute inset-0 flex pointer-events-none opacity-20">
              <div className="w-[15%] h-full bg-amber-400 border-r border-slate-900" />
              <div className="w-[60%] h-full bg-emerald-400 border-r border-slate-900" />
              <div className="w-[25%] h-full bg-rose-400" />
            </div>

            {/* Dynamic Volume Level Fill */}
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                audioVolume > 75
                  ? "bg-rose-500"
                  : audioVolume >= 15
                  ? "bg-emerald-500"
                  : audioVolume > 0
                  ? "bg-amber-400"
                  : "bg-transparent"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, audioVolume))}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Quiet (&lt;15%)</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Target Level (15% - 75%)
            </span>
            <span>Peaking (&gt;75%)</span>
          </div>
        </div>

        {/* 3-Second Loopback Test & Playback Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Hear how your voice sounds to the AI evaluator
            </span>
          </div>

          <Button
            type="button"
            disabled={isLoopbackRecording || isPlayingBack}
            onClick={startLoopbackTest}
            className={`px-3.5 py-1.5 h-8 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isLoopbackRecording
                ? "bg-rose-500 text-white animate-pulse"
                : isPlayingBack
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
            }`}
          >
            {isLoopbackRecording ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Recording ({loopbackCountdown}s)... Speak Now</span>
              </>
            ) : isPlayingBack ? (
              <>
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span>Playing Back Your Audio...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Test 3s Voice Playback</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
