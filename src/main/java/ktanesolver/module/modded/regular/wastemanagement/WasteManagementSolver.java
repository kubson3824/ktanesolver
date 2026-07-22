package ktanesolver.module.modded.regular.wastemanagement;

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
import ktanesolver.module.modded.regular.wastemanagement.WasteManagementInput.TimerBand;
import ktanesolver.module.modded.regular.wastemanagement.WasteManagementOutput.Allocation;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.WASTE_MANAGEMENT,
	id = "waste-management",
	name = "Waste Management",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate how much paper, plastic, metal, and leftover material to recycle or waste.",
	tags = {"materials", "edgework", "time", "stages"}
)
public class WasteManagementSolver extends AbstractModuleSolver<WasteManagementInput, WasteManagementOutput> {
	@Override
	protected SolveResult<WasteManagementOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, WasteManagementInput input
	) {
		if(input == null || input.timerBand() == null) return failure("Select the current timer band");
		if(bomb.getSerialNumber() == null || bomb.getSerialNumber().isBlank()) return failure("The bomb needs a serial number");
		if(input.additionalModuleNames() != null && input.additionalModuleNames().stream().anyMatch(name -> name == null || name.isBlank())) {
			return failure("Additional module names cannot be blank");
		}

		List<String> moduleNames = new ArrayList<>(bomb.getModules().stream()
			.map(other -> other.getType().name().replace('_', ' ')).toList());
		if(input.additionalModuleNames() != null) moduleNames.addAll(input.additionalModuleNames());
		List<String> normalizedNames = moduleNames.stream().map(WasteManagementSolver::normalize).toList();

		int paper = paper(bomb, input.timerBand(), normalizedNames);
		int plastic = plastic(bomb, moduleNames.size());
		int metal = metal(bomb, input.timerBand(), normalizedNames);
		WasteManagementOutput output = new WasteManagementOutput(paper, plastic, metal, allocations(paper, plastic, metal));
		storeState(module, Map.of("input", input, "amounts", List.of(paper, plastic, metal), "allocations", output.allocations()));
		return success(output);
	}

	private static int paper(BombEntity bomb, TimerBand timerBand, List<String> moduleNames) {
		int amount = 0;
		if(bomb.hasIndicator("IND") && bomb.getBatteryCount() < 5) amount += 19;
		if(bomb.hasIndicator("SND")) amount += 15;
		if(bomb.hasPort(PortType.PARALLEL)) amount -= 44;
		if(timerBand != TimerBand.MORE_THAN_HALF && moduleNames.stream().anyMatch(name -> name.contains("morse") || name.equals("simon sends"))) amount -= 26;
		if(bomb.getBatteryCount() == 0 && bomb.getIndicators().size() < 3) amount += 154;

		String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		long consonants = serial.chars().filter(character -> "BCDFGHJKLMNPQRSTVWXYZ".indexOf(character) >= 0).count();
		if(serial.chars().anyMatch(character -> "SAVEMYWORLD".indexOf(character) >= 0) && consonants <= 2) amount += 200;
		return Math.abs(amount);
	}

	private static int plastic(BombEntity bomb, int moduleCount) {
		int amount = 0;
		if(bomb.hasIndicator("TRN") && bomb.getStrikes() != 1) amount += 91;
		if(bomb.hasIndicator("FRK") && bomb.getStrikes() != 2) amount += 69;
		if(BombEdgeworkUtils.hasEmptyPortPlate(bomb) && moduleCount % 2 == 0) amount -= 17;
		if(bomb.hasIndicator("FRQ") && bomb.getDBatteryCount() <= bomb.getAaBatteryCount()) amount += 153;
		return Math.abs(amount);
	}

	private static int metal(BombEntity bomb, TimerBand timerBand, List<String> moduleNames) {
		int amount = 0;
		if(bomb.hasIndicator("BOB")) amount += 199;
		if(bomb.hasIndicator("MSA")) amount += 92;
		if(bomb.hasIndicator("CAR") && !bomb.hasPort(PortType.RJ45)) amount -= 200;
		if(BombEdgeworkUtils.hasDuplicatePorts(bomb) && !bomb.hasPort(PortType.DVI)) amount += 153;
		if(bomb.hasIndicator("SIG") && timerBand != TimerBand.LAST_FIFTH) amount += 99;
		if(moduleNames.contains("forget me not")) {
			amount += bomb.isIndicatorLit("BOB") && BombEdgeworkUtils.getTotalPortCount(bomb) >= 6 ? 99 : -84;
		}
		return Math.abs(amount);
	}

	private static List<Allocation> allocations(int paper, int plastic, int metal) {
		int paperRecycle = 0, paperWaste = 0, plasticRecycle = 0, plasticWaste = 0;
		int metalRecycle = 0, metalWaste = 0, leftoverRecycle = 0, leftoverWaste = 0, leftoverTotal = 0;

		if(paper + plastic + metal > 695) {
			paperRecycle = paper;
			plasticRecycle = plastic;
			metalRecycle = metal;
		} else if(metal > 200) {
			metalRecycle = roundedFraction(metal, 3, 4);
			metalWaste = metal - metalRecycle;
			int[] rest = remainingRules(paper, plastic, 0);
			paperRecycle = rest[0]; paperWaste = rest[1]; plasticRecycle = rest[2]; plasticWaste = rest[3];
			leftoverTotal = rest[4]; leftoverRecycle = rest[5]; leftoverWaste = rest[6];
		} else if(metal < paper) {
			paperRecycle = paper;
			metalWaste = roundedFraction(metal, 1, 4);
			leftoverTotal = plastic + metal - metalWaste;
			leftoverRecycle = roundedFraction(leftoverTotal, 1, 2);
		} else {
			int[] rest = remainingRules(paper, plastic, metal);
			paperRecycle = rest[0]; paperWaste = rest[1]; plasticRecycle = rest[2]; plasticWaste = rest[3];
			leftoverTotal = rest[4]; leftoverRecycle = rest[5]; leftoverWaste = rest[6];
		}

		return List.of(
			allocation("Paper", paper, paperRecycle, paperWaste),
			allocation("Plastic", plastic, plasticRecycle, plasticWaste),
			allocation("Metal", metal, metalRecycle, metalWaste),
			allocation("Leftovers", leftoverTotal, leftoverRecycle, leftoverWaste)
		);
	}

	private static int[] remainingRules(int paper, int plastic, int metal) {
		int paperRecycle = 0, paperWaste = 0, plasticRecycle = 0, plasticWaste = 0;
		boolean recycledHalfPlastic = false;
		if(plastic > 100 && plastic < 300) {
			plasticRecycle = roundedFraction(plastic, 1, 2);
			plastic -= plasticRecycle;
			recycledHalfPlastic = true;
		} else if(plastic > 10 && plastic < 100) {
			plasticWaste = plastic;
			plastic = 0;
		}
		if(paper < 65) {
			if(recycledHalfPlastic) {
				paperRecycle = paper;
				paper = 0;
			} else {
				paperWaste = roundedFraction(paper, 1, 3);
				paper -= paperWaste;
			}
		}
		int leftovers = paper + plastic + metal;
		int leftoverRecycle = leftovers > 100 && leftovers < 300 ? leftovers : 0;
		int leftoverWaste = leftoverRecycle == 0 ? leftovers : 0;
		return new int[] {paperRecycle, paperWaste, plasticRecycle, plasticWaste, leftovers, leftoverRecycle, leftoverWaste};
	}

	private static Allocation allocation(String material, int total, int recycle, int waste) {
		return new Allocation(material, total, recycle, waste, total - recycle - waste);
	}

	private static int roundedFraction(int value, int numerator, int denominator) {
		return (int)Math.round(value * numerator / (double)denominator);
	}

	private static String normalize(String value) {
		return value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
	}
}
