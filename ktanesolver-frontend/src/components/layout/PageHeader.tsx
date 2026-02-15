import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-sm text-secondary font-medium uppercase tracking-wider">{eyebrow}</p>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold mt-1">{title}</h1>
        {subtitle && (
          <p className="text-base-content/70 mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
