'use client';

import { useState } from 'react';

// Plain <img> on purpose: avatars come from arbitrary OAuth/UploadThing hosts
// and this avoids next/image remote-host restrictions.
export default function UserAvatar({
  name,
  src,
  size = 24,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.trim()[0] ?? '?').toUpperCase();
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.42) };

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={style}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <span
      style={style}
      className="rounded-full shrink-0 inline-flex items-center justify-center bg-indigo-600 text-white font-semibold"
    >
      {initial}
    </span>
  );
}
