package ktanesolver.module.modded.regular.curriculum;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.curriculum.CurriculumInput.ButtonSchedule;
import ktanesolver.module.modded.regular.curriculum.CurriculumInput.ClassPair;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.CURRICULUM,
	id = "curriculum",
	name = "Curriculum",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose five class sections whose lectures satisfy the bomb's schedule condition.",
	tags = { "schedule", "grid", "edgework", "submit" }
)
public class CurriculumSolver extends AbstractModuleSolver<CurriculumInput, CurriculumOutput> {
	private static final int BUTTONS = 5;
	private static final int SECTIONS = 6;
	private static final int CELLS = 30;

	@Override
	protected SolveResult<CurriculumOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, CurriculumInput input
	) {
		String error = validate(bomb, input);
		if(error != null) return failure(error);

		Condition condition = condition(bomb);
		boolean bookworm = bomb.getStrikes() == 0 && BombEdgeworkUtils.countSolvedModules(bomb) > 0;
		int[] selected = new int[BUTTONS];
		int[] occupancy = new int[CELLS];
		if(!search(0, input.buttons(), bomb.getSerialNumber(), condition, bookworm ? 1 : 0,
			selected, occupancy, 0)) {
			return failure("No valid schedule matches those lecture grids");
		}

		List<Integer> buttonStates = Arrays.stream(selected).map(section -> section + 1).boxed().toList();
		List<Integer> clicks = IntStream.range(0, BUTTONS)
			.map(index -> Math.floorMod(selected[index] - (input.buttons().get(index).currentSection() - 1), SECTIONS))
			.boxed().toList();
		List<String> classes = IntStream.range(0, BUTTONS)
			.mapToObj(index -> input.buttons().get(index).classPair().className(selected[index])).toList();
		List<Integer> classSections = Arrays.stream(selected).map(section -> section % 3 + 1).boxed().toList();
		int conflicts = (int) Arrays.stream(occupancy).filter(count -> count >= 2).count();
		return success(new CurriculumOutput(buttonStates, clicks, classes, classSections,
			condition.label, bookworm, conflicts));
	}

	private static String validate(BombEntity bomb, CurriculumInput input) {
		if(bomb.getSerialNumber() == null || bomb.getSerialNumber().length() < BUTTONS) {
			return "The serial number must contain at least five characters";
		}
		if(input == null || input.buttons() == null || input.buttons().size() != BUTTONS) {
			return "Enter all five buttons";
		}
		EnumSet<ClassPair> pairs = EnumSet.noneOf(ClassPair.class);
		for(ButtonSchedule button : input.buttons()) {
			if(button == null || button.classPair() == null || !pairs.add(button.classPair())) {
				return "Assign each class pair to exactly one button";
			}
			if(button.currentSection() == null || button.currentSection() < 1 || button.currentSection() > SECTIONS) {
				return "Each current section must be between 1 and 6";
			}
			if(button.sections() == null || button.sections().size() != SECTIONS) {
				return "Enter all six sections for each button";
			}
			for(List<Boolean> section : button.sections()) {
				if(section == null || section.size() != CELLS || section.stream().anyMatch(value -> value == null)) {
					return "Each section must contain a complete 5×6 lecture grid";
				}
				long lectures = section.stream().filter(Boolean::booleanValue).count();
				if(lectures < 2 || lectures > 3) return "Each section must contain 2 or 3 lectures";
			}
		}
		return null;
	}

	private static boolean search(
		int buttonIndex, List<ButtonSchedule> buttons, String serial, Condition condition, int allowedConflicts,
		int[] selected, int[] occupancy, int conflicts
	) {
		if(buttonIndex == BUTTONS) return true;
		ButtonSchedule button = buttons.get(buttonIndex);
		int firstSection = even(serial.charAt(button.classPair().serialPosition())) ? 0 : 3;
		for(int section = firstSection; section < firstSection + 3; section++) {
			List<Boolean> cells = button.sections().get(section);
			if(IntStream.range(0, CELLS).anyMatch(cell -> cells.get(cell) && condition.blocks(cell))) continue;

			int nextConflicts = conflicts;
			for(int cell = 0; cell < CELLS; cell++) if(cells.get(cell) && occupancy[cell]++ == 1) nextConflicts++;
			selected[buttonIndex] = section;
			if(nextConflicts <= allowedConflicts && search(buttonIndex + 1, buttons, serial, condition,
				allowedConflicts, selected, occupancy, nextConflicts)) return true;
			for(int cell = 0; cell < CELLS; cell++) if(cells.get(cell)) occupancy[cell]--;
		}
		return false;
	}

	private static boolean even(char character) {
		char upper = Character.toUpperCase(character);
		int value = Character.isDigit(upper) ? upper - '0' : upper - 'A' + 1;
		return value % 2 == 0;
	}

	private static Condition condition(BombEntity bomb) {
		if(bomb.getLastDigit() == 0) return Condition.MATHLETE;
		if(BombEdgeworkUtils.getTotalPortCount(bomb) >= 5) return Condition.PARTY_ANIMAL;
		if(BombEdgeworkUtils.hasEmptyPortPlate(bomb)) return Condition.PART_TIMER;
		if(bomb.getIndicators().isEmpty()) return Condition.SLEEPY_GARY;
		if(bomb.getBatteryCount() >= 3) return Condition.BAND_PRACTICE;
		return Condition.FRESHMAN_YEAR;
	}

	private enum Condition {
		MATHLETE("Mathlete") { @Override boolean blocks(int cell) { return cell / 6 == 1; } },
		PARTY_ANIMAL("Party Animal") { @Override boolean blocks(int cell) { return cell % 6 == 5; } },
		PART_TIMER("Part-Timer") { @Override boolean blocks(int cell) { return cell / 6 >= 3; } },
		SLEEPY_GARY("Sleepy Gary") { @Override boolean blocks(int cell) { return cell % 6 == 0; } },
		BAND_PRACTICE("Band Practice") { @Override boolean blocks(int cell) { return (cell / 6 == 0 || cell / 6 == 2) && cell % 6 >= 3; } },
		FRESHMAN_YEAR("Freshman Year") { @Override boolean blocks(int cell) { return cell / 6 == 4 && cell % 6 >= 3; } };

		private final String label;

		Condition(String label) {
			this.label = label;
		}

		abstract boolean blocks(int cell);
	}
}
