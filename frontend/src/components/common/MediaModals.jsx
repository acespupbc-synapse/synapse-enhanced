import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  VideoCamera,
  Crop,
  PencilSimpleLine,
  ArrowsClockwise,
  Plus,
  Minus,
  CheckCircle,
  X,
  WarningCircle,
  Eraser
} from '@phosphor-icons/react';
import './MediaModals.css';

// =============================================================================
// 1. Camera Capture Modal
// =============================================================================
export function CameraModal({ isOpen, onClose, onCapture }) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [snappedPhoto, setSnappedPhoto] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (deviceId) => {
    stopStream();
    setCameraError('');
    setSnappedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this environment.');
      }

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(cams);
      if (!deviceId && cams.length > 0) {
        setSelectedDeviceId(cams[0].deviceId);
      }
    } catch (err) {
      setCameraError(err.message || 'Unable to access webcam.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setSnappedPhoto(null);
    }
    return () => stopStream();
  }, [isOpen]);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setSnappedPhoto(dataUrl);
    stopStream();
  };

  const handleConfirm = () => {
    if (snappedPhoto) {
      onCapture(snappedPhoto);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sreg-cam-modal-backdrop" onClick={onClose}>
      <div className="sreg-cam-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sreg-cam-modal-header">
          <div className="sreg-cam-modal-title-wrap">
            <VideoCamera size={20} weight="bold" color="#E00000" />
            <span className="sreg-cam-modal-title">Live ID Photo Capture</span>
          </div>

          {videoDevices.length > 0 && !snappedPhoto && (
            <div className="sreg-cam-device-wrap">
              <label htmlFor="camSelectModal" className="sreg-cam-device-label">Device:</label>
              <select
                id="camSelectModal"
                className="sreg-cam-device-select"
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  startCamera(e.target.value);
                }}
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="button" className="sreg-cam-modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="sreg-cam-modal-body">
          {cameraError ? (
            <div className="sreg-cam-error-state">
              <WarningCircle size={36} color="#DC2626" weight="fill" />
              <p>{cameraError}</p>
              <button type="button" className="sreg-btn-prev" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <div className="sreg-cam-viewfinder-wrap">
              {!snappedPhoto ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="sreg-cam-video"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="sreg-cam-overlay-guides">
                    <div className="sreg-cam-guide-oval" />
                    <span className="sreg-cam-guide-text">Align face within oval frame</span>
                  </div>
                </>
              ) : (
                <div className="sreg-cam-preview-wrap">
                  <img
                    src={snappedPhoto}
                    alt="Captured preview"
                    className="sreg-cam-preview-img"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="sreg-cam-preview-badge">
                    <CheckCircle size={14} weight="bold" /> Photo Captured
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!cameraError && (
          <div className="sreg-cam-modal-footer">
            {!snappedPhoto ? (
              <>
                <button type="button" className="sreg-btn-prev" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sreg-cam-snap-btn"
                  style={{ backgroundColor: '#7B0000' }}
                  onClick={handleSnap}
                >
                  <Camera size={18} weight="bold" />
                  <span>Take Photo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="sreg-btn-prev"
                  onClick={() => startCamera(selectedDeviceId)}
                >
                  <ArrowsClockwise size={16} /> Retake
                </button>
                <button
                  type="button"
                  className="sreg-cam-confirm-btn"
                  style={{ backgroundColor: '#7B0000' }}
                  onClick={handleConfirm}
                >
                  <CheckCircle size={16} weight="bold" /> Use This Photo
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// 2. Photo Cropper Modal (1500 × 1500 Standard)
// =============================================================================
export function CropperModal({ isOpen, onClose, imageSrc, onApplyCrop }) {
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropRotation, setCropRotation] = useState(0);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    if (isOpen) {
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropRotation(0);
    }
  }, [isOpen, imageSrc]);

  const handlePointerDown = (e) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: cropOffset.x,
      initialY: cropOffset.y
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setCropOffset({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
  };

  const handleApply = async () => {
    if (!imageSrc) return;

    let srcToLoad = imageSrc;
    if (imageSrc.startsWith('http')) {
      try {
        const token = localStorage.getItem('synapse_auth_token');
        const proxyUrl = `/api/admin/media-proxy?url=${encodeURIComponent(imageSrc)}`;
        const res = await fetch(proxyUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const blob = await res.blob();
          srcToLoad = URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn('[CropperModal] Proxy load fallback:', err);
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1500;
        canvas.height = 1500;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1500, 1500);

        const natW = img.naturalWidth || img.width;
        const natH = img.naturalHeight || img.height;

        const baseScale = Math.max(1500 / natW, 1500 / natH);
        const drawWidth = natW * baseScale;
        const drawHeight = natH * baseScale;

        const scaleRatio = 1500 / 320; // 320 is viewport width

        ctx.save();
        ctx.translate(750, 750);
        ctx.translate(cropOffset.x * scaleRatio, cropOffset.y * scaleRatio);
        ctx.rotate((cropRotation * Math.PI) / 180);
        ctx.scale(cropZoom, cropZoom);

        ctx.drawImage(
          img,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
        ctx.restore();

        const croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
        onApplyCrop(croppedUrl);
        onClose();
      } catch (cropErr) {
        console.error('[CropperModal] Canvas crop error:', cropErr);
      }
    };
    img.onerror = (err) => {
      console.error('[CropperModal] Image load error:', err);
    };
    img.src = srcToLoad;
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="sreg-modal-backdrop" onClick={onClose}>
      <div className="sreg-cropper-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sreg-cropper-modal-header">
          <div className="sreg-cropper-modal-title-wrap">
            <Crop size={20} weight="bold" color="#E00000" />
            <div>
              <span className="sreg-cropper-modal-title">Crop ID Photo</span>
              <span className="sreg-cropper-modal-spec">1500 × 1500 px Standard</span>
            </div>
          </div>
          <button type="button" className="sreg-cam-modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="sreg-cropper-modal-body">
          <div
            className="sreg-crop-viewport"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="Drag to position photo"
          >
            <img
              src={imageSrc}
              alt="Crop target"
              className="sreg-crop-img"
              style={{
                transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom}) rotate(${cropRotation}deg)`,
                transformOrigin: 'center center'
              }}
              draggable={false}
            />
            <div className="sreg-crop-guide-overlay">
              <div className="sreg-crop-guide-oval" />
              <div className="sreg-crop-guide-line h1" />
              <div className="sreg-crop-guide-line h2" />
              <div className="sreg-crop-guide-line v1" />
              <div className="sreg-crop-guide-line v2" />
            </div>
          </div>

          <div className="sreg-crop-toolbar">
            <div className="sreg-crop-zoom-wrap">
              <span className="sreg-crop-label">Zoom:</span>
              <button
                type="button"
                className="sreg-crop-btn-mini"
                onClick={() => setCropZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                title="Zoom out"
              >
                <Minus size={13} />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="sreg-crop-slider"
                aria-label="Zoom Level"
              />
              <button
                type="button"
                className="sreg-crop-btn-mini"
                onClick={() => setCropZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                title="Zoom in"
              >
                <Plus size={13} />
              </button>
              <span className="sreg-crop-val">{(cropZoom * 100).toFixed(0)}%</span>
            </div>

            <div className="sreg-crop-tools-wrap">
              <button
                type="button"
                className="sreg-crop-tool-btn"
                onClick={() => setCropRotation((r) => (r + 90) % 360)}
                title="Rotate 90 degrees"
              >
                <ArrowsClockwise size={14} />
                <span>Rotate</span>
              </button>
              <button
                type="button"
                className="sreg-crop-tool-btn"
                onClick={() => {
                  setCropZoom(1);
                  setCropOffset({ x: 0, y: 0 });
                  setCropRotation(0);
                }}
                title="Reset"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        <div className="sreg-cropper-modal-footer">
          <button type="button" className="sreg-btn-prev" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="sreg-cam-confirm-btn"
            style={{ backgroundColor: '#7B0000' }}
            onClick={handleApply}
          >
            <CheckCircle size={16} weight="bold" />
            <span>Apply Crop (1500 × 1500)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 3. Signature Drawing Modal (2000 × 1200 Standard)
// =============================================================================
export function SignatureModal({ isOpen, onClose, onApplySignature }) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [brushSize, setBrushSize] = useState(3.5);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.lineWidth = stroke.brushSize;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      strokesRef.current = [];
      setStrokeCount(0);
      redraw();
    }
  }, [isOpen]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    currentStrokeRef.current = { brushSize, points: [pos] };
    strokesRef.current.push(currentStrokeRef.current);
    setStrokeCount(strokesRef.current.length);
    redraw();
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    currentStrokeRef.current.points.push(pos);
    redraw();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  };

  const handleClear = () => {
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
  };

  const handleUndo = () => {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    redraw();
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokesRef.current.length === 0) return;

    // Export 2000 x 1200
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 2000;
    exportCanvas.height = 1200;
    const eCtx = exportCanvas.getContext('2d');
    eCtx.fillStyle = '#FFFFFF';
    eCtx.fillRect(0, 0, 2000, 1200);
    eCtx.drawImage(canvas, 0, 0, 2000, 1200);

    const sigDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
    onApplySignature(sigDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="sreg-modal-backdrop" onClick={onClose}>
      <div className="sreg-sig-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sreg-sig-modal-header">
          <div className="sreg-sig-modal-title-wrap">
            <PencilSimpleLine size={20} weight="bold" color="#E00000" />
            <div>
              <span className="sreg-sig-modal-title">Official Student Signature</span>
              <span className="sreg-sig-modal-spec">White background · 2000 × 1200 px</span>
            </div>
          </div>
          <button type="button" className="sreg-cam-modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="sreg-sig-modal-body">
          <div className="sreg-sig-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={700}
              height={360}
              className="sreg-sig-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            {strokeCount === 0 && (
              <div className="sreg-sig-canvas-watermark">
                <PencilSimpleLine size={28} />
                <span>Draw your official signature here</span>
              </div>
            )}
            <div className="sreg-sig-guideline" />
          </div>

          <div className="sreg-sig-toolbar">
            <div className="sreg-sig-pen-sizes">
              <span className="sreg-sig-label">Stroke:</span>
              {[2.5, 3.5, 5].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`sreg-sig-size-btn ${brushSize === sz ? 'active' : ''}`}
                  onClick={() => setBrushSize(sz)}
                >
                  {sz === 2.5 ? 'Fine' : sz === 3.5 ? 'Regular' : 'Bold'}
                </button>
              ))}
            </div>

            <div className="sreg-sig-actions">
              <button
                type="button"
                className="sreg-sig-btn-sec"
                onClick={handleUndo}
                disabled={strokeCount === 0}
              >
                Undo
              </button>
              <button
                type="button"
                className="sreg-sig-btn-sec"
                onClick={handleClear}
                disabled={strokeCount === 0}
              >
                <Eraser size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        <div className="sreg-sig-modal-footer">
          <button type="button" className="sreg-btn-prev" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="sreg-cam-confirm-btn"
            style={{ backgroundColor: '#7B0000' }}
            disabled={strokeCount === 0}
            onClick={handleConfirm}
          >
            <CheckCircle size={16} weight="bold" />
            <span>Apply Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
}
