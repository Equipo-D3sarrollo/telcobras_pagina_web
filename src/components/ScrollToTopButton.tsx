import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslations } from "@/lib/accessibility-preferences-context";

export function ScrollToTopButton() {
  const label = useTranslations().navigation.backToTop;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      className={[
        "fixed right-6 z-50 flex items-center justify-center rounded-full shadow-lg",
        "bg-[#F3CB35] text-slate-950 hover:bg-[#e2bb2d]",
        "w-12 h-12 sm:w-12 sm:h-12 max-[768px]:w-11 max-[768px]:h-11",
        "transition-all duration-300 ease-out",
        "bottom-[24rem]",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none",
      ].join(" ")}
    >
      <ArrowUp className="w-6 h-6" strokeWidth={2.5} />
    </button>
  );
}
