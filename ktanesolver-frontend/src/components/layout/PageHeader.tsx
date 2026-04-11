import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex gap-2 flex-shrink-0 items-center">{actions}</div>
        )}
      </div>
      <div className="mt-4 border-b border-border" />
    </div>
  );
}
