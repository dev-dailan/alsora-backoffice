import { useEffect, useState, type ReactNode } from "react";
import { clsx } from "@/shared/lib/clsx";

export function Drawer({
  onClose,
  children,
}: {
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsOpen(true));
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  function close() {
    setIsOpen(false);
    setTimeout(onClose, 200);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={clsx(
          "absolute inset-0 bg-slate-900/40 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
        aria-hidden="true"
      />
      <div
        className={clsx(
          "relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {children(close)}
      </div>
    </div>
  );
}
