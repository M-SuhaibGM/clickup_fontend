'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Monitor,
  Maximize,
  Mic,
  MicOff,
  Play,
  FolderOpen,
  ChevronDown,
  Square,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUploadThing } from '@/lib/uploadthing';
import { useAuthStore } from '@/store/authStore';

type Phase = 'idle' | 'recording' | 'uploading';

const SURFACES: Record<string, 'monitor' | 'window' | 'browser'> = {
  'Entire screen': 'monitor',
  Window: 'window',
  'Browser Tab': 'browser',
};

const RESOLUTIONS: Record<string, { w: number; h: number; label: string }> = {
  '720p': { w: 1280, h: 720, label: 'HD' },
  '1080p': { w: 1920, h: 1080, label: 'Full HD' },
  '4K': { w: 3840, h: 2160, label: 'Ultra HD' },
};

function pickMimeType() {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  return candidates.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) ?? '';
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RecordVideoDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState('Entire screen');
  const [resolution, setResolution] = useState('1080p');
  const [micOn, setMicOn] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setMounted(true), []);

  const { startUpload } = useUploadThing('clipVideo', {
    headers: () => ({ Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}` }),
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const releaseMedia = useCallback(() => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Stop capturing if the component unmounts mid-recording
  useEffect(() => () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null;
      rec.stop();
    }
    releaseMedia();
  }, [releaseMedia]);

  const saveRecording = useCallback(
    async (blob: Blob, durationSec: number, mime: string) => {
      setPhase('uploading');
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const title = `Clip ${new Date().toLocaleString()}`;
      const file = new File([blob], `clip-${Date.now()}.${ext}`, { type: mime || 'video/webm' });
      const toastId = toast.loading('Uploading clip…');
      try {
        const res = await startUpload([file]);
        const server = res?.[0]?.serverData as { ufsUrl?: string; key?: string; size?: number } | undefined;
        if (!server?.ufsUrl || !server.key) throw new Error('Upload returned no file');
        await api.post('/clips', {
          title,
          url: server.ufsUrl,
          fileKey: server.key,
          duration: durationSec,
          size: server.size ?? file.size,
        });
        toast.success('Clip saved', {
          id: toastId,
          action: { label: 'View clips', onClick: () => router.push('/clips') },
        });
        window.dispatchEvent(new Event('clips:changed'));
      } catch (err: any) {
        toast.error(err?.response?.data?.error ?? err?.message ?? 'Failed to save clip', { id: toastId });
      } finally {
        setPhase('idle');
        setElapsed(0);
      }
    },
    [startUpload, router]
  );

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Screen recording is not supported in this browser');
      return;
    }
    const res = RESOLUTIONS[resolution];
    let display: MediaStream;
    try {
      display = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: res.w },
          height: { ideal: res.h },
          frameRate: { ideal: 30 },
          displaySurface: SURFACES[screen],
        } as MediaTrackConstraints,
        audio: true, // tab/system audio when the browser offers it
      });
    } catch {
      toast.error('Screen capture was cancelled or blocked');
      return;
    }
    streamsRef.current = [display];

    // Mix microphone (and any captured system audio) into one audio track
    const tracks: MediaStreamTrack[] = [...display.getVideoTracks()];
    let audioCtx: AudioContext | null = null;
    const audioSources: MediaStream[] = [];
    if (display.getAudioTracks().length) audioSources.push(new MediaStream(display.getAudioTracks()));
    if (micOn) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamsRef.current.push(mic);
        audioSources.push(mic);
      } catch {
        toast.error('Microphone blocked — recording without mic');
        setMicOn(false);
      }
    }
    if (audioSources.length === 1) {
      tracks.push(...audioSources[0].getAudioTracks());
    } else if (audioSources.length > 1) {
      audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      audioSources.forEach((s) => audioCtx!.createMediaStreamSource(s).connect(dest));
      tracks.push(...dest.stream.getAudioTracks());
    }

    const mime = pickMimeType();
    const recorder = new MediaRecorder(new MediaStream(tracks), mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000 } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      const type = recorder.mimeType || mime || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      releaseMedia();
      audioCtx?.close().catch(() => {});
      recorderRef.current = null;
      if (blob.size === 0) {
        setPhase('idle');
        setElapsed(0);
        toast.error('Nothing was recorded');
        return;
      }
      void saveRecording(blob, durationSec, type);
    };

    // Browser's own "Stop sharing" button
    display.getVideoTracks()[0].addEventListener('ended', () => {
      if (recorder.state !== 'inactive') recorder.stop();
    });

    recorderRef.current = recorder;
    recorder.start(1000);
    startedAtRef.current = Date.now();
    setElapsed(0);
    setPhase('recording');
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)), 500);
    onClose();
  };

  const busy = phase !== 'idle';

  return (
    <>
      {open && (
        <div
          ref={containerRef}
          className="absolute top-10 right-0 w-[340px] bg-[#1e1f21] border border-[#333438] rounded-xl shadow-2xl z-[200] p-3 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-2">
            {/* Screen Selection */}
            <div className="flex items-center gap-3 bg-[#2a2b2e] border border-[#333438] rounded-lg px-3 py-2.5">
              <Monitor className="h-4 w-4 text-[#8a8c91]" />
              <select
                value={screen}
                onChange={(e) => setScreen(e.target.value)}
                className="flex-1 bg-transparent text-[13px] text-white outline-none appearance-none cursor-pointer"
              >
                {Object.keys(SURFACES).map((k) => (
                  <option key={k} className="bg-[#2a2b2e]">{k}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-[#8a8c91]" />
            </div>

            {/* Resolution */}
            <div className="flex items-center gap-3 bg-[#2a2b2e] border border-[#333438] rounded-lg px-3 py-2.5">
              <Maximize className="h-4 w-4 text-[#8a8c91]" />
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="flex-1 bg-transparent text-[13px] text-white outline-none appearance-none cursor-pointer"
              >
                {Object.keys(RESOLUTIONS).map((k) => (
                  <option key={k} className="bg-[#2a2b2e]">{k}</option>
                ))}
              </select>
              <span className="text-[11px] text-[#8a8c91]">{RESOLUTIONS[resolution].label}</span>
            </div>

            {/* Mic */}
            <div className="flex items-center gap-3 bg-[#2a2b2e] border border-[#333438] rounded-lg px-3 py-2.5">
              {micOn ? <Mic className="h-4 w-4 text-emerald-500" /> : <MicOff className="h-4 w-4 text-[#8a8c91]" />}
              <span className="flex-1 text-[13px] text-white">{micOn ? 'Mic is on' : 'Record with mic'}</span>
              <button
                onClick={() => setMicOn(!micOn)}
                className={`h-5 w-9 rounded-full transition-colors relative ${micOn ? 'bg-emerald-500' : 'bg-[#444548]'}`}
                aria-pressed={micOn}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${micOn ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={startRecording}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-semibold py-2 rounded-lg transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {busy ? (phase === 'recording' ? 'Recording…' : 'Uploading…') : 'Record Clip'}
              </button>
              <button
                onClick={() => { onClose(); router.push('/clips'); }}
                className="flex items-center gap-2 bg-[#2a2b2e] hover:bg-[#333438] border border-[#333438] text-white text-[12px] font-semibold px-3 py-2 rounded-lg transition"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Clips
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating recording bar — stays visible after the dropdown closes */}
      {mounted && busy &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-[#1e1f21] border border-[#333438] rounded-full shadow-2xl pl-4 pr-2 py-2 text-white animate-in fade-in slide-in-from-bottom-2">
            {phase === 'recording' ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[13px] font-mono tabular-nums">{fmt(elapsed)}</span>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-[12px] font-semibold px-3 py-1.5 rounded-full transition"
                >
                  <Square className="h-3 w-3 fill-current" /> Stop
                </button>
              </>
            ) : (
              <span className="flex items-center gap-2 text-[13px] pr-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving clip…
              </span>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
