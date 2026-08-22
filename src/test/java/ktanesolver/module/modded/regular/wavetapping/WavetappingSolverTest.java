package ktanesolver.module.modded.regular.wavetapping;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class WavetappingSolverTest{
 private final WavetappingSolver solver=new WavetappingSolver();private static final List<String>UNAVAILABLE=List.of("Orange","Chartreuse","Lime","Green","Turquoise","Indigo","Purple","Pink");
 @Test void rendersPatternsAndPersistsSouvenirColors(){BombEntity bomb=new BombEntity();bomb.setSerialNumber("AB1CD2");ModuleEntity module=new ModuleEntity();WavetappingOutput one=solve(bomb,module,new WavetappingInput(1,"Red",UNAVAILABLE,true));assertThat(one.patternNumber()).isEqualTo(1);assertThat(one.rows()).hasSize(9);assertThat(one.pressCommand()).startsWith("press ");WavetappingOutput two=solve(bomb,module,new WavetappingInput(2,"Orange-Yellow",UNAVAILABLE,false));assertThat(two.patternNumber()).isEqualTo(2);assertThat(module.getState().get("wavetappingStageColors")).isEqualTo(List.of("Red","Orange-Yellow"));}
 @SuppressWarnings("unchecked")private WavetappingOutput solve(BombEntity b,ModuleEntity m,WavetappingInput i){return((SolveSuccess<WavetappingOutput>)solver.solve(new RoundEntity(),b,m,i)).output();}
}
