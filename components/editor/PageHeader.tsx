"use client";

import { useState, useCallback, useEffect } from "react";
import { debounce } from "@/lib/utils";

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
];

const DEFAULT_ICONS = [
  "📄","📝","⭐","🎯","💡","📚","🚀","🎨",
  "📊","✅","🏠","💼","🔥","🌟","🎵","🏆",
  "💎","🌈","🎭","🌺","🦋","🎪","🔮","⚡",
];

interface PageHeaderProps {
  pageId: string;
  initialCover: string | null;
  initialIcon: string | null;
  title: string;
  onTitleChange: (val: string) => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  titleRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function PageHeader({
  pageId,
  initialCover,
  initialIcon,
  title,
  onTitleChange,
  onTitleKeyDown,
  titleRef,
}: PageHeaderProps) {
  // Resolve initial cover — stored as gradient string or null
  const resolveInitialIndex = (cover: string | null) => {
    if (!cover) return 0;
    const idx = COVER_GRADIENTS.indexOf(cover);
    return idx >= 0 ? idx : 0;
  };

  const [coverIndex, setCoverIndex] = useState(() => resolveInitialIndex(initialCover));
  const [icon, setIcon] = useState(initialIcon ?? "📄");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverHover, setShowCoverHover] = useState(false);

  // Reset when navigating to a different page
  useEffect(() => {
    setCoverIndex(resolveInitialIndex(initialCover));
    setIcon(initialIcon ?? "📄");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // ── Debounced saves ───────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveCover = useCallback(
    debounce(async (cover: string) => {
      await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover }),
      });
    }, 500),
    [pageId]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveIcon = useCallback(
    async (newIcon: string) => {
      await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icon: newIcon }),
      });
    },
    [pageId]
  );

  function handleNextCover() {
    const nextIndex = (coverIndex + 1) % COVER_GRADIENTS.length;
    setCoverIndex(nextIndex);
    debouncedSaveCover(COVER_GRADIENTS[nextIndex]);
  }

  async function handleSelectIcon(emoji: string) {
    setIcon(emoji);
    setShowIconPicker(false);
    await saveIcon(emoji);
  }

  const coverStyle = { background: COVER_GRADIENTS[coverIndex] };

  return (
    <div>
      {/* ── Cover ── */}
      <div
        className="page-cover relative"
        style={coverStyle}
        onMouseEnter={() => setShowCoverHover(true)}
        onMouseLeave={() => setShowCoverHover(false)}
      >
        {showCoverHover && (
          <button
            onClick={handleNextCover}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Change cover
          </button>
        )}
      </div>

      {/* ── Icon + title ── */}
      <div className="relative mx-auto w-full max-w-3xl px-4 md:px-8">
        <div className="relative -mt-9 mb-4 inline-block">
          <button
            onClick={() => setShowIconPicker((v) => !v)}
            className="page-icon"
            aria-label="Change page icon"
            aria-expanded={showIconPicker}
          >
            <span className="page-icon-emoji">{icon}</span>
          </button>

          {showIconPicker && (
            <>
              {/* Backdrop to close picker */}
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setShowIconPicker(false)}
              />
              {/* Picker — fixed width, positioned below icon, won't clip */}
              <div className="absolute left-0 top-full z-50 mt-3 w-[280px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
                <p className="mb-3 text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                  Choose icon
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {DEFAULT_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectIcon(emoji)}
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        "text-[18px] leading-none select-none",
                        icon === emoji
                          ? "bg-[var(--color-accent-light)] ring-2 ring-[var(--color-accent)]"
                          : "hover:bg-neutral-100",
                      ].join(" ")}
                      aria-label={`Set icon to ${emoji}`}
                      aria-pressed={icon === emoji}
                    >
                      <span style={{ fontSize: "18px", lineHeight: 1 }}>{emoji}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowIconPicker(false)}
                  className="mt-3 w-full rounded-lg py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>

        {/* Title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => {
            onTitleChange(e.target.value);
            const el = titleRef.current;
            if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
          }}
          onKeyDown={onTitleKeyDown}
          placeholder="Untitled"
          rows={1}
          maxLength={500}
          aria-label="Page title"
          className="mb-2 w-full resize-none overflow-hidden bg-transparent text-4xl font-bold text-[#1a1830] placeholder:text-neutral-300 outline-none border-none focus:ring-0 leading-tight"
        />
      </div>
    </div>
  );
}
