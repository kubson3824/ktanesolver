package ktanesolver.module.modded.regular.grocerystore;

import ktanesolver.logic.ModuleInput;

public record GroceryStoreInput(String currentItem, boolean resetCart) implements ModuleInput {}
