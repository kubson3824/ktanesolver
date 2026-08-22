package ktanesolver.module.modded.regular.orangearrows;

import java.util.ArrayList;import java.util.List;import java.util.Locale;import org.springframework.stereotype.Service;import ktanesolver.annotation.ModuleInfo;import ktanesolver.dto.ModuleCatalogDto;import ktanesolver.entity.BombEntity;import ktanesolver.entity.ModuleEntity;import ktanesolver.entity.RoundEntity;import ktanesolver.enums.ModuleType;import ktanesolver.logic.AbstractModuleSolver;import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(type=ModuleType.ORANGE_ARROWS,id="orangeArrowsModule",name="Orange Arrows",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,description="Invert every fourth arrow in each of three displayed sequences.",tags={"arrows","sequences","memory","stages"})
public class OrangeArrowsSolver extends AbstractModuleSolver<OrangeArrowsInput,OrangeArrowsOutput>{
 private static final List<String>DIRECTIONS=List.of("up","down","left","right");
 @Override protected SolveResult<OrangeArrowsOutput>doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,OrangeArrowsInput input){
  if(input==null||input.stage()<1||input.stage()>3||input.displayedSequence()==null||input.displayedSequence().size()<5||input.displayedSequence().size()>12)return failure("Enter the current stage (1–3) and all 5–12 displayed arrows");
  List<String>shown=input.displayedSequence().stream().map(value->value==null?"":value.trim().toLowerCase(Locale.ROOT)).toList();if(shown.stream().anyMatch(value->!DIRECTIONS.contains(value)))return failure("Use only up, down, left, and right");
  List<String>presses=new ArrayList<>();for(int i=0;i<shown.size();i++)presses.add((i+1)%4==0?opposite(shown.get(i)):shown.get(i));
  List<List<String>>stages=stageLists(module.getState().get("orangeArrowsSequences"));while(stages.size()<3)stages.add(List.of());stages.set(input.stage()-1,List.copyOf(shown));storeState(module,"orangeArrowsSequences",List.copyOf(stages));
  return success(new OrangeArrowsOutput(input.stage(),List.copyOf(presses),String.join(" ",presses)),input.stage()==3);
 }
 private static String opposite(String direction){return switch(direction){case"up"->"down";case"down"->"up";case"left"->"right";default->"left";};}
 private static List<List<String>>stageLists(Object value){List<List<String>>result=new ArrayList<>();if(value instanceof List<?>outer)for(Object item:outer){if(item instanceof List<?>inner)result.add(inner.stream().map(String::valueOf).toList());}return result;}
}
