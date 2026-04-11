import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import PageContainer from "../components/layout/PageContainer";
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

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bomb Defusal Solver</h1>
          <p className="text-muted-foreground mt-1">KTaNE solver for expert teams</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {/* New Round */}
          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm flex flex-col">
            <div className="p-5 flex-1">
              <h2 className="font-semibold text-foreground">New Round</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure bombs, add modules, and start solving.
              </p>
            </div>
            <div className="px-5 pb-5">
              <Button
                variant="default"
                className="w-full"
                onClick={handleCreateNewBomb}
                disabled={loading || creating}
                loading={creating || loading}
              >
                {creating || loading ? "Creating…" : "Start New Round"}
              </Button>
            </div>
          </div>

          {/* Round History */}
          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm flex flex-col">
            <div className="p-5 flex-1">
              <h2 className="font-semibold text-foreground">Round History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review past rounds and solutions.
              </p>
            </div>
            <div className="px-5 pb-5">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/rounds")}
                disabled={loading}
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
