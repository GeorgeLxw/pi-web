"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;

type Point = { x: number; y: number };

export function ImagePreview({ src, alt = "", children, className, style }: ImagePreviewProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Pan/zoom view state
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const gestureRef = useRef<{ scale: number; x: number; y: number; distance: number; midX: number; midY: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setView({ scale: 1, x: 0, y: 0 });
    dialog.showModal();
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  const closePreview = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    setOpen(false);
  };

  const clampView = (scale: number, x: number, y: number) => {
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    if (clampedScale === 1) return { scale: 1, x: 0, y: 0 };
    return { scale: clampedScale, x, y };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      gestureRef.current = {
        ...view,
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      };
    } else {
      gestureRef.current = { ...view, distance: 0, midX: 0, midY: 0 };
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gestureRef.current) return;
    const map = pointersRef.current;
    const current = map.get(event.pointerId);
    if (!current) return;
    map.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const gesture = gestureRef.current;
    if (map.size === 2) {
      const [a, b] = [...map.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, gesture.scale * (distance / Math.max(1, gesture.distance))));
      setView(clampView(
        nextScale,
        gesture.x + (midX - gesture.midX),
        gesture.y + (midY - gesture.midY),
      ));
    } else if (map.size === 1) {
      const rawY = gesture.y + (event.clientY - current.y);
      // Swipe-down dismiss when zoomed out
      if (gesture.scale === 1 && rawY > 110) {
        pointersRef.current.clear();
        gestureRef.current = null;
        closePreview();
        return;
      }
      setView(clampView(
        gesture.scale,
        gesture.x + (event.clientX - current.x),
        rawY,
      ));
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size === 0) gestureRef.current = null;
  };

  const onDoubleClick = () => {
    setView((current) => (current.scale > 1 ? clampView(1, 0, 0) : clampView(2.5, 0, 0)));
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const delta = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    setView((current) => clampView(current.scale * delta, current.x, current.y));
  };

  const reducedMotion = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        style={{
          display: "block",
          padding: 0,
          border: "none",
          background: "none",
          color: "inherit",
          cursor: "zoom-in",
          ...style,
        }}
        onClick={() => setOpen(true)}
        aria-label={t("chat.previewImage")}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t("chat.previewImage")}
      >
        {children}
      </button>
      {open && (
        <dialog
          ref={dialogRef}
          className="image-preview-dialog"
          aria-label={t("chat.previewImage")}
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            closePreview();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            closePreview();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onDoubleClick}
            onWheel={onWheel}
            style={{ touchAction: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              className="image-preview-image"
              src={src}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transition: reducedMotion || gestureRef.current ? "none" : "transform 120ms ease-out",
                willChange: "transform",
                cursor: view.scale > 1 ? "grab" : "zoom-in",
              }}
            />
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="image-preview-close"
            onClick={closePreview}
            aria-label={t("chat.close")}
            title={t("chat.close")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </dialog>
      )}
    </>
  );
}
