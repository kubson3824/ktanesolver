import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import PageContainer from "../components/layout/PageContainer";
import { Card, CardContent, CardHeader } from "../components/ui/card";
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
      <div className="max-w-2xl mx-auto py-12 sm:py-16">
        <Card className="border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
          <CardHeader className="text-center pb-2">
            <h1 className="text-3xl font-bold text-primary tracking-tight">
              KTANE Solver
            </h1>
            <p className="text-base-content/70 mt-2">
              Set up bombs, pick modules, and solve.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <Alert variant="error">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleCreateNewBomb}
                disabled={loading || creating}
              >
                {creating || loading ? "Creating…" : "Create new bomb"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handlePreviousRounds}
                disabled={loading}
              >
                Previous rounds
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
