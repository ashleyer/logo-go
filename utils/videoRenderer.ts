import { LogoData } from '../types';

/**
 * Creates a high-quality animated WebM/MP4 video blob from an SVG/PNG logo using HTML5 Canvas & MediaRecorder.
 * Serves as a guaranteed, instant local fallback if external video APIs are unreachable or throttled.
 */
export async function renderLogoCanvasVideoBlob(
  logo: LogoData,
  animationStyle: string = 'Shimmer pulse and 3D rotation'
): Promise<{ uri: string; blobUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `data:${logo.mimeType};base64,${logo.base64}`;

      img.onload = () => {
        // Setup MediaRecorder
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }

        const stream = canvas.captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: mimeType });
          const blobUrl = URL.createObjectURL(videoBlob);
          
          // Also convert blob to data URL for persistent IndexedDB storage
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve({
              uri: dataUrl, // persistent data URL
              blobUrl: blobUrl,
              size: videoBlob.size,
            });
          };
          reader.readAsDataURL(videoBlob);
        };

        recorder.start();

        const durationFrames = 90; // 3 seconds at 30fps
        let currentFrame = 0;

        const renderFrame = () => {
          const progress = currentFrame / durationFrames;
          
          // Clear canvas with dark gradient backdrop
          const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          bgGrad.addColorStop(0, '#0f172a'); // slate-900
          bgGrad.addColorStop(0.5, '#064e3b'); // emerald-950
          bgGrad.addColorStop(1, '#022c22'); // dark emerald
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw subtle animated grid lines
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
          ctx.lineWidth = 1;
          const gridOffset = (progress * 50) % 40;
          for (let x = gridOffset; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);

          // Motion 1: Gentle 3D perspective Y-axis tilt & pulse
          const pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.05;
          const tiltScaleX = Math.cos(progress * Math.PI * 2) * 0.15 + 0.85;

          ctx.scale(tiltScaleX * pulse, pulse);

          // Draw glow aura behind logo
          const glowGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 300);
          glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
          glowGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
          glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 300, 0, Math.PI * 2);
          ctx.fill();

          // Draw Logo Image centered
          const maxDim = 400;
          const aspect = img.width / img.height;
          let drawW = maxDim;
          let drawH = maxDim;
          if (aspect > 1) {
            drawH = maxDim / aspect;
          } else {
            drawW = maxDim * aspect;
          }

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

          // Motion 2: Shimmer light sweep bar
          const sweepX = -drawW + progress * (drawW * 2.5);
          ctx.beginPath();
          ctx.rect(-drawW / 2, -drawH / 2, drawW, drawH);
          ctx.clip();

          const shimmerGrad = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
          shimmerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          shimmerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
          shimmerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = shimmerGrad;
          ctx.fillRect(-drawW, -drawH, drawW * 2, drawH * 2);

          ctx.restore();

          // Branding watermark in bottom corner
          ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'right';
          ctx.fillText('Logo-go Studio', canvas.width - 40, canvas.height - 40);

          ctx.font = '14px sans-serif';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.fillText('AI Motion Stage', canvas.width - 40, canvas.height - 20);

          currentFrame++;
          if (currentFrame <= durationFrames) {
            requestAnimationFrame(renderFrame);
          } else {
            recorder.stop();
          }
        };

        renderFrame();
      };

      img.onerror = (e) => {
        reject(new Error('Failed to load logo image for canvas rendering'));
      };
    } catch (err) {
      reject(err);
    }
  });
}
