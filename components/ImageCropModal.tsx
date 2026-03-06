"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Check, Upload } from "lucide-react";

interface ImageCropModalProps {
  file: File;
  aspectRatio: number; // e.g. 1 for square, 16/9 for banner
  shape?: "circle" | "rect";
  title: string;
  onCrop: (blob: Blob) => void;
  onClose: () => void;
}

export const ImageCropModal = ({
  file,
  aspectRatio,
  shape = "rect",
  title,
  onCrop,
  onClose,
}: ImageCropModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  // Canvas display size
  const CANVAS_W = 400;
  const CANVAS_H = Math.round(CANVAS_W / aspectRatio);

  useEffect(() => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      imgRef.current = img;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      // Auto-fit: scale so image fills the crop area
      const scaleX = CANVAS_W / img.naturalWidth;
      const scaleY = CANVAS_H / img.naturalHeight;
      const fitScale = Math.max(scaleX, scaleY);
      setZoom(fitScale);
      setOffset({
        x: (CANVAS_W - img.naturalWidth * fitScale) / 2,
        y: (CANVAS_H - img.naturalHeight * fitScale) / 2,
      });
      setImgLoaded(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file, CANVAS_W, CANVAS_H]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw image
    ctx.save();
    ctx.drawImage(img, offset.x, offset.y, naturalSize.w * zoom, naturalSize.h * zoom);
    ctx.restore();

    // Overlay with crop shape cutout
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Cut out the crop area
    ctx.globalCompositeOperation = "destination-out";
    if (shape === "circle") {
      const r = Math.min(CANVAS_W, CANVAS_H) / 2 - 4;
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, CANVAS_H / 2, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const pad = 4;
      ctx.fillRect(pad, pad, CANVAS_W - pad * 2, CANVAS_H - pad * 2);
    }
    ctx.restore();

    // Border
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    if (shape === "circle") {
      const r = Math.min(CANVAS_W, CANVAS_H) / 2 - 4;
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, CANVAS_H / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(4, 4, CANVAS_W - 8, CANVAS_H - 8);
    }
    ctx.restore();
  }, [imgLoaded, offset, zoom, naturalSize, shape, CANVAS_W, CANVAS_H]);

  useEffect(() => { draw(); }, [draw]);

  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    const imgW = naturalSize.w * z;
    const imgH = naturalSize.h * z;
    const minX = Math.min(0, CANVAS_W - imgW);
    const minY = Math.min(0, CANVAS_H - imgH);
    const maxX = Math.max(0, CANVAS_W - imgW);
    const maxY = Math.max(0, CANVAS_H - imgH);
    return {
      x: Math.max(minX, Math.min(maxX, ox)),
      y: Math.max(minY, Math.min(maxY, oy)),
    };
  }, [naturalSize, CANVAS_W, CANVAS_H]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const newOff = clampOffset(e.clientX - dragStart.x, e.clientY - dragStart.y, zoom);
    setOffset(newOff);
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.max(0.5, Math.min(4, zoom + delta));
    const newOff = clampOffset(offset.x, offset.y, newZoom);
    setZoom(newZoom);
    setOffset(newOff);
  };

  const handleZoom = (dir: 1 | -1) => {
    const newZoom = Math.max(0.5, Math.min(4, zoom + dir * 0.15));
    const newOff = clampOffset(offset.x, offset.y, newZoom);
    setZoom(newZoom);
    setOffset(newOff);
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    // Output canvas at 2x for retina
    const OUT_W = shape === "circle" ? 256 : CANVAS_W * 2;
    const OUT_H = shape === "circle" ? 256 : CANVAS_H * 2;
    const scale = OUT_W / CANVAS_W;

    const out = document.createElement("canvas");
    out.width = OUT_W;
    out.height = OUT_H;
    const ctx = out.getContext("2d")!;

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(OUT_W / 2, OUT_H / 2, OUT_W / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(
      img,
      offset.x * scale,
      offset.y * scale,
      naturalSize.w * zoom * scale,
      naturalSize.h * zoom * scale
    );

    out.toBlob((blob) => { if (blob) onCrop(blob); }, "image/webp", 0.9);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden border"
        style={{ backgroundColor: "#0f0f11", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="font-mono text-xs font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
            // {title}
          </span>
          <button onClick={onClose} className="opacity-40 hover:opacity-80 transition-opacity">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex items-center justify-center p-5" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-xl"
            style={{
              cursor: dragging ? "grabbing" : "grab",
              maxWidth: "100%",
              display: "block",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Hint */}
        <p className="text-center font-mono text-[10px] pb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          drag to reposition · scroll to zoom
        </p>

        {/* Controls */}
        <div className="flex items-center justify-between px-5 pb-5 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${((zoom - 0.5) / 3.5) * 100}%`,
                  backgroundColor: "var(--theme-primary, #7c3aed)",
                }}
              />
            </div>
            <button
              onClick={() => handleZoom(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCrop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
            style={{ background: "var(--theme-primary, #7c3aed)", color: "#fff" }}
          >
            <Check className="w-4 h-4" /> apply
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Trigger button ─────────────────────────────────────────────

interface ImageUploadTriggerProps {
  label: string;
  preview?: string | null;
  aspectRatio: number;
  shape?: "circle" | "rect";
  onFile: (file: File) => void;
  width?: number;
  height?: number;
}

export const ImageUploadTrigger = ({
  label,
  preview,
  aspectRatio,
  shape = "rect",
  onFile,
  width = 80,
  height,
}: ImageUploadTriggerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const h = height ?? Math.round(width / aspectRatio);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative overflow-hidden transition-all group"
        style={{
          width,
          height: h,
          borderRadius: shape === "circle" ? "50%" : "12px",
          background: preview ? "transparent" : "rgba(255,255,255,0.04)",
          border: "1.5px dashed rgba(255,255,255,0.15)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
              style={{ borderRadius: shape === "circle" ? "50%" : "10px" }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "rgba(0,0,0,0.5)",
                borderRadius: shape === "circle" ? "50%" : "10px",
              }}
            >
              <Upload className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 h-full">
            <Upload className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</span>
          </div>
        )}
      </button>
    </div>
  );
};