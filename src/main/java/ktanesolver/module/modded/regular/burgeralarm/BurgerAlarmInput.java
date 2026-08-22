package ktanesolver.module.modded.regular.burgeralarm;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record BurgerAlarmInput(
    List<Ingredient> buttonIngredients, String displayedCode, List<String> orders,
    boolean pcmciaPresent, boolean twoFactorPresent
) implements ModuleInput {
    public enum Ingredient { MAYO, BUN, TOMATO, CHEESE, LETTUCE, ONIONS, PICKLES, MUSTARD, KETCHUP, MEAT }
}
