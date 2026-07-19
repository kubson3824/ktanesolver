import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TwitchCommandDisplay from "./TwitchCommandDisplay";
import { useRoundStore } from "../../store/useRoundStore";

describe("TwitchCommandDisplay", () => {
  afterEach(() => useRoundStore.setState({ currentModule: undefined }));

  it("uses the persisted selector and separates multi-command solutions", () => {
    useRoundStore.setState({ currentModule: { twitchCode: "12" } as never });
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    render(<TwitchCommandDisplay command="!number press red; !number submit" />);

    expect(screen.getByText("!12 press red")).toBeInTheDocument();
    expect(screen.getByText("!12 submit")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Copy command to clipboard" })[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("!12 press red");
  });

  it("prefixes bare commands and separates bare multi-step solutions", () => {
    useRoundStore.setState({ currentModule: { twitchCode: "abc" } as never });

    render(<TwitchCommandDisplay command="cycle 1 2; submit" />);

    expect(screen.getByText("!abc cycle 1 2")).toBeInTheDocument();
    expect(screen.getByText("!abc submit")).toBeInTheDocument();
  });

  it("does not copy placeholder or incomplete commands", () => {
    render(<TwitchCommandDisplay command="!number press unknown" />);
    expect(screen.getByRole("button", { name: "Copy command to clipboard" })).toBeDisabled();
  });
});
