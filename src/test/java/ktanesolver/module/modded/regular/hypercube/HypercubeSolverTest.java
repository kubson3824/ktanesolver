package ktanesolver.module.modded.regular.hypercube;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class HypercubeSolverTest{
 private final HypercubeSolver solver=new HypercubeSolver();
 @Test void mapsRotationFaceOrderAndCurrentColors(){List<String>colors=new ArrayList<>(java.util.Collections.nCopies(16,"Red"));colors.set(5,"Blue");ModuleEntity module=new ModuleEntity();var out=((SolveSuccess<HypercubeOutput>)solver.solve(new RoundEntity(),new BombEntity(),module,new HypercubeInput(List.of("XY","XY","XY","XY","WZ"),1,colors))).output();assertThat(out.face()).isEqualTo("back-right");assertThat(out.targetColor()).isEqualTo("BLUE");assertThat(out.vertex()).isEqualTo("zig-bottom-back-right");assertThat(module.getState().get("hypercubeRotations")).isEqualTo(List.of("XY","XY","XY","XY","WZ"));}
 @Test void rejectsAmbiguousFaceColors(){assertThat(solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new HypercubeInput(List.of("XY","XY","XY","XY","XY"),1,java.util.Collections.nCopies(16,"Green")))).isInstanceOf(SolveFailure.class);}
}
