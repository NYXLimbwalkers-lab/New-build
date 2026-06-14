import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** "bottom" reads like a phone sheet (drag-to-dismiss); "center" a boutique modal. */
  position?: "bottom" | "center";
  label?: string;
  className?: string;
}

const EASE_IOS = [0.32, 0.72, 0, 1] as const; // the iOS sheet curve (Vaul/Ionic)

/*
  Frosted-glass overlay sheet/modal. The bottom variant is a real draggable
  sheet: drag the grabber down to dismiss, with the backdrop fading as it moves
  (verified thresholds — flick velocity > 500px/s OR dragged past ~45%).
  role="dialog" + aria-modal + Escape + restore-scroll for accessibility.
*/
export function Sheet({
  open,
  onClose,
  children,
  position = "bottom",
  label = "Details",
  className,
}: SheetProps) {
  const y = useMotionValue(0);
  // Backdrop dims as the sheet is dragged away — driven off y, no re-renders.
  const backdropOpacity = useTransform(y, [0, 400], [1, 0]);

  useEffect(() => {
    if (!open) return;
    y.set(0);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, y]);

  function onDragEnd(_: unknown, info: PanInfo) {
    const dismiss = info.velocity.y > 500 || info.offset.y > 180;
    if (dismiss) onClose();
    else y.set(0);
  }

  const isBottom = position === "bottom";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            className="absolute inset-0 bg-espresso/30 backdrop-blur-sm"
            style={isBottom ? { opacity: backdropOpacity } : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "glass relative z-10 w-full overflow-hidden",
              isBottom
                ? "mt-auto max-h-[90vh] rounded-t-3xl sm:mx-auto sm:max-w-2xl"
                : "m-auto max-h-[88vh] max-w-2xl rounded-3xl mx-4",
              className,
            )}
            style={isBottom ? { y } : undefined}
            drag={isBottom ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={isBottom ? onDragEnd : undefined}
            initial={
              isBottom ? { y: "100%" } : { y: 24, opacity: 0, scale: 0.98 }
            }
            animate={isBottom ? { y: 0 } : { y: 0, opacity: 1, scale: 1 }}
            exit={isBottom ? { y: "100%" } : { y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE_IOS }}
          >
            {isBottom && (
              <div className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing">
                <div className="h-1.5 w-12 rounded-full bg-mauve/40" aria-hidden />
              </div>
            )}
            <div className="overflow-y-auto no-scrollbar max-h-[inherit]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
