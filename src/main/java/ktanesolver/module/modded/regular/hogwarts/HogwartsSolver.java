package ktanesolver.module.modded.regular.hogwarts;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.HOGWARTS,id="HogwartsModule",name="Hogwarts",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Choose one module for each Hogwarts house and determine the House Cup winner.",tags={"modules","word count","optimization"})
public class HogwartsSolver extends AbstractModuleSolver<HogwartsInput,HogwartsOutput>{
    private static final List<String> HOUSES=List.of("Gryffindor","Ravenclaw","Slytherin","Hufflepuff");
    private static final Map<String,String> FOUNDERS=Map.of("Gryffindor","GODRICGRYFFINDOR","Ravenclaw","ROWENARAVENCLAW","Slytherin","SALAZARSLYTHERIN","Hufflepuff","HELGAHUFFLEPUFF");
    @Override protected SolveResult<HogwartsOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,HogwartsInput input){
        if(input==null||input.entries()==null)return failure("Enter the displayed module/house associations");
        Map<String,List<HogwartsSelection>> byHouse=new LinkedHashMap<>();for(String h:HOUSES)byHouse.put(h,new ArrayList<>());
        for(HogwartsEntry e:input.entries()){
            if(e==null||e.module()==null||e.module().isBlank()||e.house()==null)return failure("Every association needs a module and house");
            String house=HOUSES.stream().filter(h->h.equalsIgnoreCase(e.house().trim())).findFirst().orElse(null);if(house==null)return failure("House must be Gryffindor, Ravenclaw, Slytherin, or Hufflepuff");
            byHouse.get(house).add(new HogwartsSelection(house,e.module().trim(),points(e.module(),FOUNDERS.get(house))));
        }
        if(input.entries().isEmpty())return success(new HogwartsOutput(List.of(),HOUSES));
        List<List<HogwartsSelection>> choices=HOUSES.stream().map(h->byHouse.get(h).isEmpty()?List.of(new HogwartsSelection(h,"(no module)",-1)):byHouse.get(h)).toList();
        List<HogwartsSelection> best=pick(choices,0,new ArrayList<>(),null);
        int max=best.stream().mapToInt(HogwartsSelection::points).max().orElse(-1);List<String>winners=best.stream().filter(s->s.points()==max).map(HogwartsSelection::house).toList();
        return success(new HogwartsOutput(best,winners));
    }
    private static List<HogwartsSelection> pick(List<List<HogwartsSelection>> choices,int ix,List<HogwartsSelection> cur,List<HogwartsSelection> best){
        if(ix==choices.size()){if(best==null||rank(cur)>rank(best))return List.copyOf(cur);return best;}
        for(HogwartsSelection s:choices.get(ix)){cur.add(s);best=pick(choices,ix+1,cur,best);cur.remove(cur.size()-1);}return best;
    }
    private static long rank(List<HogwartsSelection> xs){int max=xs.stream().mapToInt(HogwartsSelection::points).max().orElse(-1);long winners=xs.stream().filter(x->x.points()==max).count();int total=xs.stream().mapToInt(HogwartsSelection::points).sum();return (winners==1?1_000_000L:0)+total;}
    static int points(String module,String founder){String upper=module.toUpperCase(Locale.ROOT);int total=0;for(char c='A';c<='Z';c++){int a=0,b=0;for(int i=0;i<upper.length();i++)if(upper.charAt(i)==c)a++;for(int i=0;i<founder.length();i++)if(founder.charAt(i)==c)b++;total+=a*b;}return total;}
}
