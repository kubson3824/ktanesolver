import type { ReactNode } from "react";
import { CardTitle } from "../ui/card";

interface SolverLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function SolverLayout({ children, title, className = "" }: SolverLayoutProps) {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <CardTitle className="text-xl font-bold mb-4 text-center">{title}</CardTitle>
      )}
      {children}
    </div>
  );
}
