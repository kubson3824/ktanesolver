package ktanesolver.module.modded.regular.colorflash;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ColorFlashInput(List<ColorFlashEntry> sequence) implements ModuleInput {
}
