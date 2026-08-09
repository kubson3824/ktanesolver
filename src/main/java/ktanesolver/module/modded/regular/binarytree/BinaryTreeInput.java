package ktanesolver.module.modded.regular.binarytree;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BinaryTreeInput(List<BinaryTreeNodeInput> nodes) implements ModuleInput {
}
