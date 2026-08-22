package ktanesolver.module.modded.regular.quizbuzz;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
import ktanesolver.module.modded.regular.quizbuzz.QuizBuzzOutput.StageType;

@Service
@ModuleInfo(type = ModuleType.QUIZ_BUZZ, id = "quizBuzz", name = "Quiz Buzz",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Play ten stages of category-based FizzBuzz without reusing list positions.",
    tags = {"fizzbuzz", "quiz", "numbers", "stages", "memory"})
public class QuizBuzzSolver extends AbstractModuleSolver<QuizBuzzInput, QuizBuzzOutput> {
    public static final Map<String,List<String>> ANSWERS = answers();
    @Override protected SolveResult<QuizBuzzOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, QuizBuzzInput input) {
        if (input == null || input.stageNumber() < 1) return failure("Enter the displayed stage number");
        List<Integer> fizzUsed=input.resetPositions()?new ArrayList<>():integers(module.getState().get("quizBuzzFizzPositions"));
        List<Integer> buzzUsed=input.resetPositions()?new ArrayList<>():integers(module.getState().get("quizBuzzBuzzPositions"));
        int completed=input.resetPositions()?0:number(module.getState().get("quizBuzzCompletedStages"));
        if(!module.getState().containsKey("quizBuzzStartingNumber"))storeState(module,"quizBuzzStartingNumber",input.stageNumber());
        boolean fizz=input.stageNumber()%3==0,buzz=input.stageNumber()%5==0;String answer;int fizzIx=-1,buzzIx=-1;StageType type;
        if(fizz){List<String> values=category(input.fizzCategory());if(values==null)return failure("Choose the Fizz category shown");fizzIx=firstAvailable(values,fizzUsed);if(fizzIx<0)return failure("No unused Fizz position remains for this category");answer=values.get(fizzIx);type=StageType.FIZZ;}else{answer=Integer.toString(input.stageNumber());type=StageType.NUMBER;}
        if(buzz){List<String> values=category(input.buzzCategory());if(values==null)return failure("Choose the Buzz category shown");buzzIx=firstAvailable(values,buzzUsed);if(buzzIx<0)return failure("No unused Buzz position remains for this category");answer=(fizz?answer:"")+values.get(buzzIx);type=fizz?StageType.FIZZ_BUZZ:StageType.BUZZ;}
        if(fizz)fizzUsed.add(fizzIx);if(buzz)buzzUsed.add(buzzIx);completed++;
        storeState(module,"quizBuzzFizzPositions",List.copyOf(fizzUsed));storeState(module,"quizBuzzBuzzPositions",List.copyOf(buzzUsed));storeState(module,"quizBuzzCompletedStages",completed);
        return success(new QuizBuzzOutput(input.stageNumber(),type,answer,fizzIx+1,buzzIx+1,completed),completed>=10);
    }
    private static List<String> category(String value){if(value==null)return null;String n=value.trim().toLowerCase(Locale.ROOT);return ANSWERS.entrySet().stream().filter(e->e.getKey().toLowerCase(Locale.ROOT).equals(n)).map(Map.Entry::getValue).findFirst().orElse(null);}
    private static int firstAvailable(List<String> values,List<Integer> used){for(int i=0;i<values.size();i++)if(!used.contains(i))return i;return -1;}
    private static int number(Object value){return value instanceof Number n?n.intValue():0;}
    private static List<Integer> integers(Object value){if(!(value instanceof List<?> list))return new ArrayList<>();return new ArrayList<>(list.stream().map(QuizBuzzSolver::number).toList());}
    private static Map<String,List<String>> answers(){Map<String,List<String>> m=new LinkedHashMap<>();
        put(m,"Bases","2,3,4,5,6,7,8,10");put(m,"Cheap Checkout","250,394,397,498,797,946");put(m,"Connection Check","1,2,3,4,5,6,7");put(m,"Cryptography","7,8,9,10,11,16");put(m,"Fast Math","13,15,31,36,40,41,46,47,72,73,76,93,99");put(m,"FizzBuzz","1,2,3,4,5,8");put(m,"Laundry","80,105,120,140,160,200,230,300,390");put(m,"LED Encryption","2,3,4,5,6,7");put(m,"Lightspeed","1,2,3,4,5,6,8,9");put(m,"Marble Tumble","1,2,3,4,5,6,7,8");put(m,"Monsplode, Fight!","1,2,3,4,5,6");put(m,"Morse Code","505,515,522,532,535,542,545,552,555,565,572,575,582,592,595,600");put(m,"Question Mark","2,4,5,7,8,9");put(m,"Spinning Buttons","5,6,7,8,9,10");put(m,"Splitting the Loot","12,16,22,25,26,30");put(m,"Street Fighter","3,4,5,6,7,8");put(m,"Tax Returns","81,478,599,736,932,1241,1647");put(m,"Web Design","1,2,3,4,5,7,9");put(m,"Wire Sequence","1,2,4,6,8,9");return Map.copyOf(m);}
    private static void put(Map<String,List<String>> map,String key,String values){map.put(key,List.of(values.split(",")));}
}
