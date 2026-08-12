package ktanesolver.module.modded.regular.homophones;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.HOMOPHONES,id="homophones",name="Homophones",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Decode four displayed homophones and press the corresponding category buttons.",tags={"words","homophones","stages","souvenir"})
public class HomophonesSolver extends AbstractModuleSolver<HomophonesSolver.Input,HomophonesSolver.Output>{
    public record Input(List<String> phrases,List<String> buttonCategories) implements ModuleInput{}
    public record Output(List<Integer> numbers,List<Integer> pressPositions) implements ModuleOutput{}
    private static final List<List<String>> WORDS=List.of(
        List.of("i","I","aye","ay","eye","high","hi","aye-aye","eye-eye","ii"),
        List.of("C","ce","se","see","sea","sees","seas","say","she","icy"),
        List.of("L","l","el","ell","hell","lema","lima","leaner","leemer","lemur"),
        List.of("1","One","one","won","wun","run","on","un","win","wan"));
    private static final List<String> CATS=List.of("I","C","L","ONE");
    @Override protected SolveResult<Output> doSolve(RoundEntity r,BombEntity b,ModuleEntity m,Input in){
        if(in==null||in.phrases()==null||in.phrases().size()!=4||in.buttonCategories()==null||in.buttonCategories().size()!=4)return failure("Enter four phrases and the four button categories from left to right");
        int[] catAt=new int[4];Arrays.fill(catAt,-1);for(int p=0;p<4;p++){int c=cat(in.buttonCategories().get(p));if(c<0||catAt[c]>=0)return failure("Buttons must contain I, C, L, and ONE once each");catAt[c]=p+1;}
        List<Integer> nums=new ArrayList<>(),presses=new ArrayList<>();for(String phrase:in.phrases()){int c=-1,n=-1;for(int i=0;i<4;i++)for(int j=0;j<10;j++)if(WORDS.get(i).get(j).equals(phrase)){c=i;n=j;break;}if(c<0)return failure("Unknown phrase: "+phrase);nums.add(n);presses.add(catAt[c]);}
        storeState(m,"homophonesPhrases",in.phrases());return success(new Output(nums,presses));
    }
    private static int cat(String s){if(s==null)return-1;for(int i=0;i<4;i++)if(CATS.get(i).equalsIgnoreCase(s.trim()))return i;return-1;}
}
