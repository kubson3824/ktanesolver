package ktanesolver.module.modded.regular.dividedsquares;
import java.util.*;import org.springframework.stereotype.Service;import ktanesolver.annotation.ModuleInfo;import ktanesolver.dto.ModuleCatalogDto;import ktanesolver.entity.*;import ktanesolver.enums.*;import ktanesolver.logic.*;
@Service@ModuleInfo(type=ModuleType.DIVIDED_SQUARES,id="DividedSquaresModule",name="Divided Squares",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,description="Find the serial-pair square and the exact solved-module count.",tags={"grid","colors","serial-number","boss"})
public class DividedSquaresSolver extends AbstractModuleSolver<DividedSquaresInput,DividedSquaresOutput>{
	static final int[][] TABLE={{-1,9,4,2,10,6},{20,-1,13,7,19,22},{21,25,-1,1,29,5},{14,24,16,-1,3,18},{12,27,0,23,-1,26},{11,15,28,17,8,-1}};
	private static final Set<ModuleType> IGNORED=Set.of(ModuleType.DIVIDED_SQUARES,ModuleType.FORGET_ME_NOT,ModuleType.FORGET_EVERYTHING,ModuleType.TURN_THE_KEY,ModuleType.THE_TIME_KEEPER,ModuleType.SOUVENIR,ModuleType.THE_SWAN);
	@Override protected SolveResult<DividedSquaresOutput>doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,DividedSquaresInput input){
		if(input==null||input.grid()==null||input.grid().isEmpty()||input.grid().size()>13)return failure("Enter a square grid from 1×1 through 13×13");int n=input.grid().size();
		if(input.grid().stream().anyMatch(row->row==null||row.size()!=n||row.stream().anyMatch(Objects::isNull)))return failure("Every grid row must contain exactly "+n+" colors");
		Set<Integer> serialValues=new HashSet<>();String serial=bomb.getSerialNumber()==null?"":bomb.getSerialNumber().toUpperCase(Locale.ROOT);serial.chars().filter(Character::isLetter).distinct().forEach(ch->serialValues.add(ch-'A'+1));
		int correct=0,pairs=0;if(n>1){correct=-1;for(int i=0;i<n*n;i++){int count=matchingPairs(input.grid(),i,serialValues);if(count>1){if(correct>=0)return failure("The grid has more than one square belonging to multiple serial-letter pairs");correct=i;pairs=count;}}if(correct<0)return failure("No square belongs to multiple serial-letter pairs");}
		String square=""+(char)('A'+correct%n)+(correct/n+1);if(input.examinedColor()==null)return success(new DividedSquaresOutput(square,"examine",null,false,pairs),false);
		DividedSquaresInput.Color a=input.grid().get(correct/n).get(correct%n),b=input.examinedColor();int value=TABLE[b.ordinal()][a.ordinal()];if(value<0)return failure("The examined color must differ from the visible color");int target=value+n*n-1;
		long current=bomb.getModules().stream().filter(ModuleEntity::isSolved).count(),other=bomb.getModules().stream().filter(m->m.getType()==null||!IGNORED.contains(m.getType())).count();boolean any=target<current||target>other;
		storeState(module,"dividedSquaresColorB",label(b));storeState(module,"dividedSquaresSouvenirEligible",!any);storeState(module,"dividedSquaresCorrectSquare",square);storeState(module,"dividedSquaresSideLength",n);
		return success(new DividedSquaresOutput(square,"submit",any?null:target,any,pairs));
	}
	static int matchingPairs(List<List<DividedSquaresInput.Color>>grid,int index,Set<Integer>serialValues){int n=grid.size(),x=index%n,y=index/n,count=0;if(x>0&&serialValues.contains(lookup(grid.get(y).get(x-1),grid.get(y).get(x))))count++;if(x<n-1&&serialValues.contains(lookup(grid.get(y).get(x),grid.get(y).get(x+1))))count++;if(y>0&&serialValues.contains(lookup(grid.get(y-1).get(x),grid.get(y).get(x))))count++;if(y<n-1&&serialValues.contains(lookup(grid.get(y).get(x),grid.get(y+1).get(x))))count++;return count;}
	static int lookup(DividedSquaresInput.Color a,DividedSquaresInput.Color b){return TABLE[b.ordinal()][a.ordinal()];}
	private static String label(DividedSquaresInput.Color c){String s=c.name().toLowerCase(Locale.ROOT);return Character.toUpperCase(s.charAt(0))+s.substring(1);}
}
