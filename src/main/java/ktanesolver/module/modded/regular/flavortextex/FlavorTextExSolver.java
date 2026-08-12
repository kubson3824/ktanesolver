package ktanesolver.module.modded.regular.flavortextex;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.FLAVOR_TEXT_EX,id="FlavorTextCruel",name="Flavor Text EX",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Order the four labels using the displayed module's Steam Workshop ID.",tags={"text","steam id","stages","souvenir"})
public class FlavorTextExSolver extends AbstractModuleSolver<FlavorTextExSolver.Input,FlavorTextExSolver.Output>{
    public record Input(String moduleName,long steamId,List<String> labels) implements ModuleInput{}
    public record Output(int stage,List<String> pressLabels,List<Integer> pressPositions) implements ModuleOutput{}
    public record State(List<String> moduleNames){public State(){this(new ArrayList<>());}}
    @Override protected SolveResult<Output> doSolve(RoundEntity r,BombEntity b,ModuleEntity m,Input in){
        if(in==null||in.moduleName()==null||in.moduleName().isBlank()||in.labels()==null||in.labels().size()!=4||new HashSet<>(in.labels()).size()!=4)return failure("Enter the source module, Workshop ID, and four different labels");
        String id=Long.toString(Math.max(0,in.steamId()));List<String> order=new ArrayList<>(in.labels());if(in.steamId()>0)order.sort(Comparator.comparingInt(x->{int p=id.indexOf(x);return p<0?100+in.labels().indexOf(x):p;}));
        State s=m.getStateAs(State.class,State::new);List<String> names=new ArrayList<>(s.moduleNames());names.add(in.moduleName());storeTypedState(m,new State(names));storeState(m,"flavorTextExModules",names);
        List<Integer> pos=order.stream().map(x->in.labels().indexOf(x)+1).toList();return success(new Output(names.size(),order,pos),names.size()>=3);
    }
}
