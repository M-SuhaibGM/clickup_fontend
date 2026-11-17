'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Square, Copy, Check, Trash2 } from 'lucide-react';

// Web Speech API isn't in TS's default DOM lib
/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionLike = any;

export default function RecordAudioDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike>(null);
  const shouldListenRef = useRef(false);

  const [micAllowed, setMicAllowed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const stopRecording = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText('');
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  // Stop listening when dropdown closes / unmounts
  useEffect(() => {
    if (!open) stopRecording();
  }, [open, stopRecording]);
  useEffect(() => () => stopRecording(), [stopRecording]);

  useEffect(() => {
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  async function requestMic() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // only needed for the permission
      setMicAllowed(true);
      return true;
    } catch {
      setMicAllowed(false);
      setError('Microphone permission denied. Allow it in the browser address bar.');
      return false;
    }
  }

  async function startRecording() {
    if (!micAllowed && !(await requestMic())) return;

    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      let finals = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (finals) setFinalText((prev) => (prev ? prev + ' ' : '') + finals.trim());
      setInterimText(interim);
    };
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(`Speech error: ${e.error}`);
      shouldListenRef.current = false;
      setIsRecording(false);
    };
    // Chrome ends sessions after silence; restart while user hasn't pressed stop
    rec.onend = () => {
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch {}
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = rec;
    shouldListenRef.current = true;
    setError('');
    rec.start();
    setIsRecording(true);
  }

  async function copyText() {
    const text = finalText.trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-10 right-0 w-[340px] bg-[#1e1f21] border border-[#333438] rounded-xl shadow-2xl z-[200] p-3 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="space-y-2">
        {!supported && (
          <p className="text-[12px] text-amber-400">
            Speech recognition isn&apos;t supported in this browser. Use Chrome or Edge.
          </p>
        )}

        {/* Mic Access Button */}
        <button
          onClick={requestMic}
          className={`w-full flex items-center gap-3 px-3 py-3 border rounded-lg transition ${
            micAllowed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-[#2a2b2e] border-[#333438] text-white hover:bg-[#333438]'
          }`}
        >
          {micAllowed ? (
            <Mic className="h-4 w-4 text-emerald-400" />
          ) : (
            <MicOff className="h-4 w-4 text-[#8a8c91]" />
          )}
          <span className="text-[13px] font-medium flex-1 text-left">
            {micAllowed ? 'Mic access allowed' : 'Allow mic access'}
          </span>
        </button>

        {/* Start / Stop Recording */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!supported}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[13px] font-semibold py-3 rounded-lg transition"
        >
          {isRecording ? (
            <>
              <Square className="h-4 w-4 fill-current" /> Stop Recording
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" /> Start Recording
            </>
          )}
        </button>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        {/* Transcript */}
        {(finalText || interimText || isRecording) && (
          <div className="space-y-2">
            <div className="max-h-40 min-h-[60px] overflow-y-auto rounded-lg bg-[#2a2b2e] border border-[#333438] p-3 text-[13px] text-white whitespace-pre-wrap">
              {finalText}
              {interimText && <span className="text-[#8a8c91]"> {interimText}</span>}
              {!finalText && !interimText && (
                <span className="text-[#8a8c91]">Listening…</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyText}
                disabled={!finalText}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2a2b2e] hover:bg-[#333438] disabled:opacity-50 border border-[#333438] text-white text-[13px] py-2 rounded-lg transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy text'}
              </button>
              <button
                onClick={() => {
                  setFinalText('');
                  setInterimText('');
                }}
                className="px-3 bg-[#2a2b2e] hover:bg-[#333438] border border-[#333438] text-white rounded-lg transition"
                aria-label="Clear transcript"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
