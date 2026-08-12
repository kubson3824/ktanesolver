package ktanesolver.module.modded.regular.zoni;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;import ktanesolver.dto.ModuleCatalogDto;import ktanesolver.entity.*;import ktanesolver.enums.ModuleType;import ktanesolver.logic.*;

@Service @ModuleInfo(type=ModuleType.ZONI,id="lgndZoni",name="Zoni",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,description="Decode each Zoni word and submit its table digit.",tags={"words","stages","souvenir"})
public class ZoniSolver extends AbstractModuleSolver<ZoniSolver.Input,ZoniSolver.Output>{
 public record Input(String decodedWord)implements ModuleInput{} public record Output(int stage,String word,int digit)implements ModuleOutput{} public record State(List<String> words){public State(){this(new ArrayList<>());}}
 private static final Map<String,Integer> WORDS=new HashMap<>();static{String data="angel1 large5 enemy7 pizza4 piano6 after2 smile6 thing7 blood1 phone3 never0 every9 brain3 radio1 dance0 plaza6 bread8 clear4 awful0 other7 crazy8 heavy2 flush5 water1 yacht6 jumpy9 brick1 queen4 quote3 ovens2 learn4 there8 ghost9 spook2 point0 found3 clank7 crack1 timer8 extra4 plant6 quark5 voice6 magic2 devil7 magma8 idiot9 index4 light1 great0 image5 pilot3 quest4 greed8";for(String e:data.split(" "))WORDS.put(e.substring(0,e.length()-1),e.charAt(e.length()-1)-'0');}
 @Override protected SolveResult<Output> doSolve(RoundEntity r,BombEntity b,ModuleEntity m,Input in){String w=in==null||in.decodedWord()==null?"":in.decodedWord().trim().toLowerCase();Integer d=WORDS.get(w);if(d==null)return failure("Enter a decoded English word from the manual table");State s=m.getStateAs(State.class,State::new);List<String> ws=new ArrayList<>(s.words());ws.add(w);storeTypedState(m,new State(ws));storeState(m,"zoniWords",ws);return success(new Output(ws.size(),w,d),ws.size()>=3);}
}
