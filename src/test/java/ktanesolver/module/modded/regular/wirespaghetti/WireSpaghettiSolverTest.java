package ktanesolver.module.modded.regular.wirespaghetti;
import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;import java.util.HashMap;import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;import ktanesolver.entity.ModuleEntity;import ktanesolver.entity.RoundEntity;import ktanesolver.enums.ModuleType;import ktanesolver.logic.SolveFailure;import ktanesolver.logic.SolveSuccess;
class WireSpaghettiSolverTest{
	private final WireSpaghettiSolver solver=new WireSpaghettiSolver();
	@Test void appliesTriggeredSwapsInSourceOrderAndRepeatsDuplicateAliases(){BombEntity bomb=bomb();bomb.setAaBatteryCount(2);List<String>wires=List.of("PURPLE","LIME","DARK RED","WHITE","GREEN","ORANGE","BLUE","YELLOW","LIGHT RED","BLACK","DARK GREY","PINK","AQUA","BROWN","LIGHT GREY","PURPLE");WireSpaghettiOutput out=success(bomb,wires);assertThat(out.colors()).containsExactly("BLUE","AQUA","DARK RED","BROWN","BLACK","ORANGE","PURPLE","PURPLE","DARK GREY","LIGHT RED","GREEN","YELLOW","PINK","LIME","WHITE","LIGHT GREY");assertThat(out.aliases()).containsExactly("b","a","dr","r","k","o","p","p","dg","lr","g","y","i","l","w","lg");}
	@Test void returnsEveryParserAliasForTheBaseColorSet(){WireSpaghettiOutput out=success(bomb(),WireSpaghettiSolver.BASE);assertThat(out.aliases()).containsExactlyInAnyOrder("p","l","dr","w","g","o","b","y","lr","k","dg","i","a","r","lg");}
	@Test void validatesWireCountAndColors(){assertThat(solver.solve(new RoundEntity(),bomb(),module(),new WireSpaghettiInput(List.of()))).isInstanceOf(SolveFailure.class);assertThat(solver.solve(new RoundEntity(),bomb(),module(),new WireSpaghettiInput(List.of("CYAN")))).isInstanceOf(SolveFailure.class);}
	private WireSpaghettiOutput success(BombEntity b,List<String>w){return((SolveSuccess<WireSpaghettiOutput>)solver.solve(new RoundEntity(),b,module(),new WireSpaghettiInput(w))).output();}
	private static BombEntity bomb(){BombEntity b=new BombEntity();b.setIndicators(new HashMap<>());b.setPortPlates(new ArrayList<>());return b;}private static ModuleEntity module(){ModuleEntity m=new ModuleEntity();m.setType(ModuleType.WIRE_SPAGHETTI);m.setState(new HashMap<>());m.setSolution(new HashMap<>());return m;}
}
