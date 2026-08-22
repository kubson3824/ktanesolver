package ktanesolver.module.modded.regular.graphicmemory;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.graphicmemory.GraphicMemoryInput.Shape;

class GraphicMemorySolverTest {
    private final GraphicMemorySolver solver=new GraphicMemorySolver();
    @Test void acceptsAnyFirstPressThenTracksConditions() {
        ModuleEntity module=new ModuleEntity();
        GraphicMemoryOutput first=solve(module,new GraphicMemoryInput("TL",List.of(new Shape("blue","triangle")),true));
        assertThat(first.pressesCompleted()).isEqualTo(1);assertThat(first.nextValidPositions()).contains("TL");
        assertThat(solver.solve(new RoundEntity(),new BombEntity(),module,new GraphicMemoryInput("BR",List.of(new Shape("red","square")),false))).isInstanceOf(SolveFailure.class);
    }
    @Test void solvesAfterFourValidPresses() {
        ModuleEntity module=new ModuleEntity(); GraphicMemoryOutput output=null;
        for(int i=0;i<4;i++){String position=i==0?"TL":output.nextValidPositions().get(0);output=solve(module,new GraphicMemoryInput(position,List.of(new Shape("red","square")),i==0));}
        assertThat(output.pressesCompleted()).isEqualTo(4);assertThat(output.nextValidPositions()).isEmpty();
    }
    @SuppressWarnings("unchecked") private GraphicMemoryOutput solve(ModuleEntity module,GraphicMemoryInput input){return ((SolveSuccess<GraphicMemoryOutput>)solver.solve(new RoundEntity(),new BombEntity(),module,input)).output();}
}
