type BrandLogoProps = {
  variant?: "light" | "dark";
  compact?: boolean;
};

export default function BrandLogo({ variant = "dark", compact = false }: BrandLogoProps) {
  const isLight = variant === "light";
  const titleColor = isLight ? "text-white" : "text-slate-950";
  const subtitleColor = isLight ? "text-slate-300" : "text-slate-500";

  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-900/10">
        <svg
          aria-hidden="true"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 40 40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 18.2 20 7l14 11.2"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M10.5 17.5V31h19V17.5"
            fill="#eff6ff"
            stroke="#0f172a"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M16 31v-8h8v8"
            fill="#ffffff"
            stroke="#2563eb"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="m25.5 15.8 2.4 2.4 5-5.4"
            stroke="#16a34a"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      </div>
      {!compact && (
        <div>
          <p className={`text-xl font-black tracking-tight ${titleColor}`}>하우스렌트</p>
          <p className={`mt-0.5 text-xs font-semibold ${subtitleColor}`}>Rental operations</p>
        </div>
      )}
    </div>
  );
}
