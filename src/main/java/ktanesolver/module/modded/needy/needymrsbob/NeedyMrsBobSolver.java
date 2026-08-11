package ktanesolver.module.modded.needy.needymrsbob;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
    type = ModuleType.NEEDY_MRS_BOB,
    id = "needyMrsBob",
    name = "Needy Mrs Bob",
    category = ModuleCatalogDto.ModuleCategory.MODDED_NEEDY,
    description = "Reply to Mrs Bob's active message with the correct response emoji.",
    tags = {"needy", "messages", "emoji", "lookup"}
)
public class NeedyMrsBobSolver extends AbstractModuleSolver<NeedyMrsBobInput, NeedyMrsBobOutput> {
    static final List<String> RESPONSE_NAMES = List.of(
        "BEAR","BEER","BOWING","CAR","COW_FACE","CRYING","GOLF","HAPPY_FACE","KISS_FACE","MONEY","NAUSEATED","OK_HAND",
        "PIZZA","POO","RED_HEART","RED_ANGER_FACE","SHRUG","TAKEAWAY","TEA","THINKING_FACE","THUMBS_UP","TOOL","WEARY_FACE","WINE"
    );
    private static final List<String> ANSWERS = List.of(
        "THUMBS_UP","COW_FACE","MONEY","THINKING_FACE","SHRUG",
        "COW_FACE","SHRUG","THINKING_FACE","WEARY_FACE","POO",
        "TEA","WEARY_FACE","THUMBS_UP","COW_FACE","MONEY",
        "THINKING_FACE","COW_FACE","SHRUG","TEA","THUMBS_UP",
        "SHRUG","WEARY_FACE","THUMBS_UP","RED_ANGER_FACE","BOWING",
        "BOWING","RED_ANGER_FACE","POO","SHRUG","WEARY_FACE",
        "THUMBS_UP","MONEY","WEARY_FACE","POO","THUMBS_UP",
        "POO","BOWING","THINKING_FACE","WEARY_FACE","SHRUG",
        "TAKEAWAY","WINE","PIZZA","THINKING_FACE","SHRUG",
        "WINE","TAKEAWAY","SHRUG","PIZZA","THUMBS_UP",
        "PIZZA","THUMBS_UP","TAKEAWAY","WEARY_FACE","WINE",
        "WEARY_FACE","THINKING_FACE","WINE","TAKEAWAY","PIZZA",
        "SHRUG","CAR","BEER","GOLF","THINKING_FACE",
        "GOLF","SHRUG","THINKING_FACE","CAR","BEER",
        "BEER","GOLF","CAR","THUMBS_UP","SHRUG",
        "BOWING","BEER","GOLF","SHRUG","CAR",
        "THUMBS_UP","RED_HEART","OK_HAND","KISS_FACE","BEAR",
        "KISS_FACE","BEAR","RED_HEART","THUMBS_UP","OK_HAND",
        "OK_HAND","THUMBS_UP","KISS_FACE","BEAR","RED_HEART",
        "RED_HEART","KISS_FACE","BEAR","OK_HAND","THUMBS_UP",
        "POO","CRYING","OK_HAND","THUMBS_UP","RED_HEART",
        "SHRUG","THINKING_FACE","MONEY","TOOL","KISS_FACE",
        "CRYING","THUMBS_UP","RED_HEART","TOOL","SHRUG",
        "OK_HAND","CRYING","TOOL","POO","THINKING_FACE"
    );

    @Override
    protected SolveResult<NeedyMrsBobOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, NeedyMrsBobInput input) {
        if (input == null || input.message() == null || input.receivedEmoji() == null || input.responseOrder() == null) {
            return failure("Enter the active message, received emoji, and all 24 response positions");
        }
        if (input.message() < 1 || input.message() > 24) return failure("Message must be 1 through 24");
        if (input.receivedEmoji() < 1 || input.receivedEmoji() > 5) return failure("Received emoji must be column 1 through 5");
        List<String> order = input.responseOrder().stream().map(NeedyMrsBobSolver::normalize).toList();
        if (order.size() != 24 || order.stream().distinct().count() != 24 || !Set.copyOf(order).equals(Set.copyOf(RESPONSE_NAMES))) {
            return failure("Response order must contain each of the 24 response emojis exactly once");
        }
        String response = ANSWERS.get((input.message() - 1) * 5 + input.receivedEmoji() - 1);
        int position = order.indexOf(response) + 1;
        return success(new NeedyMrsBobOutput(response, position, "Send response " + position + " (" + response.replace('_', ' ') + ")"), false);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }
}
