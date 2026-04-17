import { useState, useCallback } from 'preact/hooks';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

let addToast: (msg: string, type: ToastType, duration?: number) => void;

export const toast = {
  success: (msg: string, duration = 5000) => addToast?.(msg, 'success', duration),
  error: (msg: string, duration = 5000) => addToast?.(msg, 'error', duration),
  info: (msg: string, duration = 5000) => addToast?.(msg, 'info', duration),
  warning: (msg: string, duration = 5000) => addToast?.(msg, 'warning', duration),
};

let nextId = 0;

export default function Toast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-2), { id, message, type, duration }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  if (items.length === 0) return null;

  const colors: Record<ToastType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-primary)',
    warning: 'var(--color-warning)',
  };

  return (
    <div style="position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:360px;">
      {items.map((item) => (
        <div
          key={item.id}
          style={`position:relative;background:var(--color-surface);border:1px solid var(--color-border);border-left:3px solid ${colors[item.type]};border-radius:8px;padding:12px 36px 12px 14px;font-size:14px;color:var(--color-text);box-shadow:0 4px 12px rgba(0,0,0,0.3);overflow:hidden;animation:toast-in 0.3s ease;`}
        >
          <span>{item.message}</span>
          <button
            onClick={() => setItems((p) => p.filter((t) => t.id !== item.id))}
            style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:16px;line-height:1;"
          >
            ×
          </button>
          <div
            style={`position:absolute;bottom:0;left:0;height:2px;background:${colors[item.type]};animation:toast-progress ${item.duration}ms linear forwards;`}
          />
        </div>
      ))}
    </div>
  );
}
