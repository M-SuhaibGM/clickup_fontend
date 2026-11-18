'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { User as UserIcon, Mail, Lock, Loader2, Camera } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUploadThing } from '@/lib/uploadthing';
import type { User } from '@/types/auth';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 border-b border-(--c-333438) last:border-b-0">
      <span className="text-[14px] font-semibold text-(--c-white)">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-(--c-444548)'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function Field({
  icon: Icon,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 w-64 sm:w-64 h-8 px-2.5 rounded-md bg-(--c-2a2b2e) border border-(--c-333438) focus-within:border-(--c-444548)">
      <Icon className="h-3.5 w-3.5 text-(--c-8a8c91) shrink-0" />
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-(--c-e5e5e5) placeholder:text-(--c-8a8c91) disabled:opacity-60"
      />
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing('avatar', {
    headers: () => ({ Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}` }),
    onClientUploadComplete: (res) => {
      const url = (res?.[0]?.serverData as { ufsUrl?: string } | undefined)?.ufsUrl;
      if (url) void save({ avatar: url }, 'Profile picture updated');
    },
    onUploadError: (e) => { toast.error(`Upload failed: ${e.message}`); },
  });

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file');
    void startUpload([file]);
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const save = async (payload: Record<string, string>, success: string) => {
    setSaving(true);
    try {
      const { data } = await api.patch<{ user: User }>('/users/me', payload);
      setUser({ ...(user as User), ...data.user });
      toast.success(success);
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update profile');
      if (user) {
        setName(user.name);
        setEmail(user.email);
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const commitName = () => {
    const v = name.trim();
    if (!user || v === user.name) return;
    void save({ name: v }, 'Name updated');
  };
  const commitEmail = () => {
    const v = email.trim();
    if (!user || v === user.email) return;
    void save({ email: v }, 'Email updated');
  };
  const commitPassword = async () => {
    if (!password) return;
    if (await save({ password }, 'Password updated')) setPassword('');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-180 mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl font-bold text-(--c-white) mb-8">Preferences</h1>

        <h2 className="text-[14px] font-semibold text-(--c-white)">Profile</h2>
        <p className="text-[12px] text-(--c-8a8c91) mb-3">Your personal information and account security settings.</p>

        <div className="rounded-xl border border-(--c-333438) bg-(--c-1e1f21) mb-10">
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-(--c-333438)">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-(--c-white)">Avatar</div>
              <div className="text-[12px] text-(--c-8a8c91) truncate">{user?.name}</div>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              title="Change profile picture"
              className="group relative h-12 w-12 shrink-0 rounded-full overflow-hidden"
            >
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" unoptimized />
              ) : (
                <div className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className={`absolute inset-0 flex items-center justify-center bg-black/55 text-white transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </div>

          <Row label="Full Name">
            <Field icon={UserIcon} value={name} onChange={setName} onBlur={commitName} disabled={saving} />
          </Row>
          <Row label="Email">
            <Field icon={Mail} type="email" value={email} onChange={setEmail} onBlur={commitEmail} disabled={saving || user?.provider === 'google'} />
          </Row>
          <Row label="Password">
            <Field icon={Lock} type="password" value={password} onChange={setPassword} onBlur={commitPassword} placeholder="Enter New Password" disabled={saving} />
          </Row>
        </div>

        <h2 className="text-[14px] font-semibold text-(--c-white)">Two-factor authentication (2FA)</h2>
        <p className="text-[12px] text-(--c-8a8c91) mb-3">Keep your account secure by enabling 2FA via SMS or an authenticator app.</p>

        <div className="rounded-xl border border-(--c-333438) bg-(--c-1e1f21) mb-10">
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-(--c-333438)">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-(--c-white)">Text message (SMS)</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Business</span>
              </div>
              <div className="text-[12px] text-(--c-8a8c91)">Receive a one-time passcode via SMS each time you log in.</div>
            </div>
            <Toggle checked={smsEnabled} onChange={setSmsEnabled} label="Text message 2FA" />
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-(--c-white)">Authenticator app (TOTP)</div>
              <div className="text-[12px] text-(--c-8a8c91)">Use an authenticator app to generate one-time passcodes.</div>
            </div>
            <Toggle checked={totpEnabled} onChange={setTotpEnabled} label="Authenticator app 2FA" />
          </div>
        </div>

        {saving && (
          <div className="flex items-center gap-2 text-[12px] text-(--c-8a8c91)">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
          </div>
        )}
      </div>
    </div>
  );
}
