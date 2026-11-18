'use client';

import * as React from 'react';

// The dialog (and the `cmdk` library behind it) is only downloaded the first
// time the palette is opened. The ⌘K / Ctrl+K listener stays here so the
// shortcut works from the very first keypress.
const CommandPaletteDialog = React.lazy(() => import('./command-palette-dialog'));

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const close = React.useCallback(() => setOpen(false), []);

  if (!open) return null;
  return (
    <React.Suspense fallback={null}>
      <CommandPaletteDialog onClose={close} />
    </React.Suspense>
  );
}
