package ktanesolver.module.vanilla.regular.keypads;

import java.util.List;

import static ktanesolver.module.vanilla.regular.keypads.KeypadSymbol.*;

public final class KeypadColumns {

    private KeypadColumns() {}

    public static final List<List<KeypadSymbol>> COLUMNS = List.of(
        List.of(
            BALLOON, AT, LAMBDA, LIGHTNING, SQUID_KNIFE, HOOK_N, BACKWARD_C
        ),
        List.of(
            EURO, BALLOON, BACKWARD_C, CURSIVE, HOLLOW_STAR, HOOK_N, QUESTION_MARK
        ),
        List.of(
            COPYRIGHT, PUMPKIN, CURSIVE, DOUBLE_K, MELTED_3, LAMBDA, HOLLOW_STAR
        ),
        List.of(
            SIX, PARAGRAPH, BT, SQUID_KNIFE, DOUBLE_K, QUESTION_MARK, SMILEY
        ),
        List.of(
            PITCHFORK, SMILEY, BT, C, PARAGRAPH, DRAGON, FILLED_STAR
        ),
        List.of(
            SIX, EURO, TRACK, AE, PITCHFORK, N_WITH_HAT, OMEGA
        )
    );
}
