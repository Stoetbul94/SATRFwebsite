import * as THREE from 'three';

export function createIssfTargetTexture(): THREE.CanvasTexture {
  const SIZE = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d unavailable');

  const c = SIZE / 2;
  ctx.fillStyle = '#0A132B';
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (let r = 10; r >= 1; r--) {
    const rad = (r / 10) * (SIZE * 0.46);
    ctx.beginPath();
    ctx.arc(c, c, rad, 0, Math.PI * 2);
    if (r <= 3) {
      ctx.strokeStyle = 'rgba(232,188,79,.95)';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = `rgba(201,150,46,${0.18 + (10 - r) * 0.025})`;
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    if (r >= 2 && r <= 9) {
      ctx.fillStyle = 'rgba(147,160,184,.85)';
      ctx.font = '500 27px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const edge = (r / 10) * (SIZE * 0.46) - 27;
      ctx.fillText(String(r), c - edge, c);
      ctx.fillText(String(r), c + edge, c);
    }
  }

  ctx.beginPath();
  ctx.arc(c, c, SIZE * 0.018, 0, Math.PI * 2);
  ctx.fillStyle = '#E8BC4F';
  ctx.shadowColor = '#E8BC4F';
  ctx.shadowBlur = 28;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(201,150,46,.55)';
  ctx.lineWidth = 2;
  const lines: [number, number, number, number][] = [
    [c, 18, c, 70],
    [c, SIZE - 18, c, SIZE - 70],
    [18, c, 70, c],
    [SIZE - 18, c, SIZE - 70, c],
  ];
  lines.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
