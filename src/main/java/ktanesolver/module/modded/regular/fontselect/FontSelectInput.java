package ktanesolver.module.modded.regular.fontselect;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record FontSelectInput(String phrase, List<String> fonts, String currentFont) implements ModuleInput {
}
