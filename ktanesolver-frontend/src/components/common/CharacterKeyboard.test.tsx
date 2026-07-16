import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import CharacterKeyboard from "./CharacterKeyboard";

it("types unique characters and exposes editing keys", () => {
  const onCharacter = vi.fn();
  const onBackspace = vi.fn();
  const onSpace = vi.fn();
  render(
    <CharacterKeyboard
      characters="AĄĄ "
      onCharacter={onCharacter}
      onBackspace={onBackspace}
      onSpace={onSpace}
    />,
  );

  fireEvent.click(screen.getByText("On-screen keyboard"));
  fireEvent.click(screen.getByRole("button", { name: "Type Ą" }));
  fireEvent.click(screen.getByRole("button", { name: "Space" }));
  fireEvent.click(screen.getByRole("button", { name: "Backspace" }));

  expect(onCharacter).toHaveBeenCalledWith("Ą");
  expect(screen.getAllByRole("button", { name: "Type Ą" })).toHaveLength(1);
  expect(onSpace).toHaveBeenCalledOnce();
  expect(onBackspace).toHaveBeenCalledOnce();
});
