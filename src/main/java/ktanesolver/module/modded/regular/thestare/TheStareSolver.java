package ktanesolver.module.modded.regular.thestare;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.thestare.TheStareInput.Eye;

@Service
@ModuleInfo(type = ModuleType.THE_STARE, id = "StareModule", name = "The Stare",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Determine every linked eye's desired state and the timer digits that permit toggling it.",
    tags = {"eyes", "colors", "timer", "linked modules", "states"})
public class TheStareSolver extends AbstractModuleSolver<TheStareInput, TheStareOutput> {
    private static final Set<String> COLORS=Set.of("RED","BURGUNDY","GOLD","YELLOW","GREEN","TURQUOISE","PURPLE","GRAY","WHITE");
    private static final Set<String> TYPES=Set.of("NORMAL","SPECIAL","SMALL"), BACKGROUNDS=Set.of("PLAIN","WARPED","RIFTED");
    @Override protected SolveResult<TheStareOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,TheStareInput input){
        if(input==null||input.eyes()==null||input.eyes().isEmpty())return failure("Enter every Stare eye on this bomb");if(input.targetIndex()<1||input.targetIndex()>input.eyes().size())return failure("Choose a valid target eye");if(input.initialMinutes()<1)return failure("Enter the initial number of minutes");
        List<Eye> eyes=new ArrayList<>();for(Eye e:input.eyes()){if(e==null||e.color()==null||e.type()==null||e.background()==null)return failure("Every eye needs a color, type, and background");Eye n=new Eye(norm(e.color()),norm(e.type()),norm(e.background()),e.open());if(!COLORS.contains(n.color())||!TYPES.contains(n.type())||!BACKGROUNDS.contains(n.background()))return failure("Use valid manual eye colors, types, and backgrounds");eyes.add(n);}
        String serial=bomb.getSerialNumber();if(serial==null||serial.isBlank())return failure("Enter the bomb serial number first");serial=serial.toUpperCase(Locale.ROOT);boolean unicorn=serial.chars().filter(Character::isLetter).mapToObj(c->(char)c).toList().equals(List.of('D','D'));
        int nonNeedy=(int)bomb.getModules().stream().filter(m->m.getType()==null||!m.getType().isNeedy()).count();boolean[] desired=new boolean[eyes.size()];
        for(int i=0;i<eyes.size();i++)if(!eyes.get(i).color().equals("WHITE"))desired[i]=!unicorn&&desired(eyes.get(i),eyes,serial,bomb,input.initialMinutes(),nonNeedy);
        for(int i=0;i<eyes.size();i++)if(eyes.get(i).color().equals("WHITE")){Eye white=eyes.get(i);long closed=0,open=0;for(int j=0;j<eyes.size();j++)if(!eyes.get(j).color().equals("WHITE")&&eyes.get(j).type().equals(white.type())){if(desired[j])open++;else closed++;}desired[i]=!unicorn&&closed>open;}
        Eye target=eyes.get(input.targetIndex()-1);List<Integer> digits=activeDigits(target,eyes,serial,input.disarmedModules());String time=input.confirm()?null:exampleTime(digits);
        return success(new TheStareOutput(desired[input.targetIndex()-1]?"OPEN":"CLOSED",target.open()!=desired[input.targetIndex()-1],digits,time,input.confirm()),input.confirm());
    }
    private static boolean desired(Eye e,List<Eye> eyes,String serial,BombEntity bomb,int minutes,int nonNeedy){return switch(e.color()){
        case"RED"->e.type().equals("SMALL")||(e.type().equals("SPECIAL")&&!e.background().equals("PLAIN")&&(e.background().equals("RIFTED")||count(eyes,x->x.color().equals("RED")&&x.type().equals("SPECIAL")&&x.background().equals("WARPED"))%2==0));
        case"BURGUNDY"->count(eyes,x->x.type().equals(e.type())&&x.background().equals(e.background()))>1||(count(eyes,x->x.type().equals(e.type()))==1&&count(eyes,x->x.background().equals(e.background()))==1);
        case"GOLD"->(eyes.size()<minutes)^e.type().equals("SMALL");
        case"YELLOW","PURPLE"->yellowPurple(e,eyes,bomb);
        case"GREEN"->nonNeedy%Map.of("PLAIN",3,"WARPED",5,"RIFTED",7).get(e.background())==0;
        case"TURQUOISE"->((count(eyes,x->x.type().equals(e.type()))==1||count(eyes,x->x.background().equals(e.background()))==1)^(serial.chars().filter(c->"TURQUOISE".indexOf(c)>=0).count()%2==0));
        case"GRAY"->{int total=0;for(Eye x:eyes)if(x.color().equals("GRAY")){total+=switch(x.type()){case"SMALL"->1;case"NORMAL"->2;default->3;};if(x.background().equals("RIFTED"))total+=5;if(x.background().equals("WARPED"))total+=10;}total%=50;yield total%21==0||(total%3!=0&&total%7!=0);}
        default->false;};}
    private static boolean yellowPurple(Eye e,List<Eye>eyes,BombEntity bomb){long yellow=count(eyes,x->x.color().equals("YELLOW")&&x.type().equals(e.type())),purple=count(eyes,x->x.color().equals("PURPLE")&&x.type().equals(e.type()));if(yellow!=purple)return e.color().equals(yellow>purple?"YELLOW":"PURPLE");String inds=String.join("",bomb.getIndicators().keySet());long prospit=inds.chars().filter(c->"PROSPIT".indexOf(c)>=0).count(),derse=inds.chars().filter(c->"DERSE".indexOf(c)>=0).count();return prospit==derse||e.color().equals(prospit>derse?"YELLOW":"PURPLE");}
    private static List<Integer> activeDigits(Eye e,List<Eye>eyes,String serial,int solved){List<Integer>d=new ArrayList<>();if(e.open())d.add(0);if(count(eyes,x->x.color().equals(e.color()))==1)d.add(1);if(serial.chars().filter(c->"24680".indexOf(c)>=0).count()==2)d.add(2);if(eyes.stream().map(Eye::color).distinct().count()>=3)d.add(3);if(!e.type().equals("NORMAL")&&!e.background().equals("PLAIN"))d.add(4);if(solved%5==0)d.add(5);if(e.color().startsWith("G"))d.add(6);if(e.type().equals("SMALL")^(!e.color().equals("RED")&&!e.color().equals("BURGUNDY")))d.add(7);if(eyes.size()==8)d.add(8);if(d.isEmpty())d.add(9);return List.copyOf(d);}
    private static String exampleTime(List<Integer>digits){for(int seconds=59;seconds>=0;seconds--){String t=String.format("00:%02d",seconds);long hits=t.chars().filter(c->Character.isDigit(c)&&digits.contains(c-'0')).count();if(hits%2==1)return t;}return "00:00";}
    private static long count(List<Eye>eyes,java.util.function.Predicate<Eye>p){return eyes.stream().filter(p).count();}private static String norm(String s){return s.trim().toUpperCase(Locale.ROOT);}
}
