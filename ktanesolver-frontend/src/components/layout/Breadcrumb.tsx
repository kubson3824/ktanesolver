import { Link } from "react-router-dom";

export type BreadcrumbSegment =
  | { label: string; to: string }
  | { label: string; onClick: () => void }
  | { label: string; current: true };

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

const separator = (
  <span className="text-base-content/50 mx-1.5" aria-hidden>
    ›
  </span>
);

export default function Breadcrumb({ segments, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm font-medium ${className}`}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const linkClass =
          "text-base-content/70 hover:text-base-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 rounded px-0.5";
        const currentClass = "text-primary";

        if ("current" in seg && seg.current) {
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && separator}
              <span className={currentClass}>{seg.label}</span>
            </span>
          );
        }
        if ("to" in seg) {
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && separator}
              <Link to={seg.to} className={linkClass}>
                {seg.label}
              </Link>
            </span>
          );
        }
        if ("onClick" in seg) {
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && separator}
              <button type="button" onClick={seg.onClick} className={`${linkClass} bg-transparent border-none cursor-pointer`}>
                {seg.label}
              </button>
            </span>
          );
        }
        return null;
      })}
    </nav>
  );
}
