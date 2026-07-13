package ktanesolver.module.modded.regular.thebulb;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.THE_BULB,
	id = "the-bulb",
	name = "The Bulb",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Follow the button and bulb procedure",
	tags = {"bulb", "buttons", "indicators", "modded"}
)
public class TheBulbSolver extends AbstractModuleSolver<TheBulbInput, TheBulbOutput> {
	private static final Set<String> STEP_FOUR_INDICATORS = Set.of("CAR", "IND", "MSA", "SND");

	@Override
	protected SolveResult<TheBulbOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TheBulbInput input) {
		if (input == null) return failure("Input is required");

		int step;
		TheBulbInput.Color color;
		boolean opaque;
		boolean initiallyOn;
		String firstButton = null;
		String secondButton = null;
		String rememberedIndicator = null;
		List<String> actions;
		int continueFrom;

		boolean starting = input.color() != null || input.opaque() != null || input.lightOn() != null;
		if (starting) {
			if (input.color() == null || input.opaque() == null || input.lightOn() == null) {
				return failure("Color, opacity, and initial light state are required");
			}
			color = input.color();
			opaque = input.opaque();
			initiallyOn = input.lightOn();
			storeState(module, "initiallyOn", initiallyOn);
			actions = new ArrayList<>();
			continueFrom = 0;
			if (input.lightOn()) {
				firstButton = opaque ? "O" : "I";
				press(actions, firstButton);
				step = opaque ? 3 : 2;
			} else {
				unscrew(actions);
				step = 4;
			}
		} else {
			if (module.getState() == null || module.getState().isEmpty()) return failure("Start with the bulb's initial appearance");
			if (input.observation() == null) return failure("Answer the displayed observation question");
			TheBulbState state = module.getStateAs(TheBulbState.class, () -> null);
			step = state.step(); color = state.color(); opaque = state.opaque(); initiallyOn = state.initiallyOn();
			firstButton = state.firstButton(); secondButton = state.secondButton(); rememberedIndicator = state.rememberedIndicator();
			actions = new ArrayList<>(state.actions());
			continueFrom = actions.size();
		}

		while (true) {
			switch (step) {
				case 2 -> {
					if (color == TheBulbInput.Color.RED || color == TheBulbInput.Color.WHITE) {
						secondButton = color == TheBulbInput.Color.RED ? "I" : "O";
						press(actions, secondButton); unscrew(actions); step = color == TheBulbInput.Color.RED ? 5 : 6;
					} else { unscrew(actions); step = 7; }
				}
				case 3 -> {
					if (color == TheBulbInput.Color.GREEN || color == TheBulbInput.Color.PURPLE) {
						secondButton = color == TheBulbInput.Color.GREEN ? "I" : "O";
						press(actions, secondButton); unscrew(actions); step = color == TheBulbInput.Color.GREEN ? 6 : 5;
					} else { unscrew(actions); step = 8; }
				}
				case 4 -> {
					boolean hasIndicator = STEP_FOUR_INDICATORS.stream().anyMatch(bomb::hasIndicator);
					press(actions, hasIndicator ? "I" : "O"); step = hasIndicator ? 9 : 10;
				}
				case 5 -> {
					if (input.observation() == null) return pause(module, step, color, opaque, initiallyOn, firstButton, secondButton, null, actions, "Did the light go off at Step 1?");
					press(actions, input.observation() ? firstButton : opposite(firstButton)); screw(actions); return done(actions, continueFrom);
				}
				case 6 -> {
					if (input.observation() == null) return pause(module, step, color, opaque, initiallyOn, firstButton, secondButton, null, actions, "Did the bulb go off when you pressed I?");
					press(actions, input.observation() ? firstButton : secondButton); screw(actions); return done(actions, continueFrom);
				}
				case 7 -> {
					if (color == TheBulbInput.Color.GREEN) { press(actions, "I"); rememberedIndicator = "SIG"; step = 11; }
					else if (color == TheBulbInput.Color.PURPLE) { press(actions, "I"); screw(actions); step = 12; }
					else if (color == TheBulbInput.Color.BLUE) { press(actions, "O"); rememberedIndicator = "CLR"; step = 11; }
					else { press(actions, "O"); screw(actions); step = 13; }
				}
				case 8 -> {
					if (color == TheBulbInput.Color.WHITE) { press(actions, "I"); rememberedIndicator = "FRQ"; step = 11; }
					else if (color == TheBulbInput.Color.RED) { press(actions, "I"); screw(actions); step = 13; }
					else if (color == TheBulbInput.Color.YELLOW) { press(actions, "O"); rememberedIndicator = "FRK"; step = 11; }
					else { press(actions, "O"); screw(actions); step = 12; }
				}
				case 9 -> {
					switch (color) {
						case BLUE -> { press(actions, "I"); step = 14; }
						case GREEN -> { press(actions, "I"); screw(actions); step = 12; }
						case YELLOW -> { press(actions, "O"); step = 15; }
						case WHITE -> { press(actions, "O"); screw(actions); step = 13; }
						case PURPLE -> { screw(actions); press(actions, "I"); step = 12; }
						case RED -> { screw(actions); press(actions, "O"); step = 13; }
					}
				}
				case 10 -> {
					switch (color) {
						case PURPLE -> { press(actions, "I"); step = 14; }
						case RED -> { press(actions, "I"); screw(actions); step = 13; }
						case BLUE -> { press(actions, "O"); step = 15; }
						case YELLOW -> { press(actions, "O"); screw(actions); step = 12; }
						case GREEN -> { screw(actions); press(actions, "I"); step = 13; }
						case WHITE -> { screw(actions); press(actions, "O"); step = 12; }
					}
				}
				case 11 -> { press(actions, bomb.hasIndicator(rememberedIndicator) ? "I" : "O"); screw(actions); return done(actions, continueFrom); }
				case 12 -> {
					if (input.observation() == null) return pause(module, step, color, opaque, initiallyOn, firstButton, secondButton, rememberedIndicator, actions, "Is the light now on?");
					press(actions, input.observation() ? "I" : "O"); return done(actions, continueFrom);
				}
				case 13 -> {
					if (input.observation() == null) return pause(module, step, color, opaque, initiallyOn, firstButton, secondButton, rememberedIndicator, actions, "Is the light now on?");
					press(actions, input.observation() ? "O" : "I"); return done(actions, continueFrom);
				}
				case 14 -> { press(actions, opaque ? "I" : "O"); screw(actions); return done(actions, continueFrom); }
				case 15 -> { press(actions, opaque ? "O" : "I"); screw(actions); return done(actions, continueFrom); }
				default -> { return failure("Invalid saved procedure state"); }
			}
		}
	}

	private SolveResult<TheBulbOutput> pause(ModuleEntity module, int step, TheBulbInput.Color color, boolean opaque, boolean initiallyOn,
		String firstButton, String secondButton, String rememberedIndicator, List<String> actions, String prompt) {
		storeTypedState(module, new TheBulbState(step, color, opaque, initiallyOn, firstButton, secondButton, rememberedIndicator, List.copyOf(actions)));
		return success(new TheBulbOutput(List.copyOf(actions), 0, prompt), false);
	}

	private SolveResult<TheBulbOutput> done(List<String> actions, int continueFrom) {
		return success(new TheBulbOutput(List.copyOf(actions), continueFrom, null));
	}

	private static void press(List<String> actions, String button) { actions.add("Press " + button + "."); }
	private static void unscrew(List<String> actions) { actions.add("Unscrew the bulb."); }
	private static void screw(List<String> actions) { actions.add("Screw the bulb back in."); }
	private static String opposite(String button) { return "I".equals(button) ? "O" : "I"; }
}
