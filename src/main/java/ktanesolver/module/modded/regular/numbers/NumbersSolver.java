package ktanesolver.module.modded.regular.numbers;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.NUMBERS,id="Numbers",name="Numbers",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Convert the displayed two-digit number into the required four-button sequence.",tags={"numbers","indicators","souvenir"})
public class NumbersSolver extends AbstractModuleSolver<NumbersSolver.Input,NumbersSolver.Output>{
    public record Input(int leftDigit,int rightDigit) implements ModuleInput{}
    public record Output(String displayedNumber,List<Integer> pressDigits) implements ModuleOutput{}
    private static final String[][] ORDER={{"BADC","CABD","DCAB","CADB"},{"ACBD","BCAD","CDAB","BCDA"},{"CDBA","DBCA","ABCD","DABC"},{"DCBA","DBAC","ADBC","BDCA"}};
    @Override protected SolveResult<Output> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,Input in){
        if(in==null||in.leftDigit()<0||in.leftDigit()>9||in.rightDigit()<0||in.rightDigit()>9)return failure("Enter two digits from 0 through 9");
        int value=in.leftDigit()*10+in.rightDigit(),lit=(int)bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count(),unlit=bomb.getIndicators().size()-lit;
        int row=bomb.getIndicators().isEmpty()?0:lit>unlit?1:unlit>lit?2:3,col=value/25;
        Map<Character,Integer> digit=new HashMap<>(); digit.put('A',bomb.isLastDigitEven()?2:6);digit.put('B',bomb.isLastDigitEven()?5:4);digit.put('C',bomb.isLastDigitEven()?7:bomb.getLastDigit());digit.put('D',bomb.isLastDigitEven()?bomb.getLastDigit():8);
        List<Integer> result=ORDER[row][col].chars().mapToObj(c->digit.get((char)c)).toList();
        String display="%02d".formatted(value);storeState(module,"numbersDisplay",display);return success(new Output(display,result));
    }
}
