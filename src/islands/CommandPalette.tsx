import { useState, useEffect, useRef, useMemo } from 'preact/hooks';

interface CommandItem {
  id: string;
  title: string;
  section: string;
  href?: string;
}

interface Props {
  items: CommandItem[];
  labels: Record<string, string>;
}

export default function CommandPalette({ items, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.title.toLowerCase().includes(q) || i.section.toLowerCase().includes(q));
  }, [items, query]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) {
      const item = filtered[selected];
      if (item.href) window.location.href = item.href;
      setOpen(false);
    }
  };

  if (!open) return null;

  const sections = [...new Set(filtered.map((i) => i.section))];

  return (
    <div
      style="position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.6);display:flex;align-items:flex-start;justify-content:center;padding-top:min(20vh,160px);"
      onClick={() => setOpen(false)}
    >
      <div
        style="width:100%;max-width:520px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.4);"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          aria-label="Search"
          value={query}
          onInput={(e) => { setQuery((e.target as HTMLInputElement).value); setSelected(0); }}
          onKeyDown={onKeyDown}
          placeholder={labels.cmdPlaceholder || 'Search...'}
          style="width:100%;padding:16px 20px;font-size:16px;border:none;border-bottom:1px solid var(--color-border);background:transparent;color:var(--color-text);outline:none;"
        />
        <div style="max-height:320px;overflow-y:auto;padding:8px 0;">
          {sections.map((section) => (
            <div key={section}>
              <div style="padding:8px 20px 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);">
                {section}
              </div>
              {filtered.filter((i) => i.section === section).map((item) => {
                const idx = filtered.indexOf(item);
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    style={`display:block;padding:10px 20px;font-size:14px;text-decoration:none;color:var(--color-text);${idx === selected ? 'background:var(--color-border);' : ''}`}
                  >
                    {item.title}
                  </a>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style="padding:24px 20px;text-align:center;font-size:14px;color:var(--color-text-muted);">
              {labels.cmdNoResults || 'No results'}
            </div>
          )}
        </div>
        <div style="padding:8px 20px;border-top:1px solid var(--color-border);font-size:11px;color:var(--color-text-muted);">
          <kbd style="padding:2px 4px;border:1px solid var(--color-border);border-radius:3px;font-size:10px;">↑↓</kbd> navigate · <kbd style="padding:2px 4px;border:1px solid var(--color-border);border-radius:3px;font-size:10px;">↵</kbd> select · <kbd style="padding:2px 4px;border:1px solid var(--color-border);border-radius:3px;font-size:10px;">esc</kbd> close
        </div>
      </div>
    </div>
  );
}
