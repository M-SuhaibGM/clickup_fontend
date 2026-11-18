'use client';

import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type ComponentType,
} from 'react';

type OpenProps = { open: boolean };

/**
 * Renders the component one frame "closed" before opening it, so CSS
 * transitions (e.g. a drawer's translate-x) still animate on the very first
 * open instead of appearing already in their final state.
 */
function withEnterFrame<P extends OpenProps>(Comp: ComponentType<P>): ComponentType<P> {
  function EnterFrame(props: P) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }, []);
    return <Comp {...props} open={props.open && entered} />;
  }
  return EnterFrame;
}

/**
 * Code-splits a modal/drawer that takes an `open` prop.
 *
 * - The chunk is not downloaded until `open` first becomes true.
 * - After the first open it stays mounted, so internal state (drafts, chat
 *   history, in-progress recordings…) behaves exactly as if it had always
 *   been mounted.
 *
 * @param slideIn set for drawers that animate via a CSS transition on `open`.
 */
export function lazyOnOpen<P extends OpenProps>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  { slideIn = false }: { slideIn?: boolean } = {},
): ComponentType<P> {
  const Lazy = lazy(
    slideIn
      ? async () => ({ default: withEnterFrame((await loader()).default) })
      : loader,
  );

  function LazyOnOpen(props: P) {
    const [mounted, setMounted] = useState(false);
    // Derive during render (the React-recommended pattern) rather than in an effect.
    if (props.open && !mounted) setMounted(true);
    if (!mounted && !props.open) return null;
    return (
      <Suspense fallback={null}>
        <Lazy {...(props as React.ComponentProps<typeof Lazy>)} />
      </Suspense>
    );
  }
  return LazyOnOpen;
}
