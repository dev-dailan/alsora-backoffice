import { useEffect, useRef, useState, type CSSProperties } from "react";
import { clsx } from "@/shared/lib/clsx";

export interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
}

interface MultiSelectProps<T extends string> {
  options: readonly MultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect<T extends string>({
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  disabled,
  className,
}: MultiSelectProps<T>) {
  const [menuOpen, setOpen] = useState(false);
  const open = menuOpen && !disabled;
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // 테이블 등 overflow-hidden 컨테이너에 잘리지 않도록 fixed 위치로 띄운다.
  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuStyle({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = (option: T) => {
    const next = value.includes(option) ? value.filter((v) => v !== option) : [...value, option];
    // 선택 순서와 무관하게 options 순서로 정렬해 둔다.
    onChange(options.map((o) => o.value).filter((v) => next.includes(v)));
  };

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50",
          className
        )}
      >
        <span className={clsx("truncate", selectedLabels.length ? "text-ink" : "text-slate-400")}>
          {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
        </span>
        <span aria-hidden className="text-xs text-slate-400">
          ▾
        </span>
      </button>
      {open && (
        <ul
          ref={menuRef}
          role="listbox"
          aria-multiselectable
          style={menuStyle}
          className="fixed z-50 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={value.includes(option.value)}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-ink hover:bg-brand-lightest">
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  className="accent-brand-dark"
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
