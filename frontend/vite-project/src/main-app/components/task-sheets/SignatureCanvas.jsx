import { useRef, useState, useEffect, useCallback } from "react";

/**
 * SignatureCanvas — HTML5 canvas for capturing client signatures.
 * Touch and mouse compatible. Returns base64 PNG via onChange.
 *
 * Props:
 *  - onChange(base64String | null) — called when signature changes
 *  - disabled — if true, canvas is read-only
 *  - width, height — canvas dimensions (default 320x160)
 */
const SignatureCanvas = ({ onChange, disabled = false, width = 320, height = 160 }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoords = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback(
    (e) => {
      if (disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const { x, y } = getCoords(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    },
    [disabled, getCoords]
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const { x, y } = getCoords(e, canvas);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    },
    [isDrawing, disabled, getCoords]
  );

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (onChange) {
      onChange(canvas.toDataURL("image/png"));
    }
  }, [isDrawing, onChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onChange) onChange(null);
  }, [onChange]);

  // Attach listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent page scrolling while drawing on canvas
    const preventScroll = (e) => {
      if (isDrawing) e.preventDefault();
    };

    canvas.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      canvas.removeEventListener("touchmove", preventScroll);
    };
  }, [isDrawing]);

  return (
    <div className="signature-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`signature-canvas ${disabled ? "signature-canvas--disabled" : ""}`}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      {!disabled && (
        <div className="signature-canvas-controls">
          <span className="signature-hint">Sign with finger or mouse</span>
          {hasSignature && (
            <button
              type="button"
              className="signature-clear-btn"
              onClick={clearCanvas}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas;
