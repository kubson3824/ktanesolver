import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import { Button } from "../components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";

export default function MainPage() {
  const navigate = useNavigate();
  const createRound = useRoundStore((state) => state.createRound);
  const loading = useRoundStore((state) => state.loading);
  const error = useRoundStore((state) => state.error);
  const [creating, setCreating] = useState(false);

  const handleCreateNewBomb = async () => {
    setCreating(true);
    try {
      const round = await createRound();
      navigate(`/round/${round.id}/setup`);
    } catch {
      // error is in store
    } finally {
      setCreating(false);
    }
  };

  const handlePreviousRounds = () => {
    navigate("/rounds");
  };

  return (
    <PageContainer>
      <PageHeader
        title="BOMB DEFUSAL SOLVER"
        subtitle="KTaNE solver for expert teams"
      />

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-6">
        {/* New Round card */}
        <div className="card-manual flex-1 flex flex-col">
          <div className="bg-primary text-primary-content px-5 py-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              NEW ROUND
            </h2>
          </div>
          <div className="px-5 py-4 flex-1">
            <p className="text-sm text-ink-muted">
              Configure bombs, add modules, and start solving.
            </p>
          </div>
          <div className="px-5 pb-5">
            <Button
              variant="primary"
              onClick={handleCreateNewBomb}
              disabled={loading || creating}
              loading={creating || loading}
            >
              {creating || loading ? "Creating…" : "Start New Round"}
            </Button>
          </div>
        </div>

        {/* Round History card */}
        <div className="card-manual flex-1 flex flex-col">
          <div className="bg-base-200 px-5 py-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-base-content">
              ROUND HISTORY
            </h2>
          </div>
          <div className="px-5 py-4 flex-1">
            <p className="text-sm text-ink-muted">
              Review past rounds and solutions.
            </p>
          </div>
          <div className="px-5 pb-5">
            <Button
              variant="secondary"
              onClick={handlePreviousRounds}
              disabled={loading}
            >
              View History
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
