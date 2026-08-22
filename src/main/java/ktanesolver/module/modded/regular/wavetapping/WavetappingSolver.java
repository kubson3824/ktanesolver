package ktanesolver.module.modded.regular.wavetapping;

import java.util.ArrayList;
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

@Service
@ModuleInfo(type=ModuleType.WAVETAPPING,id="Wavetapping",name="Wavetapping",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Calculate and render each of three 9×9 patterns from its stage color and unavailable-color display.",
    tags={"patterns","pixels","colors","stages","grid"})
public class WavetappingSolver extends AbstractModuleSolver<WavetappingInput,WavetappingOutput>{
    public static final List<String> COLORS=List.copyOf(WavetappingPatterns.ALL.keySet());
    private static final int[] PURPLE={1,7,2,7,8,6,3,2,6,4,6,4,9,10,10,10,10,10,1,7,2,7,8,3,3,3,5,4,6,4,9,10,10,10,10,10,1,7,2,7,8,5,2,6,4,8,2,4,3,10,10,10,10,10,1,7,2,7,8,8,4,3,3,3,7,4,7,3,3,6,7,8,6,3,3,7,7,8,2,6,3,4,6,4,11,12,12,12,12,12,12,12,12,12,13};
    @Override protected SolveResult<WavetappingOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,WavetappingInput input){
        if(input==null||input.currentColor()==null||input.unavailableColors()==null)return failure("Enter the stage color and all eight colored display squares");if(input.stage()<1||input.stage()>3)return failure("Stage must be between 1 and 3");
        String color=canonical(input.currentColor());if(color==null)return failure("Choose a valid Wavetapping color");List<String> unavailable=input.unavailableColors().stream().map(WavetappingSolver::canonical).toList();if(unavailable.size()!=8||unavailable.stream().anyMatch(java.util.Objects::isNull)||unavailable.stream().distinct().count()!=8)return failure("Enter eight distinct unavailable colors");if(unavailable.contains(color))return failure("The current stage color cannot be one of the eight colored display squares");
        String serial=bomb.getSerialNumber();if(serial==null||serial.isBlank())return failure("Enter the bomb serial number first");serial=serial.toUpperCase(Locale.ROOT);
        List<String> historyColors=input.resetHistory()?new ArrayList<>():strings(module.getState().get("wavetappingStageColors"));List<Integer> historyNumbers=input.resetHistory()?new ArrayList<>():integers(module.getState().get("wavetappingPatternNumbers"));
        storeState(module,"wavetappingAvailableColors",COLORS.stream().filter(x->!unavailable.contains(x)).toList());
        int index;if(input.stage()<=historyNumbers.size()){if(!historyColors.get(input.stage()-1).equals(color))return failure("This stage color differs from the stored sequence; reset the sequence if the module was regenerated");index=historyNumbers.get(input.stage()-1)-1;}else{if(input.stage()!=historyNumbers.size()+1)return failure("Solve the preceding stage first");index=patternIndex(color,input.stage()-1,unavailable,historyColors,historyNumbers,bomb,serial);historyColors.add(color);historyNumbers.add(index+1);storeState(module,"wavetappingStageColors",List.copyOf(historyColors));storeState(module,"wavetappingPatternNumbers",List.copyOf(historyNumbers));}
        String pattern=WavetappingPatterns.ALL.get(color).get(index);int charSum=sum(serial.substring(0,Math.min(3,serial.length())))*sum(serial.substring(Math.min(3,serial.length())));if(color.equals("Magenta")&&charSum>2222)pattern=transpose(pattern);if(serial.chars().filter(c->"SRFMU".indexOf(c)>=0).count()>=3)pattern=new StringBuilder(pattern).reverse().toString();
        List<String> rows=new ArrayList<>();for(int row=1;row<=9;row++)rows.add(pattern.substring(row*11+1,row*11+10));return success(new WavetappingOutput(input.stage(),color,index+1,List.copyOf(rows),command(rows)),input.stage()==3);
    }
    private static int patternIndex(String color,int stage,List<String> unavailable,List<String> prevColors,List<Integer> prevNumbers,BombEntity bomb,String serial){int length=WavetappingPatterns.ALL.get(color).size();List<Integer>digits=serial.chars().filter(Character::isDigit).map(c->c-'0').boxed().toList();int first=digits.get(0),last=digits.get(digits.size()-1);return switch(color){
        case"Red"->range(Math.max(1,bomb.getBatteryCount())*Math.max(1,bomb.getIndicators().size()),length);case"Orange"->range((stage+1)*Math.max(1,last),length);case"Orange-Yellow"->digits.stream().mapToInt(Integer::intValue).sum()%2==0?2-stage:stage;
        case"Chartreuse"->{long left=unavailable.stream().filter(x->COLORS.indexOf(x)%4<2).count(),right=8-left;yield left==right?(bomb.getPortPlates().size()%2==0?0:1):(left<right?1:0);}case"Lime"->{int d=bomb.getDBatteryCount(),aa=bomb.getAaBatteryCount();if(d==aa)yield first%2==0?1:0;if(stage>0&&WavetappingPatterns.ALL.get(prevColors.get(stage-1)).size()<=3)yield d>aa?1:0;yield d<aa?1:0;}
        case"Green"->{int pixels;if(stage>0)pixels=active(WavetappingPatterns.ALL.get(prevColors.get(stage-1)).get(prevNumbers.get(stage-1)-1));else pixels=active(WavetappingPatterns.ALL.get(unavailable.stream().min(java.util.Comparator.comparingInt(COLORS::indexOf)).orElseThrow()).get(0));yield range(pixels,length);}case"Seafoam Green"->{long top=unavailable.stream().filter(x->COLORS.indexOf(x)/4<2).count(),bottom=8-top;long lit=bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();yield top==bottom?(lit%2==0?0:1):(top<bottom?1:0);}case"Cyan-Green"->last%2==0?1:0;
        case"Turquoise"->{int weighted=bomb.getIndicators().entrySet().stream().mapToInt(e->e.getKey().equals("BOB")?5:Boolean.TRUE.equals(e.getValue())?2:1).sum();yield range(Math.max(1,bomb.getPortPlates().size())*Math.max(1,weighted),length);}case"Dark Blue"->range((int)bomb.getModules().stream().filter(m->m.getType()==ModuleType.WAVETAPPING).count(),length);case"Indigo"->range((stage==0?digits.stream().mapToInt(Integer::intValue).sum():prevNumbers.stream().mapToInt(Integer::intValue).sum())*bomb.getModules().size(),length);
        case"Purple"->PURPLE[range(sum(serial)*(bomb.getBatteryCount()==0?13:bomb.getBatteryCount()),95)]-1;case"Purple-Magenta"->{if(stage==0)yield 0;boolean easy=List.of("Red","Orange","Orange-Yellow","Chartreuse","Lime","Green","Seafoam Green","Cyan-Green","Dark Blue","Purple-Magenta").contains(prevColors.get(stage-1));boolean low=prevNumbers.get(stage-1)<=Math.ceil(WavetappingPatterns.ALL.get(prevColors.get(stage-1)).size()/2.0);yield easy?(low?0:2):(low?1:3);}case"Magenta"->{int product=sum(serial.substring(0,Math.min(3,serial.length())))*sum(serial.substring(Math.min(3,serial.length())));yield range(product==0?8:product,length);}case"Pink"->{String ds=digits.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining());long n=Long.parseLong(ds);if(n==0)n=stage==0?serial.chars().filter(Character::isLetter).map(c->c-'A'+1).findFirst().orElse(1):prevNumbers.get(stage-1);yield range(n,length);}case"Grey"->range(unavailable.stream().mapToInt(x->WavetappingPatterns.ALL.get(x).size()).sum(),length);default->0;};}
    private static int range(long value,int length){return value==0?0:(int)Math.floorMod(value-1,length);}private static int active(String p){return(int)p.chars().filter(c->c=='O').count();}private static int sum(String s){return s.chars().map(c->Character.isDigit(c)?c-'0':c-'A'+1).sum();}
    private static String transpose(String p){StringBuilder b=new StringBuilder(121);for(int col=0;col<11;col++)for(int row=0;row<11;row++)b.append(p.charAt(row*11+col));return b.toString();}
    private static String command(List<String>rows){List<String>groups=new ArrayList<>();for(int col=0;col<9;col++){StringBuilder g=new StringBuilder().append((char)('A'+col));for(int row=0;row<9;row++)if(rows.get(row).charAt(col)=='O')g.append(row+1);if(g.length()>1)groups.add(g.toString());}return "press "+String.join(" ",groups);}
    private static String canonical(String value){if(value==null)return null;return COLORS.stream().filter(x->x.equalsIgnoreCase(value.trim())).findFirst().orElse(null);}private static List<String> strings(Object v){if(!(v instanceof List<?>l))return new ArrayList<>();return new ArrayList<>(l.stream().map(String::valueOf).toList());}private static List<Integer> integers(Object v){if(!(v instanceof List<?>l))return new ArrayList<>();return new ArrayList<>(l.stream().map(x->x instanceof Number n?n.intValue():0).toList());}
}
