package ktanesolver.module.modded.regular.periodic_table;

import java.util.List;
import java.util.Locale;

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
	type = ModuleType.PERIODIC_TABLE,
	id = "periodicTable",
	name = "Periodic Table",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Combine four colored element clues with bomb edgework.",
	tags = {"elements", "colors", "numbers", "edgework"}
)
public class PeriodicTableSolver extends AbstractModuleSolver<PeriodicTableInput, PeriodicTableOutput> {
	public static final List<String> SYMBOLS = List.of(
		"H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb","Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","I","Xe","Cs","Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"
	);
	public static final List<String> NAMES = List.of(
		"Hydrogen","Helium","Lithium","Beryllium","Boron","Carbon","Nitrogen","Oxygen","Fluorine","Neon","Sodium","Magnesium","Aluminium","Silicon","Phosphorus","Sulphur","Chlorine","Argon","Potassium","Calcium","Scandium","Titanium","Vanadium","Chromium","Manganese","Iron","Cobalt","Nickel","Copper","Zinc","Gallium","Germanium","Arsenic","Selenium","Bromine","Krypton","Rubidium","Strontium","Yttrium","Zirconium","Niobium","Molybdenum","Technetium","Ruthenium","Rhodium","Palladium","Silver","Cadmium","Indium","Tin","Antimony","Tellurium","Iodine","Xenon","Caesium","Barium","Lanthanum","Cerium","Praseodymium","Neodymium","Promethium","Samarium","Europium","Gadolinium","Terbium","Dysprosium","Holmium","Erbium","Thulium","Ytterbium","Lutetium","Hafnium","Tantalum","Tungsten","Rhenium","Osmium","Iridium","Platinum","Gold","Mercury","Thallium","Lead","Bismuth","Polonium","Astatine","Radon","Francium","Radium","Actinium","Thorium","Protactinium","Uranium","Neptunium","Plutonium","Americium","Curium","Berkelium","Californium","Einsteinium","Fermium","Mendelevium","Nobelium","Lawrencium","Rutherfordium","Dubnium","Seaborgium","Borium","Hassium","Meitnerium","Darmstadtium","Roentgenium","Copernicium","Nihonium","Flerovium","Moscovium","Livermorium","Tennessine","Oganesson"
	);

	@Override
	protected SolveResult<PeriodicTableOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PeriodicTableInput input
	) {
		if (input == null || input.elementName() == null || input.symbol() == null || input.elementColor() == null || input.symbolColor() == null || input.numberColor() == null || input.buttonColor() == null) {
			return failure("Enter all four displayed clues and colors");
		}
		int element = numberFor(NAMES, input.elementName());
		int symbol = numberFor(SYMBOLS, input.symbol());
		if (element == 0) return failure("The displayed element name is not recognized");
		if (symbol == 0) return failure("The displayed chemical symbol is not recognized");
		if (!validNumber(input.displayedNumber()) || !validNumber(input.coloredButtonNumber())) {
			return failure("Atomic numbers must be from 1 through 118; starred empty squares do not count");
		}
		if (bomb == null || bomb.getSerialNumber() == null) return failure("Enter the bomb serial number");
		int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		int serialDigits = bomb.getSerialNumber().chars().filter(Character::isDigit).map(character -> character - '0').sum();
		int elementTerm = (element + bomb.getBatteryCount()) * multiplier(input.elementColor());
		int symbolTerm = (symbol + ports) * multiplier(input.symbolColor());
		int numberTerm = (input.displayedNumber() + bomb.getIndicators().size()) * multiplier(input.numberColor());
		int buttonTerm = (input.coloredButtonNumber() + serialDigits) * multiplier(input.buttonColor());
		int total = elementTerm + symbolTerm + numberTerm + buttonTerm;
		int answer = Math.floorMod(total - 1, 118) + 1;
		return success(new PeriodicTableOutput(answer, NAMES.get(answer - 1), SYMBOLS.get(answer - 1), elementTerm, symbolTerm, numberTerm, buttonTerm, total));
	}

	private static boolean validNumber(Integer value) { return value != null && value >= 1 && value <= 118; }
	private static int numberFor(List<String> values, String input) {
		String normalized = input.trim().toLowerCase(Locale.ROOT);
		for (int i = 0; i < values.size(); i++) if (values.get(i).toLowerCase(Locale.ROOT).equals(normalized)) return i + 1;
		return 0;
	}
	private static int multiplier(PeriodicTableInput.Color color) {
		return switch (color) {
			case RED -> 1; case ORANGE -> 2; case YELLOW -> 3; case GREEN -> 4; case BLUE -> 5;
			case WHITE, GREY, GRAY -> 6;
		};
	}
}
