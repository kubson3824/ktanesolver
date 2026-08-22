package ktanesolver.module.modded.regular.equationsx;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.equationsx.EquationsXInput.Symbol;

@Service
@ModuleInfo(type=ModuleType.EQUATIONS_X,id="equationsXModule",name="Equations X",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Apply the displayed equation and its edgework rules, then submit the rounded absolute result.",tags={"equations","math","symbols","edgework"})
public class EquationsXSolver extends AbstractModuleSolver<EquationsXInput,EquationsXOutput>{
 private static final List<String>DISPLAY=List.of("H(T)","P","χ","ω","Z(T)","τ","μ","α","K");
 @Override protected SolveResult<EquationsXOutput>doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,EquationsXInput input){
  if(input==null||input.symbol()==null||input.numbers()==null)return failure("Enter the displayed symbol and number pattern");int expected=input.symbol()==Symbol.POSITION?4:input.symbol()==Symbol.ANGULAR_ACCELERATION?3:2;if(input.numbers().size()!=expected||input.numbers().stream().anyMatch(n->n==null||n<0||n>99))return failure("This symbol requires "+expected+" numbers from 0 through 99");
  double[]n=input.numbers().stream().mapToDouble(Integer::doubleValue).toArray();boolean nothing=false;double answer=0;String serial=bomb.getSerialNumber()==null?"":bomb.getSerialNumber().toUpperCase(Locale.ROOT);boolean needy=bomb.getModules().stream().anyMatch(m->m.getType()!=null&&m.getType().isNeedy()),button=has(bomb,ModuleType.BUTTON),keypad=has(bomb,ModuleType.KEYPADS);long solved=bomb.getModules().stream().filter(ModuleEntity::isSolved).count();
  switch(input.symbol()){
   case H_OF_T->{answer=bomb.getBatteryCount()>5?n[0]*n[0]+4*n[1]:(n[0]*n[0]*n[0])/3+2*n[1]*n[1]+(bomb.hasPort(PortType.PARALLEL)?8:-5);}
   case POWER->{if(bomb.isIndicatorUnlit("CLR")){for(int i=0;i<n.length;i++)n[i]=Integer.parseInt(String.format(Locale.ROOT,"%02d",(int)n[i]).replace('3','4'));}answer=n[0]*n[1];if(serial.chars().anyMatch(c->"AEIOU".indexOf(c)>=0))answer=answer*2/3;if(bomb.getModules().size()>=6)answer+=14;}
   case POSITION->{if(keypad)for(int i=0;i<n.length;i++)n[i]=Integer.parseInt(String.format(Locale.ROOT,"%02d",(int)n[i]).replace('5','8'));double angle=Math.toRadians(n[1]*n[2]+n[3]);answer=n[0]*(solved>=1?Math.sin(angle):Math.cos(angle));if(serial.indexOf('3')>=0||serial.indexOf('5')>=0)answer+=21;}
   case ANGULAR_VELOCITY->{if(n[0]==0){nothing=true;break;}boolean flip=bomb.isIndicatorUnlit("CAR")&&bomb.isIndicatorUnlit("IND");answer=flip?n[0]/n[1]:n[1]/n[0];if(serial.chars().filter(Character::isDigit).anyMatch(c->((c-'0')&1)==1))answer-=5;}
   case Z_OF_T->{int widgets=bomb.getBatteryHolders()+bomb.getPortPlates().size()+bomb.getIndicators().size();answer=widgets>6?n[0]+3:n[0]*n[0]/2+3*n[1]+2;}
   case TORQUE->{boolean r1=bomb.getBatteryCount()>1&&bomb.getPortPlates().stream().anyMatch(p->p.getPorts().isEmpty()),r2=solved>=2,r3=bomb.isIndicatorLit("FRQ"),r4=!r3&&needy,r5=!r3&&bomb.isIndicatorUnlit("BOB");answer=n[0]*n[1];if(r1)answer+=10;if(r2)answer=(n[0]/2)*(n[1]/2)+(r1?5:0);if(r4)answer=n[0]*n[1];if(r5)answer+=3;}
   case STATIC_FRICTION->{if(n[0]==0){nothing=true;break;}answer=n[1]/n[0];if(bomb.getBatteryCount()==2)answer=7*n[1]/(3*n[0]);if(!bomb.isIndicatorLit("NSA")&&bomb.hasPort(PortType.RJ45))answer+=1;}
   case ANGULAR_ACCELERATION->{if(bomb.getStrikes()>=2||n[0]==0){nothing=true;break;}boolean stereo=bomb.hasPort(PortType.STEREO_RCA);if(stereo&&needy)answer=116;else if(needy)answer=(n[1]-n[2])/(4*n[0]);else answer=(n[1]-n[2])/n[0]+(stereo?8:0);}
   case KINETIC_ENERGY->{answer=.5*n[0]*n[1]*n[1];if(bomb.getIndicators().size()>=3)answer*=2;if(button)answer*=3;}
  }
  String symbol=DISPLAY.get(input.symbol().ordinal());storeState(module,"equationsXSymbol",symbol);if(nothing)return success(new EquationsXOutput(null,true,symbol,"nothing"));int rounded=BigDecimal.valueOf(answer).setScale(0,RoundingMode.HALF_UP).abs().intValue();return success(new EquationsXOutput(rounded,false,symbol,"submit "+rounded));
 }
 private static boolean has(BombEntity bomb,ModuleType type){return bomb.getModules().stream().anyMatch(m->m.getType()==type);}
}
