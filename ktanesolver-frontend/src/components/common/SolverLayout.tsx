import type { ReactNode } from "react";

interface SolverLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function SolverLayout({ children, className = "" }: SolverLayoutProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}
