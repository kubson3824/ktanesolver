import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import RoundCard from "../features/rounds/RoundCard";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";

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
            <PageContainer className="flex items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg"></span>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer>
                <Alert variant="error" className="max-w-4xl mx-auto">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                eyebrow="Round history"
                title="Previous bombs"
                subtitle="View and return to previously created rounds and their bomb configurations."
                actions={
                    <Button variant="outline" onClick={handleCreateNewRound} disabled={loading}>
                        Create New Round
                    </Button>
                }
            />

            {sortedRounds.length === 0 ? (
                <Card className="border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
                    <CardContent className="text-center py-12">
                        <p className="text-body text-base-content/70">
                            No rounds found. Create your first round to get started.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
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
