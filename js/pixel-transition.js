// Pixel Dissolve Page Transition
// This creates a pixelated dissolve effect during page transitions

(function() {
  let canvas, ctx;
  let isAnimating = false;
  let pixelSize = 8;
  let pixels = [];
  let animationId = null;
  let phase = 'idle'; // 'idle', 'dissolving-out', 'dissolving-in'

  function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'pixel-transition-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 99999;
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function captureScreen() {
    // Capture the current screen by drawing the body to canvas
    // This is a simplified version - for a real capture we'd need html2canvas
    // Instead, we'll create a solid color overlay with some noise
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#0b1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some pixel noise for texture
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Add slight variation to the background
      const noise = (Math.random() - 0.5) * 10;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  function createPixels() {
    pixels = [];
    const cols = Math.ceil(canvas.width / pixelSize);
    const rows = Math.ceil(canvas.height / pixelSize);
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        pixels.push({
          x: x * pixelSize,
          y: y * pixelSize,
          size: pixelSize,
          offsetX: (Math.random() - 0.5) * 20,
          offsetY: (Math.random() - 0.5) * 20,
          delay: Math.random() * 0.5,
          progress: 0
        });
      }
    }
  }

  function drawDissolveOut() {
    let allDone = true;
    
    pixels.forEach(pixel => {
      if (pixel.progress < 1) {
        allDone = false;
        pixel.progress += 0.05;
        
        const progress = Math.min(pixel.progress, 1);
        const eased = easeOutCubic(progress);
        
        const currentX = pixel.x + pixel.offsetX * eased;
        const currentY = pixel.y + pixel.offsetY * eased;
        const currentSize = pixel.size * (1 - eased * 0.5);
        const alpha = 1 - progress;
        
        // Get color from original capture position
        const pixelData = ctx.getImageData(pixel.x, pixel.y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];
        
        // Clear the original position
        ctx.clearRect(pixel.x, pixel.y, pixel.size, pixel.size);
        
        // Draw at new position with modified appearance
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(currentX, currentY, currentSize, currentSize);
      } else {
        // Make sure fully dissolved pixels are cleared
        ctx.clearRect(pixel.x, pixel.y, pixel.size, pixel.size);
      }
    });
    
    if (allDone) {
      return true;
    }
    animationId = requestAnimationFrame(drawDissolveOut);
    return false;
  }

  function drawDissolveIn() {
    let allDone = true;
    
    pixels.forEach(pixel => {
      if (pixel.progress > 0) {
        allDone = false;
        pixel.progress -= 0.05;
        
        const progress = Math.max(pixel.progress, 0);
        const eased = easeOutCubic(1 - progress);
        
        // For dissolve-in, we draw at the original position with growing size
        // But we don't have the original capture anymore, so we draw a solid color
        const currentSize = pixel.size * (progress < 0.2 ? progress * 5 : 1);
        const alpha = progress;
        
        // Clear and redraw
        ctx.clearRect(pixel.x - pixel.size, pixel.y - pixel.size, pixel.size * 3, pixel.size * 3);
        
        // Draw pixel as it "fades back in"
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha * 0.3})`;
        ctx.fillRect(pixel.x, pixel.y, currentSize, currentSize);
      }
    });
    
    if (allDone) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      return true;
    }
    animationId = requestAnimationFrame(drawDissolveIn);
    return false;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function startDissolveOut() {
    if (isAnimating) return;
    isAnimating = true;
    phase = 'dissolving-out';
    
    canvas.style.display = 'block';
    resizeCanvas();
    captureScreen();
    createPixels();
    
    drawDissolveOut();
  }

  function startDissolveIn() {
    if (phase !== 'dissolving-out') return;
    phase = 'dissolving-in';
    
    // Redraw canvas background for dissolve-in effect
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Re-initialize pixels from the current state
    createPixels();
    
    // Start dissolving in from the state where out left off
    pixels.forEach(p => {
      p.progress = 1; // Start from fully dissolved state
    });
    
    drawDissolveIn();
  }

  function init() {
    initCanvas();
    resizeCanvas();
    
    // Listen for Pjax events
    if (window.$) {
      document.addEventListener('pjax:send', function() {
        startDissolveOut();
      });
      
      document.addEventListener('pjax:complete', function() {
        // Small delay to let the new page render
        setTimeout(() => {
          startDissolveIn();
          isAnimating = false;
          phase = 'idle';
        }, 100);
      });
    }
    
    // Handle non-Pjax navigation as well
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
        // If Pjax is enabled, it will handle this
        // We trigger dissolve manually as fallback
        if (!window.$ || !window.$.support.pjax) {
          startDissolveOut();
          setTimeout(() => {
            window.location.href = href;
          }, 600);
          e.preventDefault();
        }
      }
    }, false);
    
    window.addEventListener('resize', () => {
      if (canvas) {
        resizeCanvas();
      }
    });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
