import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MissionImportDialog from "./MissionImportDialog";
import { loadMissions } from "../../services/missionService";

vi.mock("../../services/missionService", () => ({ loadMissions: vi.fn() }));

describe("MissionImportDialog", () => {
    it("stops loading when the catalog arrives", async () => {
        vi.mocked(loadMissions).mockResolvedValue([{
            id: "pack:mission",
            name: "Test Mission",
            packName: "Test Pack",
            authors: [],
            bombs: [],
        }]);

        render(<MissionImportDialog open onOpenChange={vi.fn()} onSelect={vi.fn()} />);

        expect(await screen.findByText("Test Mission")).toBeInTheDocument();
        expect(screen.queryByText("Loading mission catalog…")).not.toBeInTheDocument();
    });
});
