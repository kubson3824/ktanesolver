package ktanesolver.module.modded.regular.arithmelogic;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.function.IntPredicate;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.enums.ModuleType;
import ktanesolver.module.modded.regular.arithmelogic.ArithmelogicInput.Operator;

@Service
@ModuleInfo(type = ModuleType.ARITHMELOGIC, id = "arithmelogic", name = "Arithmelogic",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Evaluate the three-symbol logical statement and choose the greatest valid values.",
    tags = {"logic", "numbers", "symbols", "edgework"})
public class ArithmelogicSolver extends AbstractModuleSolver<ArithmelogicInput, ArithmelogicOutput> {
    public static final List<String> SYMBOLS = List.of("©","Ѯ","★","Җ","Ѭ","₠","Ϡ","Ѧ","æ","Ԇ","ϫ","Ӭ","Ͼ","Ѫ","Ҩ","Ϙ","ζ","Ͽ","ƛ","€","☆","œ");

    @Override protected SolveResult<ArithmelogicOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ArithmelogicInput input) {
        if (input == null || bomb == null || bomb.getSerialNumber() == null || !symbolsValid(input) || input.leftOperator() == null || input.rightOperator() == null)
            return failure("Enter all four symbol positions, both operators, and the grouping");
        List<List<Integer>> values = List.of(input.valuesA(), input.valuesB(), input.valuesC());
        if (values.stream().anyMatch(v -> v == null || v.size() != 4 || v.stream().anyMatch(n -> n == null || n < 10)))
            return failure("Enter the four displayed values for A, B, and C");
        int[] offsets = {offset(input.symbolA(), input.submitSymbol(), bomb, round), offset(input.symbolB(), input.submitSymbol(), bomb, round), offset(input.symbolC(), input.submitSymbol(), bomb, round)};
        IntPredicate predicate = predicate(input.submitSymbol());
        int[][] best = new int[3][2]; for (int i=0;i<3;i++) { best[i][0]=-1; best[i][1]=-1; for (int n:values.get(i)) best[i][predicate.test(n+offsets[i])?1:0]=n; }
        for (int mask=0;mask<8;mask++) {
            boolean a=(mask&4)!=0,b=(mask&2)!=0,c=(mask&1)!=0;
            if (best[0][a?1:0]<0 || best[1][b?1:0]<0 || best[2][c?1:0]<0 || !statement(a,b,c,input)) continue;
            List<Integer> chosen=List.of(best[0][a?1:0],best[1][b?1:0],best[2][c?1:0]);
            List<Integer> adjusted=List.of(chosen.get(0)+offsets[0],chosen.get(1)+offsets[1],chosen.get(2)+offsets[2]);
            storeState(module,"arithmelogicSubmitSymbol",input.submitSymbol());
            return success(new ArithmelogicOutput(List.of(offsets[0],offsets[1],offsets[2]),chosen,adjusted,List.of(a,b,c),"submit "+chosen.get(0)+" "+chosen.get(1)+" "+chosen.get(2)));
        }
        return failure("No valid submission exists for the entered values");
    }
    private static boolean symbolsValid(ArithmelogicInput i){return i.symbolA()>0&&i.symbolA()<=22&&i.symbolB()>0&&i.symbolB()<=22&&i.symbolC()>0&&i.symbolC()<=22&&i.submitSymbol()>0&&i.submitSymbol()<=22;}
    private static boolean statement(boolean a,boolean b,boolean c,ArithmelogicInput i){return i.leftGrouped()?op(op(a,b,i.leftOperator()),c,i.rightOperator()):op(a,op(b,c,i.rightOperator()),i.leftOperator());}
    private static boolean op(boolean a,boolean b,Operator o){return switch(o){case AND->a&&b;case OR->a||b;case XOR->a^b;case IMPLIES->!a||b;case NAND->!(a&&b);case NOR->!(a||b);case XNOR->a==b;case IMPLIED_BY->a||!b;};}
    private static int offset(int symbol,int submit,BombEntity b,RoundEntity round){String s=b.getSerialNumber();int[] d=s.chars().filter(Character::isDigit).map(c->c-'0').toArray();int lit=(int)b.getIndicators().values().stream().filter(Boolean.TRUE::equals).count(),unlit=b.getIndicators().size()-lit,ports=b.getPortPlates().stream().mapToInt(p->p.getPorts().size()).sum();return switch(symbol-1){case 0->submit;case 1->s.chars().filter(Character::isLetter).map(c->c-'A'+1).min().orElse(0);case 2->(java.util.Arrays.stream(d).sum()+d.length-1)/d.length;case 3->b.getIndicators().size();case 4->b.getBatteryHolders();case 5->3*lit;case 6->(round!=null&&round.getStartTime()!=null?round.getStartTime().atZone(ZoneId.systemDefault()).toLocalDate():LocalDate.now()).getDayOfMonth();case 7->java.util.Arrays.stream(d).min().orElse(0)+5;case 8->ports;case 9->4*unlit;case 10->(int)s.chars().filter(c->"BCDFGHJKLMNPQRSTVWXYZ".indexOf(c)>=0).count()*5;case 11->b.getBatteryCount();case 12->java.util.Arrays.stream(d).sum();case 13->s.chars().filter(Character::isLetter).map(c->c-'A'+1).max().orElse(0);case 14->b.getModules().size()%25;case 15->(int)s.chars().filter(c->"AEIOU".indexOf(c)>=0).count()*6;case 16->b.getBatteryCount()+b.getIndicators().size();case 17->lit+b.getPortPlates().size();case 18->b.getPortPlates().size();case 19->java.util.Arrays.stream(d).max().orElse(0);case 20->15;default->unlit+b.getBatteryHolders();};}
    static IntPredicate predicate(int symbol){return n->{String s=Integer.toString(n);int sum=s.chars().map(c->c-'0').sum(),a=s.charAt(s.length()-2)-'0',b=s.charAt(s.length()-1)-'0';return switch(symbol-1){case 0->n%2==0;case 1->n%7==0||n%13==0;case 2->n%3==1;case 3->prime(n);case 4->s.chars().anyMatch(c->"13579".indexOf(c)>=0);case 5->n%5==2||n%5==4;case 6->sum>=9&&sum<=13;case 7->Math.abs(a-b)<=2;case 8->n%7==1||n%7==3||n%7==6;case 9->s.contains("3")||s.contains("6");case 10->((n-1)%9+1)%2==1;case 11->n%4==0;case 12->sum%2==1;case 13->n%2!=0;case 14->sum<7||sum>11;case 15->n%6==0;case 16->((n-1)%9+1)%2==0;case 17->n>3&&!prime(n);case 18->sum%2==0;case 19->s.contains("2")||s.contains("9");case 20->n%4==1;default->Math.abs(a-b)>=5;};};}
    private static boolean prime(int n){if(n<2)return false;for(int i=2;i*i<=n;i++)if(n%i==0)return false;return true;}
}
