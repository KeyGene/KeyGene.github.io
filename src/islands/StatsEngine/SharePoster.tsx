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
      backgroundColor: '#0a0a0a',
      scale: 2,
      useCORS: true,
      logging: false
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <button class="export-btn" onClick={generate}>{label}</button>
  );
}
