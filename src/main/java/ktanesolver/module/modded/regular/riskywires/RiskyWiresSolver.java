package ktanesolver.module.modded.regular.riskywires;

import java.util.ArrayList;
import java.util.EnumMap;
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
import ktanesolver.module.modded.regular.riskywires.RiskyWiresInput.LedColor;
import ktanesolver.module.modded.regular.riskywires.RiskyWiresInput.WireColor;

@Service
@ModuleInfo(type = ModuleType.RISKY_WIRES, id = "riskyWires", name = "Risky Wires",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "After revealing the wires, evaluate the rule for every visible wire and submit the required cuts.",
	tags = {"wires", "gamble", "colors", "edgework"})
public class RiskyWiresSolver extends AbstractModuleSolver<RiskyWiresInput, RiskyWiresOutput> {
	@Override protected SolveResult<RiskyWiresOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, RiskyWiresInput input) {
		if (input == null || input.idNumber() == null || !input.idNumber().matches("\\d{4}") || input.topLed() == null || input.bottomLed() == null || input.wireColors() == null
			|| !(input.wireColors().size() >= 1 && input.wireColors().size() <= 6 || input.wireColors().size() == 8) || input.wireColors().stream().anyMatch(c -> c == null))
			return failure("Enter the four-digit ID, both LEDs, and all 1–6 or 8 revealed wire colors");
		if (input.wireColors().size() == 8 && (input.failedGambleAttempt() < 1 || input.failedGambleAttempt() > 6)) return failure("Enter which gamble attempt failed (1–6)");
		Context context = new Context(bomb, input); List<Integer> cuts = new ArrayList<>();
		for (int i = 0; i < input.wireColors().size(); i++) if (context.cut(i)) cuts.add(i + 1);
		return success(new RiskyWiresOutput(List.copyOf(cuts), context.reverseSix, context.shiftEight));
	}

	private static final class Context {
		final BombEntity bomb; final RiskyWiresInput input; final List<WireColor> wires; final int count; final int[] id;
		final boolean reverseSix, shiftEight; final String serial;
		Context(BombEntity bomb, RiskyWiresInput input) {
			this.bomb = bomb; this.input = input; wires = input.wireColors(); count = wires.size(); id = input.idNumber().chars().map(c -> c - '0').toArray();
			serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
			reverseSix = count == 6 && input.topLed() == LedColor.RED && input.bottomLed() == LedColor.RED;
			shiftEight = count == 8 && (id[0] == 4 || id[0] == 7);
		}
		boolean cut(int physical) {
			int rule = reverseSix ? 5 - physical : shiftEight ? (physical + 7) % 8 : physical;
			return switch (rule) {
				case 0 -> first(); case 1 -> second(); case 2 -> third(); case 3 -> fourth();
				case 4 -> fifth(); case 5 -> sixth(physical); case 6 -> seventh(); case 7 -> eighth(); default -> false;
			};
		}
		boolean first() { return switch (count) {
			case 1 -> wires.get(0) == WireColor.RED || wires.get(0) == WireColor.YELLOW;
			case 2 -> serial.chars().anyMatch(c -> "AEIOU".indexOf(c) >= 0);
			case 3 -> wires.get(1) == WireColor.RED || wires.get(2) == WireColor.RED;
			case 4 -> bomb.getBatteryCount() >= 3 && id[0] < 5;
			case 5 -> List.of(WireColor.YELLOW, WireColor.GREEN).contains(wires.get(2)) || List.of(WireColor.YELLOW, WireColor.GREEN).contains(wires.get(4));
			case 6 -> cut(2) && cut(4);
			case 8 -> input.failedGambleAttempt() == 2 || input.failedGambleAttempt() == 3;
			default -> false;
		}; }
		boolean second() { return switch (count) {
			case 2 -> id[1] % 2 == 0; case 3 -> serial.indexOf('2') >= 0 || serial.indexOf('5') >= 0;
			case 4 -> wires.contains(WireColor.BLUE);
			case 5 -> input.topLed() == LedColor.GREEN && input.bottomLed() == LedColor.GREEN || input.topLed() == LedColor.RED && input.bottomLed() == LedColor.OFF;
			case 6 -> bomb.getBatteryCount() >= 2 && bomb.getAaBatteryCount() == 0;
			case 8 -> !wires.contains(WireColor.YELLOW); default -> false;
		}; }
		boolean third() { return switch (count) {
			case 3 -> java.util.Arrays.stream(id).filter(n -> n % 2 == 0).count() >= 3;
			case 4 -> bomb.getDBatteryCount() > 0 && (input.topLed() != LedColor.OFF || input.bottomLed() != LedColor.OFF);
			case 5 -> bomb.isLastDigitEven(); case 6 -> wires.stream().filter(WireColor.BLUE::equals).count() == 2;
			case 8 -> (input.topLed() == LedColor.GREEN || input.bottomLed() == LedColor.GREEN) && (serial.indexOf('3') >= 0 || java.util.Arrays.stream(id).anyMatch(n -> n == 3));
			default -> false;
		}; }
		boolean fourth() { long lit = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count(), unlit = bomb.getIndicators().size() - lit; return switch (count) {
			case 4 -> serial.chars().filter(Character::isLetter).count() >= 4; case 5 -> unlit > lit;
			case 6 -> bomb.isIndicatorLit("FRK") || bomb.isIndicatorLit("BOB") || wires.stream().filter(WireColor.PURPLE::equals).count() >= 3;
			case 8 -> bomb.isIndicatorUnlit("SND") || bomb.isIndicatorUnlit("NSA") || input.topLed() == LedColor.OFF; default -> false;
		}; }
		boolean fifth() { return switch (count) {
			case 5 -> bomb.hasPort(PortType.SERIAL) && input.topLed() != LedColor.RED && input.bottomLed() != LedColor.RED;
			case 6 -> duplicatePort() || id[3] % 2 == 0; case 8 -> java.util.Arrays.stream(id).sum() < 17; default -> false;
		}; }
		boolean sixth(int physical) {
			if (count == 6) return input.topLed() != input.bottomLed(); if (count != 8) return false;
			int needed = 0, cutoff = shiftEight ? 6 : 5; for (int i = 0; i < cutoff; i++) if (cut(i)) needed++; for (int i = cutoff + 1; i < count; i++) if (cut(i)) needed++;
			return needed >= 4;
		}
		boolean seventh() { return count == 8 && (bomb.hasPort(PortType.PS2) || bomb.hasPort(PortType.STEREO_RCA) || bomb.hasPort(PortType.RJ45)); }
		boolean eighth() { int wire = shiftEight ? 0 : 7; return count == 8 && wires.get(wire) != WireColor.RED && input.topLed() != LedColor.RED && input.bottomLed() != LedColor.RED; }
		boolean duplicatePort() { Map<PortType, Integer> counts = new EnumMap<>(PortType.class); bomb.getPortPlates().forEach(plate -> plate.getPorts().forEach(port -> counts.merge(port, 1, Integer::sum))); return counts.values().stream().anyMatch(n -> n > 1); }
	}
}
