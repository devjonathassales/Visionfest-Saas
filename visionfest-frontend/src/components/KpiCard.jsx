import React from "react";

export default function KpiCard({
  title,
  value,
  delta = null, // número em %
  hint = "",
  icon = null, // pode ser componente (FaUsers) ou elemento (<FaUsers/>)
  spark = [],
  onClick,
}) {
  const up = typeof delta === "number" ? delta >= 0 : null;

  // aceita componente OU elemento
  const IconEl = React.useMemo(() => {
    if (!icon) return null;
    // se já for <Elemento />
    if (React.isValidElement(icon)) return icon;
    // se for Componente, cria elemento com um size padrão
    try {
      return React.createElement(icon, { size: 18 });
    } catch {
      return null;
    }
  }, [icon]);

  const sparkPoints =
    spark && spark.length > 1
      ? spark
          .map((v, i, arr) => {
            const x = (i / (arr.length - 1)) * 100;
            const max = Math.max(...arr) || 1;
            const y = 18 - (v / max) * 18;
            return `${x},${y}`;
          })
          .join(" ")
      : null;

  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className="group w-full text-left rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 p-5 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-zinc-500">{title}</div>
          <div className="mt-1 text-2xl md:text-3xl font-bold tracking-tight truncate">
            {value}
          </div>
          {(delta !== null || hint) && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {delta !== null && (
                <span
                  className={
                    up
                      ? "text-emerald-600 font-medium"
                      : "text-rose-600 font-medium"
                  }
                >
                  {up ? "↗︎" : "↘︎"} {Math.abs(delta).toFixed(1)}%
                </span>
              )}
              {hint && <span className="text-zinc-400">{hint}</span>}
            </div>
          )}
        </div>

        {IconEl && (
          <div className="shrink-0 p-2 rounded-xl bg-zinc-50 ring-1 ring-zinc-200/70">
            {IconEl}
          </div>
        )}
      </div>

      {sparkPoints && (
        <svg viewBox="0 0 100 20" className="mt-3 w-full h-5">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={sparkPoints}
            className="text-zinc-300 group-hover:text-zinc-400 transition-colors"
          />
        </svg>
      )}
    </Tag>
  );
}
