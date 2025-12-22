import { useRoundStore } from "../store/roundStore";

export default function SolvePage() {
    const { round, activeBombId, activeModuleId } = useRoundStore();

    if (!round) return <div>No round loaded</div>;

    return (
        <div style={{ display: "flex", gap: 16 }}>
            <div style={{ width: 200 }}>
                <h3>Bombs</h3>
                {round.bombs.map((b) => (
                    <div key={b.id}>{b.id}</div>
                ))}
            </div>

            <div style={{ flex: 1 }}>
                <h3>Solver</h3>
                <div>Bomb: {activeBombId}</div>
                <div>Module: {activeModuleId}</div>
            </div>
        </div>
    );
}
