import { useState, useEffect, useRef } from 'preact/hooks';

export interface Banner {
  src: string;
  alt: string;
}

interface Props {
  banners: Banner[];
  intervalMs?: number;
}

export default function HeroCarousel({ banners, intervalMs = 5000 }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    timeoutRef.current = window.setTimeout(() => {
      setActiveIdx((i) => (i + 1) % banners.length);
    }, intervalMs);
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [activeIdx, paused, banners.length, intervalMs]);

  if (banners.length === 0) return null;

  const styles = `
    .hc-root { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .hc-slide {
      position: absolute; inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0;
      transition: opacity 1200ms ease-in-out;
    }
    .hc-slide.active { opacity: 1; }
    @media (prefers-reduced-motion: reduce) {
      .hc-slide { transition: none !important; }
    }

    .hc-dots {
      position: absolute;
      right: 24px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 5;
      pointer-events: auto;
    }
    .hc-dot {
      width: 3px;
      height: 28px;
      background: rgba(255,255,255,0.3);
      border: none;
      padding: 0;
      cursor: pointer;
      transition: background 200ms, height 200ms;
    }
    .hc-dot:hover { background: rgba(255,255,255,0.6); }
    .hc-dot.active { background: var(--color-red); height: 44px; }
    .hc-dot:focus-visible { outline: 2px solid var(--color-red); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) {
      .hc-dot { transition: none !important; }
    }
    @media (max-width: 768px) {
      .hc-dots { right: 12px; gap: 6px; }
      .hc-dot { height: 20px; }
      .hc-dot.active { height: 32px; }
    }
  `;

  return (
    <div
      class="hc-root"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusIn={() => setPaused(true)}
      onFocusOut={() => setPaused(false)}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {banners.map((b, i) => (
        <div
          key={b.src}
          class={`hc-slide ${i === activeIdx ? 'active' : ''}`}
          style={`background-image:url('${b.src}');`}
          role="img"
          aria-label={b.alt}
          aria-hidden={i !== activeIdx}
        />
      ))}
      <div class="hc-dots" role="tablist" aria-label="Hero banner navigation">
        {banners.map((b, i) => (
          <button
            key={b.src}
            class={`hc-dot ${i === activeIdx ? 'active' : ''}`}
            onClick={() => setActiveIdx(i)}
            aria-label={`Show banner: ${b.alt}`}
            aria-selected={i === activeIdx}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
