interface Props {
  targetId: string;
  filename: string;
  label: string;
}

export default function SharePoster({ targetId, filename, label }: Props) {
  const showToast = (text: string) => {
    const toast = document.createElement('div');
    toast.textContent = text;
    toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:8px 20px;border-radius:8px;font-size:14px;z-index:9999;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };
  const generate = async () => {
    const el = document.getElementById(targetId);
    if (!el || !(window as any).html2canvas) { showToast('\u23F3'); return; }
    try {
      const canvas = await (window as any).html2canvas(el, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('\u2705 Exported!');
    } catch {
      showToast('\u274C Export failed');
    }
  };

  return (
    <button class="export-btn" onClick={generate}>{label}</button>
  );
}
