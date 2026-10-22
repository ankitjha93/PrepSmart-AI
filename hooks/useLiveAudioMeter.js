"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useLiveAudioMeter Hook
 * Captures live microphone audio using Web Audio API (AudioContext + AnalyserNode)
 * Computes real-time RMS vocal volume (0-100), 4-band frequency spectrum,
 * speech presence detection, and device label.
 */
export function useLiveAudioMeter({ isEnabled = false }) {
  const [audioVolume, setAudioVolume] = useState(0); // 0 - 100
  const [frequencyBands, setFrequencyBands] = useState([8, 8, 8, 8]); // 4 normalized equalizer bands
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeMicLabel, setActiveMicLabel] = useState("");
  const [isMicAvailable, setIsMicAvailable] = useState(false);

  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  const cleanupAudio = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {}
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      audioStreamRef.current = null;
    }
    setAudioVolume(0);
    setFrequencyBands([8, 8, 8, 8]);
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      cleanupAudio();
      return;
    }

    let isCancelled = false;

    async function initAudio() {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
          },
        });

        if (isCancelled || !isEnabledRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        audioStreamRef.current = stream;
        setIsMicAvailable(true);

        const track = stream.getAudioTracks()[0];
        if (track?.label) {
          setActiveMicLabel(track.label);
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // Low latency, 32 frequency bins
        analyser.smoothingTimeConstant = 0.4;
        analyserRef.current = analyser;
        source.connect(analyser);

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const timeData = new Uint8Array(analyser.fftSize);

        const updateLoop = () => {
          if (!analyserRef.current || isCancelled) return;

          analyser.getByteFrequencyData(freqData);
          analyser.getByteTimeDomainData(timeData);

          // Calculate RMS volume from time domain
          let sumSquares = 0;
          for (let i = 0; i < timeData.length; i++) {
            const norm = (timeData[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / timeData.length);
          const vol = Math.min(100, Math.round(rms * 400));
          setAudioVolume(vol);
          setIsSpeaking(vol > 10);

          // 4 Frequency bands: Bass, Low-Mid, High-Mid, Treble
          const binChunk = Math.max(1, Math.floor(freqData.length / 4));
          const bands = [0, 0, 0, 0];
          for (let b = 0; b < 4; b++) {
            let sum = 0;
            for (let i = b * binChunk; i < (b + 1) * binChunk && i < freqData.length; i++) {
              sum += freqData[i];
            }
            const avg = sum / binChunk;
            bands[b] = Math.max(8, Math.min(100, Math.round((avg / 255) * 100)));
          }
          setFrequencyBands(bands);

          animFrameIdRef.current = requestAnimationFrame(updateLoop);
        };

        animFrameIdRef.current = requestAnimationFrame(updateLoop);
      } catch (err) {
        console.warn("Microphone access note for live telemetry:", err?.message);
        setIsMicAvailable(false);
      }
    }

    initAudio();

    return () => {
      isCancelled = true;
      cleanupAudio();
    };
  }, [isEnabled, cleanupAudio]);

  return {
    audioVolume,
    frequencyBands,
    isSpeaking,
    activeMicLabel,
    isMicAvailable,
  };
}
