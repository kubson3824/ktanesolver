import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import { BombStatus, RoundStatus } from "../types";

export default function RoundsPage() {
    const navigate = useNavigate();
    const allRounds = useRoundStore((state) => state.allRounds);
    const fetchAllRounds = useRoundStore((state) => state.fetchAllRounds);
    const createRound = useRoundStore((state) => state.createRound);
    const deleteRound = useRoundStore((state) => state.deleteRound);
    const loading = useRoundStore((state) => state.loading);
    const error = useRoundStore((state) => state.error);

    useEffect(() => {
        fetchAllRounds();
    }, [fetchAllRounds]);

    const roundStatusLabel = (status: RoundStatus) => {
        switch (status) {
            case RoundStatus.SETUP:
                return "Setup";
            case RoundStatus.ACTIVE:
                return "Active";
            case RoundStatus.COMPLETED:
                return "Completed";
            case RoundStatus.FAILED:
                return "Failed";
            default:
                return "Unknown";
        }
    };

    const getRoundStatusBadge = (status: RoundStatus) => {
        switch (status) {
            case RoundStatus.SETUP:
                return "badge-warning";
            case RoundStatus.ACTIVE:
                return "badge-info";
            case RoundStatus.COMPLETED:
                return "badge-success";
            case RoundStatus.FAILED:
                return "badge-error";
            default:
                return "badge-ghost";
        }
    };

    const getBombStatusBadge = (status: BombStatus) => {
        switch (status) {
            case BombStatus.EXPLDED:
                return "badge-error";
            case BombStatus.DISARMED:
                return "badge-success";
            default:
                return "badge-neutral";
        }
    };

    const handleReturnToRound = (roundId: string) => {
        navigate(`/solve/${roundId}`);
    };

    const handleCreateNewRound = async () => {
        await createRound();
        navigate("/setup");
    };

    const handleDeleteRound = async (roundId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this round? This action cannot be undone.");
        if (confirmed) {
            try {
                await deleteRound(roundId);
            } catch (error) {
                console.error("Failed to delete round:", error);
            }
        }
    };

    const sortedRounds = useMemo(() => {
        if (!allRounds) return [];
        return [...allRounds].sort((a, b) => {
            const dateA = new Date(a.startTime ?? 0);
            const dateB = new Date(b.startTime ?? 0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [allRounds]);

    if (loading) {
        return (
            <div className="min-h-screen p-10 lg:p-16 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-10 lg:p-16">
                <div className="alert alert-error max-w-4xl mx-auto">
                    <span>Error: {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-10 lg:p-16">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <p className="text-sm text-secondary font-medium uppercase tracking-wider">Round history</p>
                    <h1 className="text-4xl font-bold mt-2 mb-4">Previous bombs</h1>
                    <p className="text-base-content/70 mb-6">
                        View and return to previously created rounds and their bomb configurations.
                    </p>
                    <button
                        className="btn btn-outline"
                        onClick={handleCreateNewRound}
                        disabled={loading}
                    >
                        Create New Round
                    </button>
                </div>

                {sortedRounds.length === 0 ? (
                    <div className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
                        <div className="card-body text-center py-12">
                            <p className="text-base-content/70">No rounds found. Create your first round to get started.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedRounds.map((round) => (
                            <div key={round.id} className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <h2 className="text-2xl font-bold">Round {round.id.slice(-8)}</h2>
                                                <span className={`badge ${getRoundStatusBadge(round.status)}`}>
                                                    {roundStatusLabel(round.status)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <div className="stat">
                                                    <span className="stat-title text-secondary">Total bombs</span>
                                                    <div className="stat-value text-2xl font-bold">{round.bombs.length}</div>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-title text-secondary">Modules</span>
                                                    <div className="stat-value text-2xl font-bold">
                                                        {round.bombs.reduce(
                                                            (sum, bomb) => sum + (bomb.modules?.length ?? 0),
                                                            0,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <span className="text-sm text-secondary">Created</span>
                                                <div className="text-lg font-medium">
                                                    {round.startTime
                                                        ? new Date(round.startTime).toLocaleString()
                                                        : "Not started"}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleReturnToRound(round.id)}
                                                >
                                                    {round.status === RoundStatus.ACTIVE ? "Continue" : "View"} Round
                                                </button>
                                                <button
                                                    className="btn btn-error btn-outline"
                                                    onClick={() => handleDeleteRound(round.id)}
                                                    disabled={loading}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold mb-3">Bombs in this round</h3>
                                            {round.bombs.length === 0 ? (
                                                <p className="text-sm text-base-content/50 italic">No bombs in this round</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {round.bombs.map((bomb) => (
                                                        <div key={bomb.id} className="card bg-base-100 border border-base-300">
                                                            <div className="card-body p-4">
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <span className="font-mono text-sm">{bomb.serialNumber || "Unknown serial"}</span>
                                                                        <div className="text-xs text-secondary mt-1">
                                                                            {bomb.modules?.length ?? 0} modules
                                                                        </div>
                                                                    </div>
                                                                    <span className={`badge ${getBombStatusBadge(bomb.status)}`}>
                                                                        {bomb.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
