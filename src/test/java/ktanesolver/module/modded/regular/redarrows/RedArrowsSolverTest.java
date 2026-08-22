package ktanesolver.module.modded.regular.redarrows;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class RedArrowsSolverTest {
    @Test void findsAValidShortestPathAndStoresTheStartingNumber() {
        BombEntity bomb=new BombEntity();bomb.setSerialNumber("ABC123");ModuleEntity module=new ModuleEntity();
        @SuppressWarnings("unchecked") RedArrowsOutput output=((SolveSuccess<RedArrowsOutput>)new RedArrowsSolver().solve(new RoundEntity(),bomb,module,new RedArrowsInput(7))).output();
        assertThat(output.destinationNumber()).isEqualTo(3);assertThat(output.command()).matches("[udlr]+");assertThat(output.directions()).hasSize(output.command().length());assertThat(module.getState()).containsEntry("redArrowsStartingNumber",7);
    }
}
