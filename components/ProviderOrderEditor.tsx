"use client";

import { useEffect, useState, type CSSProperties, type DragEvent } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  arrangeProviders,
  getProviderOrder,
  notifyProviderOrderChanged,
  reorderList,
  setProviderOrder,
} from "@/lib/provider-order-preference";

interface ProviderOrderEditorProps {
  /** Every orderable provider in the default order (config keys + auth ids). */
  providers: string[];
}

/**
 * Drag-to-reorder list of the provider groups shown in the chat model
 * selector. Edits are persisted to localStorage (`pi-provider-order`) and
 * applied live by the ModelSelector dropdown.
 */
export function ProviderOrderEditor({ providers }: ProviderOrderEditorProps) {
  const { t } = useI18n();
  const [order, setOrder] = useState<string[]>(() =>
    arrangeProviders(providers, getProviderOrder()),
  );
  const [draggingProvider, setDraggingProvider] = useState<string | null>(null);
  const [overProvider, setOverProvider] = useState<string | null>(null);

  useEffect(() => {
    // Config edits / auth changes can add or remove providers: re-arrange the
    // default list while keeping whatever order the user already chose.
    setOrder(arrangeProviders(providers, getProviderOrder()));
  }, [providers]);

  const commitOrder = (next: string[]) => {
    setOrder(next);
    setProviderOrder(next);
    notifyProviderOrderChanged();
  };

  const resetOrder = () => {
    setOrder(arrangeProviders(providers, []));
    setProviderOrder([]);
    notifyProviderOrderChanged();
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, provider: string) => {
    setDraggingProvider(provider);
    event.dataTransfer.effectAllowed = "move";
    // Firefox needs data set to start a drag.
    try {
      event.dataTransfer.setData("text/plain", provider);
    } catch {
      // best-effort
    }
  };

  const handleDropOn = (target: string) => {
    if (draggingProvider === null || draggingProvider === target) {
      setDraggingProvider(null);
      setOverProvider(null);
      return;
    }
    const from = order.indexOf(draggingProvider);
    const to = order.indexOf(target);
    if (from !== -1 && to !== -1) {
      commitOrder(reorderList(order, from, to));
    }
    setDraggingProvider(null);
    setOverProvider(null);
  };

  const rowStyle = (provider: string): CSSProperties => {
    const isOver = overProvider === provider && draggingProvider !== null && draggingProvider !== provider;
    return {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      background: isOver ? "var(--bg-selected)" : "var(--bg-panel)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      cursor: "grab",
      opacity: draggingProvider === provider ? 0.45 : 1,
      boxSizing: "border-box",
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
        {t("i18n.providerGroupOrderDescription")}
      </div>
      <div role="list" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {order.length === 0 ? (
          <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-dim)" }}>
            {t("i18n.noProviders")}
          </div>
        ) : order.map((provider) => (
          <div
            key={provider}
            role="listitem"
            draggable
            aria-label={provider}
            title={`${provider} — ${t("i18n.dragToReorder")}`}
            style={rowStyle(provider)}
            onDragStart={(event) => handleDragStart(event, provider)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (overProvider !== provider) setOverProvider(provider);
            }}
            onDragLeave={() => {
              if (overProvider === provider) setOverProvider(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDropOn(provider);
            }}
            onDragEnd={() => {
              setDraggingProvider(null);
              setOverProvider(null);
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              style={{ flexShrink: 0, color: "var(--text-dim)" }}
            >
              <circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>
              {provider}
            </span>
            {order.length > 1 && (
              <span style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>
                {order.indexOf(provider) + 1}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={resetOrder}
          disabled={order.length === 0}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: order.length === 0 ? "default" : "pointer",
            fontSize: 12,
            padding: "4px 6px",
            borderRadius: 5,
            opacity: order.length === 0 ? 0.5 : 1,
          }}
        >
          {t("i18n.providerGroupOrderReset")}
        </button>
      </div>
    </div>
  );
}
