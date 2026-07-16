import { describe, expect, it } from "vitest";

import { ModuleType } from "../../types";
import { findCardReference } from "./modulesAgainstHumanityCards";

describe("findCardReference", () => {
  it("identifies a card from punctuation-insensitive partial text", () => {
    expect(findCardReference("switch on these colours")).toMatchObject({
      moduleName: "Colored Switches",
    });
    expect(findCardReference("Morsematics code instead")).toMatchObject({
      moduleName: "Morsematics",
      moduleType: ModuleType.MORSEMATICS,
    });
  });
});
