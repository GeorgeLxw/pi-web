"use client";

import { useEffect, useState, type CSSProperties, type DragEvent } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  arrangeProviders,
  defaultProviderOrder,
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
  // Baseline = alphabetical, the same default the chat dropdown uses, so the
  // editor never shows an order the dropdown won't honor. Drags persist an
  // explicit order on top of it.
  const defaultOrder = defaultProviderOrder(providers);
  const [order, setOrder] = useState<string[]>(() =>
    arrangeProviders(defaultOrder, getProviderOrder()),
  );
  const [draggingProvider, setDraggingProvider] = useState<string | null>(null);
  const [overProvider, setOverProvider] = useState<string | null>(null);

  useEffect(() => {
    // Config edits / auth changes can add or remove providers: re-arrange the
    // default list while keeping whatever order the user already chose.
    setOrder(arrangeProviders(defaultProviderOrder(providers), getProviderOrder()));
  }, [providers]);

  const commitOrder = (next: string[]) => {
    setOrder(next);
    setProviderOrder(next);
    notifyProviderOrderChanged();
  };

  const resetOrder = () => {
    setOrder(arrangeProviders(defaultProviderOrder(providers), []));
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
      touchAction: "pan-y", // keep vertical scrolling on touch; reorder via buttons there
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
        ) : order.map((provider, index) => (
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
              <span className="provider-order-move">
                <button
                  type="button"
                  disabled={index === 0}
                  aria-label={t("i18n.providerOrderMoveUp")}
                  title={t("i18n.providerOrderMoveUp")}
                  onClick={(event) => {
                    event.stopPropagation();
                    commitOrder(reorderList(order, index, index - 1));
                  }}
                  style={{
                    width: 22, height: 22, padding: 0, border: "none", background: "none",
                    color: index === 0 ? "var(--text-dim)" : "var(--text-muted)",
                    cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.35 : 1,
                    borderRadius: 4, flexShrink: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button
                  type="button"
                  disabled={index === order.length - 1}
                  aria-label={t("i18n.providerOrderMoveDown")}
                  title={t("i18n.providerOrderMoveDown")}
                  onClick={(event) => {
                    event.stopPropagation();
                    commitOrder(reorderList(order, index, index + 1));
                  }}
                  style={{
                    width: 22, height: 22, padding: 0, border: "none", background: "none",
                    color: index === order.length - 1 ? "var(--text-dim)" : "var(--text-muted)",
                    cursor: index === order.length - 1 ? "default" : "pointer", opacity: index === order.length - 1 ? 0.35 : 1,
                    borderRadius: 4, flexShrink: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </span>
            )}
            {order.length > 1 && (
              <span style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0, minWidth: 12, textAlign: "right" }}>
                {index + 1}
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
