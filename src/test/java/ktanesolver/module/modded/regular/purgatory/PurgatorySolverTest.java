package ktanesolver.module.modded.regular.purgatory;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.purgatory.PurgatoryOutput.Destination;
import ktanesolver.module.modded.regular.purgatory.PurgatoryOutput.Timing;

class PurgatorySolverTest {
    private final PurgatorySolver solver = new PurgatorySolver();
    @Test void appliesVowelAndNoVowelTables() {
        BombEntity vowel = bomb("ABC123"); vowel.setAaBatteryCount(2);
        assertThat(solve(vowel, new PurgatoryInput(1,"red","Ada",false)).destination()).isEqualTo(Destination.HELL);
        BombEntity consonants = bomb("BCD123"); consonants.setAaBatteryCount(2);
        PurgatoryOutput repeated = solve(consonants, new PurgatoryInput(2,"blue","Anne",false));
        assertThat(repeated.destination()).isEqualTo(Destination.EITHER); assertThat(repeated.clickCount()).isEqualTo(6);
    }
    @Test void yellowUsesCurrentStrikeColumnAndWaits() {
        BombEntity bomb=bomb("BCD123");bomb.setStrikes(1);bomb.setAaBatteryCount(4);
        PurgatoryOutput output=solve(bomb,new PurgatoryInput(3,"yellow","X",false));
        assertThat(output.destination()).isEqualTo(Destination.HELL);assertThat(output.timing()).isEqualTo(Timing.AT_END);
    }
    @SuppressWarnings("unchecked") private PurgatoryOutput solve(BombEntity bomb,PurgatoryInput input){return ((SolveSuccess<PurgatoryOutput>)solver.solve(new RoundEntity(),bomb,new ModuleEntity(),input)).output();}
    private static BombEntity bomb(String serial){BombEntity bomb=new BombEntity();bomb.setSerialNumber(serial);return bomb;}
}
