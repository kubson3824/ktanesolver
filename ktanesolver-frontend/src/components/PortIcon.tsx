import { PortType } from "../types";
import { PORTS } from "../lib/ports";

export default function PortIcon({ port, className }: { port: PortType; className?: string }) {
    const { label, color, viewBox, d } = PORTS[port];
    return (
        <svg viewBox={viewBox} className={className} role="img" aria-label={label}>
            <title>{label}</title>
            <path
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeMiterlimit={10}
                vectorEffect="non-scaling-stroke"
                d={d}
            />
        </svg>
    );
}
