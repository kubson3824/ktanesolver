package ktanesolver.module.modded.regular.sevenwires;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(type=ModuleType.SEVEN_WIRES,id="sevenWires",name="Seven Wires",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Apply the deliberately strange rule list to seven colored wires and a two-digit display.",tags={"wires","number","edgework","ordered rules"})
public class SevenWiresSolver extends AbstractModuleSolver<SevenWiresInput,SevenWiresOutput>{
 private static final Set<String>COLORS=Set.of("red","yellow","black","blue");
 @Override protected SolveResult<SevenWiresOutput>doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,SevenWiresInput input){
  if(input==null||input.displayedNumber()<0||input.displayedNumber()>99||input.wireColors()==null||input.wireColors().size()!=7)return failure("Enter the two-digit number and all seven wire colors");
  List<String>wires=input.wireColors().stream().map(x->x==null?"":x.trim().toLowerCase(Locale.ROOT)).toList();if(wires.stream().anyMatch(x->!COLORS.contains(x)))return failure("Wire colors must be red, yellow, black, or blue");
  Set<Integer>cut=new HashSet<>(input.alreadyCutPositions()==null?List.of():input.alreadyCutPositions());if(cut.stream().anyMatch(x->x<1||x>7))return failure("Already-cut wire positions must be from 1 through 7");
  if(cut.size()==7)return failure("At least one wire must still be uncut");
  boolean previous=false;
  if(bomb.isIndicatorLit("FRK")&&bomb.isIndicatorLit("CLR")){SevenWiresOutput o=available(wires,cut,2,1);if(o!=null)return success(o);previous=true;}
  if(solved(bomb,ModuleType.FORGET_EVERYTHING)||solved(bomb,ModuleType.FORGET_ME_NOT)){SevenWiresOutput o=available(wires,cut,6,3);if(o!=null)return success(o);previous=true;}
  String serial=bomb.getSerialNumber()==null?"":bomb.getSerialNumber().toUpperCase(Locale.ROOT);if(!serial.isEmpty()&&serial.chars().allMatch(c->Character.isDigit(c)||"AEIOU".indexOf(c)>=0)){int p=bomb.getLastDigit()%8;if(p==0)p=1;SevenWiresOutput o=available(wires,cut,p,4);if(o!=null)return success(o);previous=true;}
  if(Set.of(4,8,15,16,23,42).contains(input.displayedNumber())){SevenWiresOutput o=available(wires,cut,4,5);if(o!=null)return success(o);previous=true;}
  if(input.displayedNumber()==0){SevenWiresOutput o=available(wires,cut,6,6);if(o!=null)return success(o);previous=true;}
  if(input.allModulesByTimwi()){SevenWiresOutput o=available(wires,cut,cut.contains(4)?7:4,7);if(o!=null)return success(o);previous=true;}
  long solved=bomb.getModules().stream().filter(ModuleEntity::isSolved).count();if(solved>=2&&solved%6==0){SevenWiresOutput o=available(wires,cut,1,8);if(o!=null)return success(o);previous=true;}
  if(input.laundryUnicorn()){return success(any(wires,cut,9));}
  if(bomb.getBatteryCount()>5){SevenWiresOutput o=available(wires,cut,5,10);if(o!=null)return success(o);previous=true;}
  if(wires.stream().allMatch(x->x.equals("yellow")||x.equals("blue"))){SevenWiresOutput o=available(wires,cut,5,12);if(o!=null)return success(o);previous=true;}
  if(previous){SevenWiresOutput o=available(wires,cut,1,13);if(o!=null)return success(o);}
  if(input.displayedNumber()%20==0){SevenWiresOutput o=available(wires,cut,7,14);if(o!=null)return success(o);previous=true;}
  if(serial.indexOf('Y')>=0||serial.indexOf('0')>=0){SevenWiresOutput o=available(wires,cut,3,18);if(o!=null)return success(o);previous=true;}
  if(bomb.isIndicatorLit("IND")||bomb.isIndicatorLit("NLL")){SevenWiresOutput o=available(wires,cut,5,19);if(o!=null)return success(o);return success(any(wires,cut,20));}
  if(bomb.hasPort(PortType.HDMI)&&wires.stream().filter("red"::equals).count()>=2){SevenWiresOutput o=available(wires,cut,6,21);if(o!=null)return success(o);previous=true;}
  if(input.displayedNumber()%7==0){SevenWiresOutput o=available(wires,cut,7,22);if(o!=null)return success(o);previous=true;}
  if(input.twoFactorContainsFive()){SevenWiresOutput o=available(wires,cut,1,24);if(o!=null)return success(o);previous=true;}
  if(input.noModdedModules()){SevenWiresOutput o=available(wires,cut,2,25);if(o!=null)return success(o);previous=true;}
  SevenWiresOutput fallback=available(wires,cut,bomb.isLastDigitEven()?3:4,27);if(fallback!=null)return success(fallback);
  return failure("The required wire is already cut and no later applicable rule has an available wire");
 }
 private static boolean solved(BombEntity b,ModuleType type){return b.getModules().stream().anyMatch(m->m.getType()==type&&m.isSolved());}
 private static SevenWiresOutput available(List<String>w,Set<Integer>cut,int position,int rule){return cut.contains(position)?null:new SevenWiresOutput(position,w.get(position-1),rule);}
 private static SevenWiresOutput any(List<String>w,Set<Integer>cut,int rule){for(int p=1;p<=7;p++)if(!cut.contains(p))return new SevenWiresOutput(p,w.get(p-1),rule);throw new IllegalArgumentException("All seven wires are already cut");}
}
