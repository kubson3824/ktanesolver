package ktanesolver.module.modded.regular.tennis;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
@ModuleInfo(type=ModuleType.TENNIS,id="TennisModule",name="Tennis",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description="Advance a displayed tennis match through the serial number's thirty serving rallies.",tags={"sports","binary","simulation","serial"})
public class TennisSolver extends AbstractModuleSolver<TennisInput,TennisOutput>{
	enum Tournament{FRENCH_OPEN,US_OPEN,WIMBLEDON}
	enum Mode{NORMAL,DEUCE,ADVANTAGE_P1,ADVANTAGE_P2,TIE_BREAK}
	record State(List<TennisInput.SetScore>sets,int p1,int p2,boolean tieBreak,boolean mens,Tournament tournament){
		boolean p1Serving(){int games=sets.stream().mapToInt(s->s.player1()+s.player2()).sum();return(games%2==0)^(tieBreak&&(p1+p2+1)%4>=2);}
		Object scores(boolean server){boolean player1=!(server^p1Serving());int mine=player1?p1:p2,other=player1?p2:p1;
			if((tieBreak&&mine>=6&&mine>other)||(!tieBreak&&mine==3&&other<3)||(!tieBreak&&mine==4&&other==3)){
				TennisInput.SetScore last=sets.get(sets.size()-1);int myGames=player1?last.player1():last.player2(),otherGames=player1?last.player2():last.player1();
				if((myGames>=5&&myGames>otherGames)||tieBreak){int won=(int)sets.subList(0,sets.size()-1).stream().filter(s->player1?s.player1()>s.player2():s.player2()>s.player1()).count()+1;if(won>=(mens?3:2))return player1?1:2;List<TennisInput.SetScore> next=new ArrayList<>(sets.subList(0,sets.size()-1));next.add(inc(last,player1));next.add(new TennisInput.SetScore(0,0));return new State(List.copyOf(next),0,0,false,mens,tournament);}
				TennisInput.SetScore advanced=inc(last,player1);List<TennisInput.SetScore> next=new ArrayList<>(sets);next.set(next.size()-1,advanced);boolean startsTie=myGames+1==6&&otherGames==6&&(tournament==Tournament.US_OPEN||sets.size()<(mens?5:3));return new State(List.copyOf(next),0,0,startsTie,mens,tournament);
			}
			if(mine==4&&other==4&&!tieBreak)return new State(sets,player1?4:3,player1?3:4,false,mens,tournament);
			return new State(sets,p1+(player1?1:0),p2+(player1?0:1),tieBreak,mens,tournament);
		}
		private static TennisInput.SetScore inc(TennisInput.SetScore s,boolean p1){return new TennisInput.SetScore(s.player1()+(p1?1:0),s.player2()+(p1?0:1));}
	}
	@Override protected SolveResult<TennisOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,TennisInput input){
		if(input==null||input.tournament()==null||input.mode()==null||input.sets()==null||input.sets().isEmpty())return failure("Enter the tournament, match type, set scores, and current game score");
		Tournament tournament;Mode mode;try{tournament=Tournament.valueOf(input.tournament().trim().toUpperCase(Locale.ROOT));mode=Mode.valueOf(input.mode().trim().toUpperCase(Locale.ROOT));}catch(IllegalArgumentException e){return failure("Unknown tournament or score mode");}
		int maxSets=input.mensPlay()?5:3;if(input.sets().size()>maxSets||input.sets().stream().anyMatch(s->s==null||s.player1()<0||s.player1()>99||s.player2()<0||s.player2()>99))return failure("Set scores are invalid for this match");
		int p1=input.player1Score(),p2=input.player2Score();boolean tie=mode==Mode.TIE_BREAK;
		if(tie){if(p1<0||p1>99||p2<0||p2>99)return failure("Tie-break scores must be between 0 and 99");}
		else if(mode==Mode.NORMAL){p1=pointIndex(p1);p2=pointIndex(p2);if(p1<0||p2<0)return failure("Normal points must be 0, 15, 30, or 40");}
		else{p1=mode==Mode.ADVANTAGE_P1?4:mode==Mode.ADVANTAGE_P2?3:4;p2=mode==Mode.ADVANTAGE_P2?4:mode==Mode.ADVANTAGE_P1?3:4;}
		String serial=bomb.getSerialNumber()==null?"":bomb.getSerialNumber().trim().toUpperCase(Locale.ROOT);if(!serial.matches("[A-Z0-9]{6}"))return failure("The bomb serial number must contain six letters or digits");
		StringBuilder binary=new StringBuilder();for(char ch:serial.toCharArray()){int value=Character.isDigit(ch)?ch-'0':6+ch-'A';binary.append(String.format("%5s",Integer.toBinaryString(value)).replace(' ','0'));}
		State initial=new State(List.copyOf(input.sets()),p1,p2,tie,input.mensPlay(),tournament),state=initial;Integer winner=null;for(int i=0;i<binary.length()&&winner==null;i++){Object next=state.scores(binary.charAt(i)=='1');if(next instanceof Integer n)winner=n;else state=(State)next;}
		if(winner!=null)return success(new TennisOutput(binary.toString(),winner,List.of(),"VICTORY",0,0,List.of("P"+winner)));
		Mode resultMode=modeOf(state,tournament);List<String> actions=actions(initial,state,mode,resultMode);return success(new TennisOutput(binary.toString(),null,state.sets(),resultMode.name(),display(state.p1(),resultMode),display(state.p2(),resultMode),actions));
	}
	private static int pointIndex(int shown){return shown==0?0:shown==15?1:shown==30?2:shown==40?3:-1;}
	private static int display(int value,Mode mode){return mode==Mode.NORMAL?new int[]{0,15,30,40}[value]:value;}
	private static Mode modeOf(State s,Tournament t){if(s.tieBreak())return Mode.TIE_BREAK;if(s.p1()==4&&s.p2()==4||(s.p1()==3&&s.p2()==3&&t!=Tournament.FRENCH_OPEN))return Mode.DEUCE;if(s.p1()==4)return Mode.ADVANTAGE_P1;if(s.p2()==4)return Mode.ADVANTAGE_P2;return Mode.NORMAL;}
	private static List<String> actions(State initial,State target,Mode initialMode,Mode targetMode){List<String>a=new ArrayList<>();a.add("LR");for(int i=0;i<target.sets().size();i++){TennisInput.SetScore from=i<initial.sets().size()?initial.sets().get(i):null,to=target.sets().get(i);if(from==null){a.add("S"+(i+1)+"1");from=new TennisInput.SetScore(0,0);}for(int n=from.player1();n<to.player1();n++)a.add("S"+(i+1)+"1");for(int n=from.player2();n<to.player2();n++)a.add("S"+(i+1)+"2");}
		int rotations=(modeCycle(targetMode)-modeCycle(initialMode)+3)%3;for(int i=0;i<rotations;i++)a.add("R");int start1=rotations==0?initial.p1():0,start2=rotations==0?initial.p2():0;
		if(targetMode==Mode.NORMAL){for(int n=start1;n!=target.p1();n=(n+1)%4)a.add("S1");for(int n=start2;n!=target.p2();n=(n+1)%4)a.add("S2");}
		else if(targetMode==Mode.TIE_BREAK){for(int n=start1;n<target.p1();n++)a.add("S1");for(int n=start2;n<target.p2();n++)a.add("S2");}
		else{int start=specialIndex(initialMode),end=specialIndex(targetMode);if(rotations>0)start=0;for(int n=start;n!=end;n=(n+1)%3)a.add("S");}return List.copyOf(a);}
	private static int modeCycle(Mode m){return m==Mode.NORMAL?0:m==Mode.TIE_BREAK?2:1;}private static int specialIndex(Mode m){return m==Mode.ADVANTAGE_P1?1:m==Mode.ADVANTAGE_P2?2:0;}
}
