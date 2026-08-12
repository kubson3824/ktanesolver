package ktanesolver.module.modded.regular.simonsstages;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.SIMONS_STAGES,id="simonsStages",name="Simon's Stages",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Translate each stage's flash sequence according to its indicator color.",tags={"simon","colors","stages"})
public class SimonsStagesSolver extends AbstractModuleSolver<SimonsStagesSolver.Input,SimonsStagesSolver.Output>{
    public record Stage(String indicatorColor,List<String> flashes){}
    public record Input(List<Stage> stages) implements ModuleInput{}
    public record Output(List<List<String>> pressSequences) implements ModuleOutput{}
    private static final List<String> COLORS=List.of("Red","Blue","Yellow","Orange","Magenta","Green","Pink","Lime","Cyan","White");
    @Override protected SolveResult<Output> doSolve(RoundEntity r,BombEntity b,ModuleEntity m,Input in){
        if(in==null||in.stages()==null||in.stages().isEmpty())return failure("Enter at least one stage");List<List<String>> out=new ArrayList<>();
        for(Stage s:in.stages()){int rule=index(s.indicatorColor());if(rule<0||s.flashes()==null||s.flashes().size()<3||s.flashes().size()>5)return failure("Each stage needs a valid indicator color and 3 to 5 flashes");List<String> f=new ArrayList<>();for(String x:s.flashes()){int i=index(x);if(i<0)return failure("Unknown flash color: "+x);f.add(COLORS.get(rule>=6?(i+5)%10:i));}out.add(switch(rule){case 0,6->f;case 1,7->rev(f);case 2->f.subList(0,2);case 3->rev(f.subList(0,2));case 4->f.subList(f.size()-2,f.size());case 5->rev(f.subList(f.size()-2,f.size()));case 8->List.of(f.get(0),f.get(f.size()-1));default->List.of(f.get(2),f.get(1));});}
        return success(new Output(out));
    }
    private static int index(String s){if(s==null)return-1;for(int i=0;i<COLORS.size();i++)if(COLORS.get(i).equalsIgnoreCase(s.trim()))return i;return-1;}
    private static List<String> rev(List<String> x){List<String> y=new ArrayList<>(x);Collections.reverse(y);return y;}
}
