package ktanesolver.module.modded.regular.regularcrazytalk;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.REGULAR_CRAZY_TALK,id="RegularCrazyTalkModule",name="Regular Crazy Talk",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Match the displayed digit to the phrase's D value, then hold and release at H and R.",tags={"phrases","timing","rule seed","souvenir"})
public class RegularCrazyTalkSolver extends AbstractModuleSolver<RegularCrazyTalkInput,RegularCrazyTalkOutput>{
    @Override protected SolveResult<RegularCrazyTalkOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,RegularCrazyTalkInput input){
        if(input==null||input.phrases()==null||input.phrases().size()!=5)return failure("Enter all five phrases and displayed digits");
        List<RegularCrazyTalkRules.Result> rules=new ArrayList<>();List<Integer> matches=new ArrayList<>();
        for(int i=0;i<5;i++){RegularCrazyTalkPhrase p=input.phrases().get(i);if(p==null||p.phrase()==null||!digit(p.displayedDigit()))return failure("Every phrase needs its exact text and a displayed digit from 0 through 9");RegularCrazyTalkRules.Result rule=RegularCrazyTalkRules.lookup(p.phrase());if(rule==null)return failure("Phrase "+(i+1)+" was not found in the default rule-seed table");rules.add(rule);if(p.displayedDigit()==rule.expectedDigit())matches.add(i);}
        if(matches.size()!=1)return failure("Exactly one phrase must have its displayed digit equal to D");int ix=matches.get(0);RegularCrazyTalkPhrase p=input.phrases().get(ix);RegularCrazyTalkRules.Result rule=rules.get(ix);
        storeState(module,"regularCrazyTalkDigit",rule.expectedDigit());storeState(module,"regularCrazyTalkModifier",rule.modifier());
        return success(new RegularCrazyTalkOutput(ix+1,p.phrase(),rule.expectedDigit(),rule.hold(),rule.release(),rule.modifier()));
    }
    private static boolean digit(Integer i){return i!=null&&i>=0&&i<=9;}
}
