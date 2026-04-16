package ktanesolver.module.modded.regular.alphabet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
    type = ModuleType.ALPHABET,
    id = "alphabet",
    name = "Alphabet",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Spell words from the bank using the four given letters, longest first",
    tags = {"word", "letters"}
)
public class AlphabetSolver extends AbstractModuleSolver<AlphabetInput, AlphabetOutput> {

    private static final List<String> WORD_BANK = List.of(
        "JQXZ", "QEW", "AC", "ZNY", "TJL", "OKBV", "DFW", "YKQ", "LXE", "GS",
        "VSI", "PQJS", "VCN", "JR", "IRNM", "OP", "QYDX", "HDU", "PKD", "ARGF"
    );

    @Override
    protected SolveResult<AlphabetOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, AlphabetInput input
    ) {
        List<String> letters = input.letters();

        if (letters.size() != 4) {
            return failure("Alphabet requires exactly 4 letters");
        }
        for (String letter : letters) {
            if (letter == null || letter.length() != 1) {
                return failure("Each letter must be a single character");
            }
        }

        List<String> pool = new ArrayList<>(
            letters.stream().map(String::toUpperCase).toList()
        );
        List<String> pressOrder = new ArrayList<>();

        while (true) {
            String chosen = WORD_BANK.stream()
                .filter(word -> canForm(word, pool))
                .min(Comparator.comparingInt(String::length).reversed()
                    .thenComparing(Comparator.naturalOrder()))
                .orElse(null);

            if (chosen == null) break;

            pressOrder.add(chosen);
            for (char c : chosen.toCharArray()) {
                pool.remove(String.valueOf(c));
            }
        }

        Collections.sort(pool);
        pressOrder.addAll(pool);

        return success(new AlphabetOutput(pressOrder));
    }

    private boolean canForm(String word, List<String> pool) {
        List<String> available = new ArrayList<>(pool);
        for (char c : word.toCharArray()) {
            if (!available.remove(String.valueOf(c))) return false;
        }
        return true;
    }
}
