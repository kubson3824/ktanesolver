package ktanesolver.module.modded.regular.booleanmaze;
import java.util.ArrayList;import java.util.HashMap;import java.util.List;import java.util.Map;import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;import ktanesolver.dto.ModuleCatalogDto;import ktanesolver.entity.BombEntity;import ktanesolver.entity.ModuleEntity;import ktanesolver.entity.RoundEntity;import ktanesolver.enums.ModuleType;import ktanesolver.logic.AbstractModuleSolver;import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(type=ModuleType.BOOLEAN_MAZE,id="boolMaze",name="Boolean Maze",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description="Navigate the serial-number maze one rerolled display at a time.",tags={"maze","logic-gates","display","serial","movement"})
public class BooleanMazeSolver extends AbstractModuleSolver<BooleanMazeInput,BooleanMazeOutput>{
	private static final int[][] GRID={{0,1,2,3,2,3,1,0,2,1},{1,3,2,0,2,2,2,3,1,3},{2,3,2,2,1,0,2,3,2,2},{3,0,2,0,2,1,3,0,2,2},{2,2,3,2,2,0,2,2,0,1},{1,2,3,0,2,2,3,0,1,2},{2,2,3,0,2,3,1,2,2,1},{1,3,2,2,2,1,0,0,2,2},{1,2,2,2,3,3,0,0,2,1},{2,2,1,0,3,2,1,2,3,0}};
	private static final Move[] MOVES={new Move("U",-1,0),new Move("D",1,0),new Move("L",0,-1),new Move("R",0,1)};
	@Override protected SolveResult<BooleanMazeOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,BooleanMazeInput input){
		if(input==null||input.display()<0||input.display()>3)return failure("Display must be 0, 1, 2, or 3");String serial=bomb.getSerialNumber();if(serial==null||serial.length()<6)return failure("A six-character serial number is required");
		int startRow=serialValue(serial.charAt(2)),startCol=serialValue(serial.charAt(3));Map<String,Object> state=module.getState();int initialDisplay=state.get("initialDisplay") instanceof Number n?n.intValue():input.display();int[] goal=goal(serial,initialDisplay);
		int row=input.resetPosition()?startRow:state.get("currentRow") instanceof Number n?n.intValue():startRow;int col=input.resetPosition()?startCol:state.get("currentCol") instanceof Number n?n.intValue():startCol;List<Integer> from=List.of(row,col);
		if(row==goal[0]&&col==goal[1]){store(module,initialDisplay,row,col,goal);return success(new BooleanMazeOutput("RESET",from,from,List.of(goal[0],goal[1])));}
		List<Move> legal=new ArrayList<>();for(Move move:MOVES){int nr=row+move.dr(),nc=col+move.dc();if(nr>=0&&nr<10&&nc>=0&&nc<10&&legal(GRID[nr][nc],input.display()))legal.add(move);}
		if(legal.isEmpty()){store(module,initialDisplay,row,col,goal);return success(new BooleanMazeOutput("STUCK",from,from,List.of(goal[0],goal[1])),false);}
		Move chosen=legal.stream().filter(move->move.dr()!=0&&Integer.signum(move.dr())==Integer.signum(goal[0]-row)||move.dc()!=0&&Integer.signum(move.dc())==Integer.signum(goal[1]-col)).findFirst().orElse(legal.getFirst());int nr=row+chosen.dr(),nc=col+chosen.dc();store(module,initialDisplay,nr,nc,goal);return success(new BooleanMazeOutput(chosen.action(),from,List.of(nr,nc),List.of(goal[0],goal[1])),nr==goal[0]&&nc==goal[1]);
	}
	private static void store(ModuleEntity module,int initial,int row,int col,int[] goal){module.setState(new HashMap<>(Map.of("initialDisplay",initial,"currentRow",row,"currentCol",col,"goalRow",goal[0],"goalCol",goal[1])));}
	static boolean legal(int gate,int display){return gate==0?display==0:gate==1?display==1||display==2:gate==2?display!=0:display==3;}
	static int[] goal(String serial,int initialDisplay){int row=serialValue(serial.charAt(4)),col=serialValue(serial.charAt(5));while(GRID[row][col]%3==0){if(initialDisplay==0)row=(row+9)%10;else if(initialDisplay==1)col=(col+1)%10;else if(initialDisplay==2)row=(row+1)%10;else col=(col+9)%10;}return new int[]{row,col};}
	static int serialValue(char value){return Character.isDigit(value)?value-'0':(Character.toUpperCase(value)-'A'+1)%10;}
	private record Move(String action,int dr,int dc){}
}
