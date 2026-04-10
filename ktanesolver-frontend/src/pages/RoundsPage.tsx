import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import RoundCard from "../features/rounds/RoundCard";
import { Button } from "../components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";

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

    const handleCreateNewRound = async () => {
        const round = await createRound();
        navigate(`/round/${round.id}/setup`);
    };

    const handleDeleteRound = async (roundId: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this round? This action cannot be undone."
        );
        if (confirmed) {
            try {
                await deleteRound(roundId);
            } catch (err) {
                console.error("Failed to delete round:", err);
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
            <PageContainer>
                <PageHeader
                    title="ROUND HISTORY"
                    actions={
                        <Button variant="primary" onClick={handleCreateNewRound} disabled>
                            New Round
                        </Button>
                    }
                />
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer>
                <PageHeader
                    title="ROUND HISTORY"
                    actions={
                        <Button variant="primary" onClick={handleCreateNewRound}>
                            New Round
                        </Button>
                    }
                />
                <Alert variant="error">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="ROUND HISTORY"
                actions={
                    <Button variant="primary" onClick={handleCreateNewRound} disabled={loading}>
                        New Round
                    </Button>
                }
            />

            {sortedRounds.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-ink-muted text-sm mb-4">
                        No rounds yet. Start your first round.
                    </p>
                    <Button variant="primary" onClick={handleCreateNewRound}>
                        New Round
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {sortedRounds.map((round) => (
                        <RoundCard
                            key={round.id}
                            round={round}
                            onNavigate={(id) => navigate(`/round/${id}/setup`)}
                            onDelete={handleDeleteRound}
                            loading={loading}
                        />
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
