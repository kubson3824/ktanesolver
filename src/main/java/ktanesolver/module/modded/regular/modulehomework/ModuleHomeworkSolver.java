package ktanesolver.module.modded.regular.modulehomework;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
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

@Service
@ModuleInfo(type=ModuleType.MODULE_HOMEWORK,id="KritHomework",name="Module Homework",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description="Answer one of 31 module trivia questions after applying the bomb's school-level offset.",tags={"trivia","edgework","timed","school"})
public class ModuleHomeworkSolver extends AbstractModuleSolver<ModuleHomeworkInput,ModuleHomeworkOutput>{
	public record Answer(int position,String text){}
	public static final Map<String,Answer> ANSWERS=answers();
	@Override protected SolveResult<ModuleHomeworkOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,ModuleHomeworkInput input){
		if(input==null||input.subject()==null||input.subject().isBlank())return failure("Select the subject shown on the homework");
		String key=normalize(input.subject()); Map.Entry<String,Answer> entry=ANSWERS.entrySet().stream().filter(e->normalize(e.getKey()).equals(key)).findFirst().orElse(null);
		if(entry==null)return failure("Unknown Module Homework subject");
		String serial=bomb.getSerialNumber()==null?"":bomb.getSerialNumber().toUpperCase(Locale.ROOT); int base=serial.chars().filter(Character::isDigit).map(c->c-'0').findFirst().orElse(0);
		String labels=String.join("",bomb.getIndicators().keySet()).toUpperCase(Locale.ROOT);
		if(serial.chars().anyMatch(c->"SCHOOL".indexOf(c)>=0))base+=3;
		if(labels.chars().anyMatch(c->"STUDENT".indexOf(c)>=0))base+=2;
		if(bomb.hasPort(PortType.PARALLEL))base+=2;
		if(bomb.hasIndicator("FRK")||bomb.hasIndicator("NSA"))base+=2;
		if(serial.chars().anyMatch(c->"AEIOU".indexOf(c)>=0))base+=5;
		if(bomb.getDBatteryCount()>1)base+=2;
		if(bomb.isIndicatorLit("BOB"))base=1;
		int shift=base<=6?0:base<=12?1:base<=18?2:3; String school=shift==0?"ELEMENTARY":shift==1?"HIGH SCHOOL":shift==2?"UNIVERSITY":"KLANE SCHOOL";
		int button=(entry.getValue().position()-1+shift)%4+1;
		return success(new ModuleHomeworkOutput(entry.getKey(),entry.getValue().text(),entry.getValue().position(),base,school,button));
	}
	private static String normalize(String value){return value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]","");}
	private static Map<String,Answer> answers(){Map<String,Answer> m=new LinkedHashMap<>();
		m.put("Who's On First",new Answer(2,"UHH"));m.put("Memory",new Answer(3,"4"));m.put("Morse Code",new Answer(1,"16"));m.put("Complicated Wires",new Answer(4,"ONLY WITH 2+ BATTERIES"));
		m.put("The Maze",new Answer(2,"9"));m.put("Passwords",new Answer(3,"M"));m.put("The Knob",new Answer(2,"12"));m.put("Hexamaze",new Answer(3,"19"));
		m.put("The Swan",new Answer(1,"4, 8, 15, 16, 23, 42"));m.put("Poker",new Answer(4,"3 OF CLUBS"));m.put("Turn The Keys",new Answer(1,"TURN THE LEFT KEY"));m.put("Two Bits",new Answer(2,"TV"));
		m.put("Semaphore",new Answer(2,"LETTERS"));m.put("Souvenir",new Answer(4,"TANGRAMS"));m.put("Random Number Generator",new Answer(1,"45"));m.put("Answering Questions",new Answer(2,"IF YOU HAVE JUST ONE STRIKE"));
		m.put("Button Masher",new Answer(2,"45"));m.put("Hex To Decimal",new Answer(4,"66"));m.put("QR Code",new Answer(4,"8"));m.put("Astrology",new Answer(3,"A FOUR"));
		m.put("Microcontroller",new Answer(1,"INDC"));m.put("Translated Modules",new Answer(4,"MEMORY"));m.put("Crazy Talk",new Answer(3,"8/1"));m.put("Ice Cream",new Answer(4,"CRANBERRY CREAM"));
		m.put("Light Cycle",new Answer(2,"ORANGE"));m.put("Blackjack",new Answer(1,"A JACK OF DIAMONDS"));m.put("British Slang",new Answer(3,"PISH POSH"));m.put("Periodic Table",new Answer(4,"Tr"));
		m.put("T-Words",new Answer(2,"TACHEOMETER"));m.put("Snooker",new Answer(1,"1 POINT"));m.put("Benedict Cumberbatch",new Answer(3,"BUTT"));return Map.copyOf(m);}
}
