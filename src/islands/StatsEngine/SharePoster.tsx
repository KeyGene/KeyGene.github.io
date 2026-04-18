interface Props {
  targetId: string;
  filename: string;
  label: string;
}

export default function SharePoster({ targetId, filename, label }: Props) {
  const generate = async () => {
    const el = document.getElementById(targetId);
    if (!el || !(window as any).html2canvas) return;
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
    const toast = document.createElement('div');
    toast.textContent = '\u2705 Exported!';
    toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:8px 20px;border-radius:8px;font-size:14px;z-index:9999;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  return (
    <button class="export-btn" onClick={generate}>{label}</button>
  );
}
