package ktanesolver.module.modded.regular.redarrows;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    type = ModuleType.RED_ARROWS, id = "redArrowsModule", name = "Red Arrows",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Navigate the fixed rule-seed-one maze from the displayed digit to the serial's last digit.",
    tags = {"arrows", "maze", "serial number", "rule seed"}
)
public class RedArrowsSolver extends AbstractModuleSolver<RedArrowsInput, RedArrowsOutput> {
    private static final String MAZE = "██████████████████████       █ █        0██ ███ █ █ █ ███ ██████ █   █   █   █     ██ █ █████ █ █ █████ ██1█ █  4█   █ █   █6████ █ ███ █████ █ ████   █           █   ██ █████████ ███████ ██  9█     █ █    3█ ██████ ███ █ █ █████ ██   █ █5█   █       ██ █ █ █ ███████████ ██ █   █       █7    ██ ███████████ █████ ██ █     █  8█     █ ██ █ ███ █ ███████ █ ██ █ █   █       █   ██ █ █ █████████ ███ ██   █      2█       ██████████████████████";
    private static final int[] DELTAS = {-42,42,-2,2};
    private static final int[] WALLS = {-21,21,-1,1};
    private static final String[] NAMES = {"up","down","left","right"};
    private static final String[] LETTERS = {"u","d","l","r"};

    @Override
    protected SolveResult<RedArrowsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, RedArrowsInput input) {
        if (input == null || input.startingNumber() < 0 || input.startingNumber() > 9) return failure("Enter the displayed starting digit");
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");
        int destination = bomb.getLastDigit();
        if (destination == input.startingNumber()) return failure("The generated starting number cannot equal the serial's last digit");
        int start = MAZE.indexOf((char)('0' + input.startingNumber())), finish = MAZE.indexOf((char)('0' + destination));
        ArrayDeque<Integer> queue = new ArrayDeque<>(); queue.add(start);
        Map<Integer,Integer> parent = new HashMap<>(), direction = new HashMap<>(); parent.put(start,-1);
        while (!queue.isEmpty() && !parent.containsKey(finish)) {
            int cell=queue.remove();
            for(int i=0;i<4;i++) if(MAZE.charAt(cell+WALLS[i])!='█'&&!parent.containsKey(cell+DELTAS[i])){parent.put(cell+DELTAS[i],cell);direction.put(cell+DELTAS[i],i);queue.add(cell+DELTAS[i]);}
        }
        if (!parent.containsKey(finish)) return failure("No route exists in the rule-seed-one maze");
        List<String> moves=new ArrayList<>(), letters=new ArrayList<>();
        for(int cell=finish;parent.get(cell)!=-1;cell=parent.get(cell)){int d=direction.get(cell);moves.add(NAMES[d]);letters.add(LETTERS[d]);}
        Collections.reverse(moves); Collections.reverse(letters);
        storeState(module,"redArrowsStartingNumber",input.startingNumber());
        return success(new RedArrowsOutput(destination,List.copyOf(moves),String.join("",letters)));
    }
}
