package ktanesolver.module.modded.regular.faultysink;

import static ktanesolver.module.modded.regular.faultysink.FaultySinkInput.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class FaultySinkSolverTest {
	@Test void appliesTheBlueDrainDoubleInversionFromSource() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC1D2");
		FaultySinkInput input = new FaultySinkInput(Fault.BLUE_DRAIN, Material.COPPER, Material.STAINLESS_STEEL, Material.PVC, null, null, null, Rotation.NONE, null, 0);
		assertThat(solve(bomb,input).actions()).containsExactly("COLD","HOT","COLD");
	}
	@Test void repairsPinkTextureBeforeUsingTheBaseSequence() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("BCD1F2");
		FaultySinkInput input = new FaultySinkInput(Fault.PINK_TEXTURE, Material.COPPER, Material.STAINLESS_STEEL, Material.COPPER, Control.HOT, Control.PIPE, null, Rotation.NONE, null, 0);
		assertThat(solve(bomb,input).actions()).startsWith("PIPE","HOT").hasSize(5);
	}
	@Test void reversesBothConditionsAndInputOrderWhenUpsideDown() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC1D2");
		FaultySinkInput input = new FaultySinkInput(Fault.UPSIDE_DOWN, Material.COPPER, Material.STAINLESS_STEEL, Material.COPPER, null, null, null, Rotation.NONE, null, 0);
		assertThat(solve(bomb,input).actions()).containsExactly("COLD","COLD","HOT");
	}
	@Test void reversesTheFullSequenceForRotationRuleOne() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC1D2");
		FaultySinkInput input = new FaultySinkInput(Fault.ALL_BLACK, null, null, null, null, null, Control.FAUCET, Rotation.AFTER_THREE_CORRECT, null, 0);
		assertThat(solve(bomb,input).actions()).containsExactly("COLD","COLD","FAUCET");
	}
	@Test void rejectsAnInactiveSpinnerOnTheAllBlackFault() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC1D2");
		FaultySinkInput input = new FaultySinkInput(Fault.ALL_BLACK, null, null, null, null, null, Control.FAUCET, Rotation.COUNTERCLOCKWISE, Control.HOT, 1);
		ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>());
		SolveResult<FaultySinkOutput> result = new FaultySinkSolver().solve(new RoundEntity(), bomb, module, input);
		assertThat(result).isInstanceOf(SolveFailure.class);
	}
	@SuppressWarnings("unchecked") private static FaultySinkOutput solve(BombEntity bomb, FaultySinkInput input){ModuleEntity m=new ModuleEntity();m.setState(new HashMap<>());m.setSolution(new HashMap<>());return ((SolveSuccess<FaultySinkOutput>)new FaultySinkSolver().solve(new RoundEntity(),bomb,m,input)).output();}
}
