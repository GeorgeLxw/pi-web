"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";

const DISMISS_KEY = "pi-install-hint-dismissed";

function isStandalone(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia?.("(display-mode: standalone)").matches === true;
}

function isInstallableMobile(): boolean {
  if (typeof navigator === "undefined" || isStandalone()) return false;
  const ua = navigator.userAgent ?? "";
  return /iphone|ipad|ipod|android/i.test(ua);
}

/** One-time, dismissible hint to add the app to the home screen on phones. */
export function PwaInstallHint() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isInstallableMobile()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // best-effort
    }
  };

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: "calc(84px + env(safe-area-inset-bottom))",
        left: 12,
        right: 12,
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 12px",
        borderRadius: 10,
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.16)",
        fontSize: 12,
        color: "var(--text)",
        maxWidth: 420,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
        <path d="M12 17v5" />
        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z" />
      </svg>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{t("pwa.installHint")}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("i18n.close")}
        title={t("i18n.close")}
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          border: "none",
          background: "var(--bg-hover)",
          color: "var(--text-muted)",
          borderRadius: 6,
          cursor: "pointer",
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
