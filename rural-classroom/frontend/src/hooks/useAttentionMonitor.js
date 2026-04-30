import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useAttentionMonitor
 * Uses TensorFlow.js BlazeFace (CDN) to detect faces via webcam.
 *
 * Detects:
 *  - No face (student away)
 *  - Multiple faces (cheating / someone helping)
 *  - Head turned sideways (looking away)
 *  - Looking down (phone/book)
 *  - Tab hidden (switched window)
 *
 * Returns status: 'focused' | 'distracted' | 'away' | 'multiple_faces' | 'tab_hidden' | 'loading' | 'denied'
 */
export default function useAttentionMonitor({ onStatusChange, enabled = true }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const modelRef    = useRef(null);
  const intervalRef = useRef(null);
  const noFaceSec   = useRef(0);
  const historyRef  = useRef([]);
  const lastStatus  = useRef('focused');

  const [status,         setStatus]         = useState('loading');
  const [details,        setDetails]        = useState({});
  const [isRunning,      setIsRunning]      = useState(false);
  const [attentionScore, setAttentionScore] = useState(100);
  const [tabHidden,      setTabHidden]      = useState(false);

  // Tab visibility
  useEffect(() => {
    const handler = () => {
      const hidden = document.hidden;
      setTabHidden(hidden);
      if (hidden) {
        const d = { reason: 'Tab switched / minimised', faceCount: 0 };
        setStatus('tab_hidden');
        setDetails(d);
        onStatusChange?.('tab_hidden', d);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [onStatusChange]);

  // Load TF + BlazeFace from CDN
  const loadModel = useCallback(async () => {
    if (modelRef.current) return true;
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.1.0/dist/blazeface.min.js');
      modelRef.current = await window.blazeface.load();
      console.log('BlazeFace loaded');
      return true;
    } catch (e) {
      console.error('BlazeFace failed:', e);
      return false;
    }
  }, []);

  // Draw detection overlay on canvas
  const drawBoxes = useCallback((predictions) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((pred, i) => {
      const [x1, y1] = pred.topLeft;
      const [x2, y2] = pred.bottomRight;
      const w = x2 - x1, h = y2 - y1;
      const ok = predictions.length === 1 && i === 0;

      ctx.strokeStyle = ok ? '#22d3ee' : '#ef4444';
      ctx.lineWidth   = 2;
      ctx.strokeRect(x1, y1, w, h);

      // Corner accents
      const cs = 12;
      ctx.lineWidth = 3;
      [[x1,y1,1,1],[x2,y1,-1,1],[x1,y2,1,-1],[x2,y2,-1,-1]].forEach(([cx,cy,sx,sy]) => {
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+cs*sx, cy);          ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx,       cy+cs*sy);    ctx.stroke();
      });

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = ok ? '#22d3ee' : '#ef4444';
      ctx.fillText(ok ? '✓ Focused' : `⚠ Face ${i+1}`, x1+4, Math.max(y1-5, 12));

      // Landmarks
      (pred.landmarks || []).forEach(([lx, ly]) => {
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5, 0, Math.PI*2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
      });
    });
  }, []);

  // Classify face predictions into attention status
  const classify = useCallback((predictions) => {
    const count = predictions.length;
    let newStatus = 'focused';
    let reason = 'Face detected, looking at screen';
    let lookAway = false;

    if (count === 0) {
      noFaceSec.current += 1.5;
      if (noFaceSec.current >= 3) {
        newStatus = 'away';
        reason    = `No face detected for ${Math.round(noFaceSec.current)}s — student away`;
      } else {
        newStatus = lastStatus.current; // don't flicker on brief occlusion
        reason    = 'Face momentarily not visible';
      }
    } else {
      noFaceSec.current = 0;
      if (count > 1) {
        newStatus = 'multiple_faces';
        reason    = `${count} faces in frame — another person present`;
      } else {
        const face      = predictions[0];
        const lm        = face.landmarks || [];
        if (lm.length >= 4) {
          const [rx, ry] = lm[0]; // right eye
          const [lx, ly] = lm[1]; // left eye
          const [nx, ny] = lm[2]; // nose
          const eyeMidX  = (rx + lx) / 2;
          const eyeMidY  = (ry + ly) / 2;
          const eyeW     = Math.abs(lx - rx) || 1;

          const hRatio = (nx - eyeMidX) / eyeW;        // positive = turned right
          const vRatio = (ny - eyeMidY) / eyeW;        // large positive = looking down

          if (Math.abs(hRatio) > 0.5) {
            newStatus = 'distracted';
            reason    = hRatio > 0 ? 'Head turned RIGHT — not looking at screen' : 'Head turned LEFT — not looking at screen';
            lookAway  = true;
          } else if (vRatio < -0.15) {
            newStatus = 'distracted';
            reason    = 'Head tilted back / looking up';
            lookAway  = true;
          } else if (vRatio > 1.1) {
            newStatus = 'distracted';
            reason    = 'Looking down — possibly at phone or book';
            lookAway  = true;
          } else {
            newStatus = 'focused';
            reason    = 'Face detected, looking at screen';
          }
        }
      }
    }

    const d = { reason, faceCount: count, noFaceSeconds: Math.round(noFaceSec.current), lookAway };
    lastStatus.current = newStatus;
    setStatus(newStatus);
    setDetails(d);

    // Rolling attention score over last 20 readings
    historyRef.current.push(newStatus === 'focused' ? 1 : 0);
    if (historyRef.current.length > 20) historyRef.current.shift();
    const score = Math.round((historyRef.current.filter(v => v).length / historyRef.current.length) * 100);
    setAttentionScore(score);
    onStatusChange?.(newStatus, d);
  }, [onStatusChange]);

  // Start camera + detection
  const startMonitor = useCallback(async () => {
    if (!enabled) return;
    setStatus('loading');
    setDetails({ reason: 'Loading AI model…' });

    const ok = await loadModel();
    if (!ok) { setStatus('denied'); setDetails({ reason: 'TensorFlow model failed to load' }); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => { videoRef.current.onloadedmetadata = r; });
        await videoRef.current.play().catch(() => {});
      }
      setIsRunning(true);
      setStatus('focused');

      intervalRef.current = setInterval(async () => {
        if (!modelRef.current || !videoRef.current || document.hidden) return;
        if (videoRef.current.readyState < 2) return;
        try {
          const preds = await modelRef.current.estimateFaces(videoRef.current, false);
          drawBoxes(preds);
          classify(preds);
        } catch (_) {}
      }, 1500);

    } catch (err) {
      setStatus('denied');
      setDetails({ reason: 'Camera access denied — allow camera in browser settings' });
    }
  }, [enabled, loadModel, drawBoxes, classify]);

  const stopMonitor = useCallback(() => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsRunning(false);
    setStatus('loading');
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  useEffect(() => () => stopMonitor(), [stopMonitor]);

  return { videoRef, canvasRef, status, details, attentionScore, startMonitor, stopMonitor, isRunning, tabHidden };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Script load failed: ${src}`));
    document.head.appendChild(s);
  });
}
