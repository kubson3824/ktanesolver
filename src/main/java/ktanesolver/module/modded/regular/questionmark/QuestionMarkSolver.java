package ktanesolver.module.modded.regular.questionmark;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.QUESTION_MARK,id="Questionmark",name="Question Mark",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Find the symbol to hold and the timer digit on which to release it.",tags={"symbols","timing","souvenir"})
public class QuestionMarkSolver extends AbstractModuleSolver<QuestionMarkSolver.Input,QuestionMarkSolver.Output>{
    public record Input(List<Integer> symbols) implements ModuleInput{}
    public record Output(List<Integer> holdSymbols,List<Integer> releaseDigits) implements ModuleOutput{}
    private static final int[] VALUES={2,1,7,3,4,9,6,8,1,3,8,4,5,6,2};
    @Override protected SolveResult<Output> doSolve(RoundEntity r,BombEntity b,ModuleEntity m,Input in){
        if(in==null||in.symbols()==null||in.symbols().size()!=4||new HashSet<>(in.symbols()).size()!=4||in.symbols().stream().anyMatch(x->x==null||x<1||x>15||x==5))return failure("Enter four different non-death symbols numbered 1 through 15");
        int target=(in.symbols().stream().mapToInt(x->VALUES[x-1]).sum()+14)%15+1;List<Integer> holds=new ArrayList<>();if(in.symbols().contains(target)&&target!=5)holds.add(target);else{double best=99;for(int x:in.symbols()){double d=Math.hypot((x-1)%5-(target-1)%5,(x-1)/5-(target-1)/5);if(d<best){best=d;holds.clear();holds.add(x);}else if(d==best)holds.add(x);}}
        List<Integer> releases=holds.stream().map(x->VALUES[x-1]).distinct().toList();storeState(m,"questionMarkSymbols",in.symbols());return success(new Output(holds,releases));
    }
}
