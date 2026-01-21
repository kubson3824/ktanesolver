import type { ReactNode } from "react";
import ModuleNumberInput from "../ModuleNumberInput";

interface SolverLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function SolverLayout({ children, title, className = "" }: SolverLayoutProps) {
  return (
    <div className={`w-full ${className}`}>
      <ModuleNumberInput />
      {title && (
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
      )}
      {children}
    </div>
  );
}
