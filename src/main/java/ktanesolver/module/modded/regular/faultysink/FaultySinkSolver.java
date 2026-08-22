package ktanesolver.module.modded.regular.faultysink;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.faultysink.FaultySinkInput.Control;
import ktanesolver.module.modded.regular.faultysink.FaultySinkInput.Fault;
import ktanesolver.module.modded.regular.faultysink.FaultySinkInput.Material;
import ktanesolver.module.modded.regular.faultysink.FaultySinkInput.Rotation;

@Service
@ModuleInfo(type = ModuleType.FAULTY_SINK, id = "FaultySink", name = "Faulty Sink",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Repair the visible sink fault, follow the inherited Sink conditionals, and recover from endless rotation.",
	tags = {"sink", "faults", "materials", "sequence"})
public class FaultySinkSolver extends AbstractModuleSolver<FaultySinkInput, FaultySinkOutput> {
	private static final int[][] RULES = {{1,0,3},{2,5,1},{4,2,0},{4,5,3}};

	@Override protected SolveResult<FaultySinkOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, FaultySinkInput input) {
		if (input == null || input.fault() == null || input.rotation() == null) return failure("Select the visible sink fault and rotation status");
		if (input.fault() == Fault.BLACK_DRAIN) return result(List.of("HOT", "BASIN"), "Turn Hot, then select the basin.");
		List<String> sequence = baseSequence(bomb, input);
		if (sequence == null) return failure(validation(input));
		if (input.rotation() == Rotation.AFTER_THREE_CORRECT) { List<String> reversed = new ArrayList<>(sequence); Collections.reverse(reversed); return result(reversed, "The knob began spinning after all three correct turns; enter the three Sink controls in reverse."); }
		if (input.rotation() != Rotation.NONE) {
			Control hot = input.fault() == Fault.ALL_BLACK ? input.hotReplacement() : Control.HOT;
			if ((input.spinningControl() != Control.COLD && input.spinningControl() != hot) || input.completedCorrectKnobs() < 1 || input.completedCorrectKnobs() > 3)
				return failure("For a spinning knob, enter whether Cold or the active Hot control spins and its position (1–3) in the correct sequence");
			List<String> actions = new ArrayList<>();
			if (input.rotation() == Rotation.CLOCKWISE) actions.add("HOLD " + input.spinningControl().name() + " 3–5 SECONDS");
			else actions.add(opposite(input.spinningControl(), input));
			actions.addAll(sequence.subList(input.completedCorrectKnobs(), sequence.size()));
			return result(actions, input.rotation() == Rotation.CLOCKWISE ? "Hold the spinning control for 3–5 seconds, release it, then continue the remaining Sink sequence." : "Select the control opposite the counter-clockwise spinner, then continue the remaining Sink sequence.");
		}
		List<String> actions = new ArrayList<>();
		if (input.fault() == Fault.PINK_TEXTURE) { actions.add(input.textureSource().name()); actions.add(input.missingKnob().name()); }
		actions.addAll(sequence);
		return result(actions, input.fault() == Fault.PINK_TEXTURE ? "Copy the matching material to the pink knob, then enter the three Sink controls." : "Enter the three Sink controls in order. If a knob begins spinning, report its direction before continuing.");
	}

	private static List<String> baseSequence(BombEntity bomb, FaultySinkInput input) {
		Material knobs = input.knobMaterial(), faucet = input.faucetMaterial(), pipe = input.pipeMaterial();
		if (input.fault() == Fault.ALL_BLACK) { knobs = Material.COPPER; faucet = Material.COPPER; pipe = Material.PVC; }
		if (input.fault() == Fault.BLUE_DRAIN) pipe = Material.PVC;
		if (knobs == null || faucet == null || pipe == null || knobs == Material.PVC || faucet == Material.PVC) return null;
		if (input.fault() == Fault.PINK_TEXTURE) {
			if ((input.missingKnob() != Control.COLD && input.missingKnob() != Control.HOT) || (input.textureSource() != Control.FAUCET && input.textureSource() != Control.PIPE)) return null;
			Material source = input.textureSource() == Control.FAUCET ? faucet : pipe;
			if (source != knobs || (faucet == knobs) == (pipe == knobs)) return null;
		}
		if (input.fault() == Fault.ALL_BLACK && input.hotReplacement() != Control.FAUCET && input.hotReplacement() != Control.PIPE) return null;
		boolean[] conditions = {
			bomb.isIndicatorUnlit("NSA"), bomb.serialHasVowel(), knobs == Material.GOLD_PLATED,
			faucet == Material.STAINLESS_STEEL, pipe == Material.COPPER,
			bomb.hasPort(PortType.HDMI) || bomb.hasPort(PortType.RJ45)
		};
		if (input.fault() == Fault.BLUE_DRAIN) { conditions[4] = false; invert(conditions); }
		if (input.fault() == Fault.ALL_BLACK) conditions[2] = conditions[3] = conditions[4] = false;
		int bucket = Math.min(bomb.getBatteryCount() / 2, 3);
		if (bucket == 1 || bucket == 2) invert(conditions);
		int[] selected = RULES[bucket];
		if (input.fault() == Fault.UPSIDE_DOWN) {
			boolean[] reversed = new boolean[6]; for (int i=0;i<6;i++) reversed[i] = conditions[5-i]; conditions = reversed;
			selected = RULES[3-bucket];
		}
		List<String> result = new ArrayList<>();
		for (int rule : selected) result.add(control(conditions[rule], input).name());
		if (input.fault() == Fault.UPSIDE_DOWN) Collections.reverse(result);
		return List.copyOf(result);
	}

	private static Control control(boolean hot, FaultySinkInput input) { return hot ? input.fault() == Fault.ALL_BLACK ? input.hotReplacement() : Control.HOT : Control.COLD; }
	private static String opposite(Control spinning, FaultySinkInput input) {
		Control hot = input.fault() == Fault.ALL_BLACK ? input.hotReplacement() : Control.HOT;
		if (spinning == Control.COLD) return hot.name(); if (spinning == hot) return Control.COLD.name(); return "INVALID";
	}
	private static void invert(boolean[] values) { for (int i=0;i<values.length;i++) values[i] = !values[i]; }
	private static String validation(FaultySinkInput input) { return input.fault() == Fault.PINK_TEXTURE ? "Enter the intact knob material and the unique matching faucet/pipe source for the pink knob" : input.fault() == Fault.ALL_BLACK ? "Use Highlight to identify whether the faucet or pipe replaces Hot" : "Enter the knob, faucet, and drain-pipe materials"; }
	private SolveResult<FaultySinkOutput> result(List<String> actions, String instruction) {
		String twitch = actions.stream().allMatch(x -> x.matches("COLD|HOT|FAUCET|PIPE|BASIN")) ? String.join(" ", actions).toLowerCase() : "";
		return success(new FaultySinkOutput(List.copyOf(actions), instruction, twitch));
	}
}
