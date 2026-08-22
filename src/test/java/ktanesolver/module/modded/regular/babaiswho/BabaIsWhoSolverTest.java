package ktanesolver.module.modded.regular.babaiswho;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Attribute;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Button;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Character;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Rule;

class BabaIsWhoSolverTest {
	@Test
	void appliesFirstMatchingCombinedRule() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("AB1C23"); bomb.setAaBatteryCount(5);
		List<Rule> rules = List.of(new Rule(Character.BABA, Attribute.YOU), new Rule(Character.KEKE, Attribute.MOVE), new Rule(Character.ME, Attribute.DEFEAT), new Rule(Character.ROCK, Attribute.PUSH), new Rule(Character.FLAG, Attribute.WIN), new Rule(Character.WALL, Attribute.STOP));
		List<Button> buttons = List.of(new Button(Character.BABA, Attribute.DEFEAT), new Button(Character.KEKE, Attribute.YOU), new Button(Character.ME, Attribute.MOVE), new Button(Character.ROCK, Attribute.PUSH), new Button(Character.FLAG, Attribute.WIN), new Button(Character.WALL, Attribute.STOP));
		var result = new BabaIsWhoSolver().solve(new RoundEntity(), bomb, new ModuleEntity(), new BabaIsWhoInput(rules, buttons));
		assertThat(result).isInstanceOf(SolveSuccess.class);
		BabaIsWhoOutput output = (BabaIsWhoOutput) ((SolveSuccess<?>) result).output();
		assertThat(output.appliedRule()).isEqualTo(1);
		assertThat(output.position()).isEqualTo(4);
		assertThat(output.character()).isEqualTo(Character.ROCK);
		assertThat(output.defeatShifted()).isFalse();
	}
}
