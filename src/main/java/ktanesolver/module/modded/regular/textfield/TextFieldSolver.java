package ktanesolver.module.modded.regular.textfield;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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
import ktanesolver.module.modded.regular.textfield.TextFieldOutput.Position;

@Service
@ModuleInfo(
	type = ModuleType.TEXT_FIELD,
	id = "TextField",
	name = "Text Field",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the displayed letter and bomb edgework to identify every button to press.",
	tags = {"letters", "grid", "edgework"}
)
public class TextFieldSolver extends AbstractModuleSolver<TextFieldInput, TextFieldOutput> {
	private static final Map<String, String> TABLES = Map.of(
		"FB01", "DCFABEFFBBBC",
		"965A", "CBEFEBFEDCAA",
		"1459", "BABBCDFDDFCE",
		"BBFF", "DABFDFBECEBA",
		"DC52", "CBDEAFDCBEBD",
		"7F67", "ADCBACBCAEFA",
		"A0C1", "ECFACFBDFFBC",
		"AA12", "BEABEDFABCEC"
	);

	@Override
	protected SolveResult<TextFieldOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TextFieldInput input
	) {
		if (input == null || input.displayedLetter() == null) return failure("Select the displayed letter");
		String displayedLetter = input.displayedLetter().trim().toUpperCase(Locale.ROOT);
		if (!displayedLetter.matches("[A-F]")) return failure("Displayed letter must be A through F");

		String tableName = tableName(displayedLetter.charAt(0), bomb);
		String table = TABLES.get(tableName);
		List<Position> positions = new ArrayList<>();
		for (int index = 0; index < table.length(); index++) {
			if (table.charAt(index) == displayedLetter.charAt(0)) positions.add(new Position(index % 4 + 1, index / 4 + 1));
		}
		storeState(module, "displayedLetter", displayedLetter);
		return success(new TextFieldOutput(tableName, List.copyOf(positions)));
	}

	private static String tableName(char letter, BombEntity bomb) {
		int batteries = bomb.getBatteryCount();
		return switch (letter) {
			case 'A' -> bomb.isIndicatorLit("CLR") ? "1459" : batteries > 2 ? "BBFF" : batteries == 1 ? "7F67" : bomb.isIndicatorLit("FRK") ? "DC52" : "A0C1";
			case 'B' -> batteries == 0 ? "965A" : bomb.isLastDigitOdd() ? "1459" : !bomb.hasPort(PortType.SERIAL) ? "DC52" : bomb.isIndicatorLit("TRN") ? "A0C1" : "7F67";
			case 'C' -> bomb.hasPort(PortType.DVI) ? "AA12" : batteries == 2 ? "FB01" : !bomb.serialHasVowel() ? "DC52" : bomb.isIndicatorLit("CAR") ? "1459" : "7F67";
			case 'D' -> bomb.hasPort(PortType.PARALLEL) ? "FB01" : batteries < 2 ? "AA12" : bomb.isIndicatorLit("SIG") ? "BBFF" : !bomb.hasPort(PortType.PS2) ? "965A" : "1459";
			case 'E' -> batteries < 3 ? "7F67" : !bomb.hasPort(PortType.STEREO_RCA) ? "AA12" : bomb.isIndicatorLit("BOB") ? "A0C1" : bomb.hasPort(PortType.RJ45) ? "BBFF" : "DC52";
			default -> !bomb.hasPort(PortType.SERIAL) ? "DC52" : bomb.serialHasVowel() ? "A0C1" : bomb.isIndicatorLit("IND") ? "1459" : bomb.isLastDigitEven() ? "FB01" : "AA12";
		};
	}
}
