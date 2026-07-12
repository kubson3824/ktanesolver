package ktanesolver.module.modded.regular.gamepad;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

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

@Service
@ModuleInfo(
	type = ModuleType.GAMEPAD,
	id = "gamepad",
	name = "The Gamepad",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine and enter the eight-button cheat code from two displayed numbers.",
	tags = {"gamepad", "numbers", "sequence"}
)
public class GamepadSolver extends AbstractModuleSolver<GamepadInput, GamepadOutput> {
	private static final Set<Integer> HIGHLY_COMPOSITE = Set.of(1, 2, 4, 6, 12, 24, 36, 48, 60);

	@Override
	protected SolveResult<GamepadOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, GamepadInput input) {
		if(input == null || input.x() < 0 || input.x() > 99 || input.y() < 0 || input.y() > 99) {
			return failure("Gamepad requires two numbers from 00 to 99");
		}

		int x = input.x();
		int y = input.y();
		int a = x / 10;
		int b = x % 10;
		int c = y / 10;
		int d = y % 10;
		List<String> sequence = new ArrayList<>(firstCommand(bomb, x, y, a, b, c, d));
		sequence.addAll(secondCommand(bomb, x, y, a, b, c, d));

		if(x % 11 == 0) {
			Collections.swap(sequence, 0, 1);
			Collections.swap(sequence, 4, 6);
		}
		if(a == 1 + d) {
			Collections.swap(sequence, 2, 3);
			Collections.swap(sequence, 5, 7);
		}
		if(HIGHLY_COMPOSITE.contains(x) || HIGHLY_COMPOSITE.contains(y)) {
			sequence = new ArrayList<>(List.of(
				sequence.get(4), sequence.get(5), sequence.get(6), sequence.get(7),
				sequence.get(0), sequence.get(1), sequence.get(2), sequence.get(3)));
		}
		if(isPerfectSquare(x) && isPerfectSquare(y)) {
			Collections.reverse(sequence);
		}

		storeState(module, "input", input);
		return success(new GamepadOutput(List.copyOf(sequence)));
	}

	private static List<String> firstCommand(BombEntity bomb, int x, int y, int a, int b, int c, int d) {
		if(isPrime(x)) return keys("UP", "UP", "DOWN", "DOWN");
		if(x % 12 == 0) return keys("UP", "A", "LEFT", "LEFT");
		if(a + b == 10 && bomb.isLastDigitOdd()) return keys("A", "B", "LEFT", "RIGHT");
		if(x % 6 == 3 || x % 10 == 5) return keys("DOWN", "LEFT", "A", "RIGHT");
		if(x % 7 == 0 && y % 7 != 0) return keys("LEFT", "LEFT", "UP", "B");
		if(x == c * d) return keys("A", "UP", "LEFT", "LEFT");
		if(isPerfectSquare(x)) return keys("RIGHT", "RIGHT", "A", "DOWN");
		if(x % 3 == 2 || bomb.isIndicatorUnlit("SND")) return keys("RIGHT", "A", "B", "UP");
		if(x >= 60 && x < 90 && bomb.getBatteryCount() == 0) return keys("B", "B", "RIGHT", "LEFT");
		if(x % 6 == 0) return keys("A", "B", "A", "RIGHT");
		if(x % 4 == 0) return keys("DOWN", "DOWN", "LEFT", "UP");
		return keys("A", "LEFT", "B", "RIGHT");
	}

	private static List<String> secondCommand(BombEntity bomb, int x, int y, int a, int b, int c, int d) {
		if(isPrime(y)) return keys("LEFT", "RIGHT", "LEFT", "RIGHT");
		if(y % 8 == 0) return keys("DOWN", "RIGHT", "B", "UP");
		if(c - d == 4 && bomb.hasPort(PortType.STEREO_RCA)) return keys("RIGHT", "A", "DOWN", "DOWN");
		if(y % 4 == 2 || bomb.isIndicatorLit("FRQ")) return keys("B", "UP", "RIGHT", "A");
		if(y % 7 == 0 && x % 7 != 0) return keys("LEFT", "LEFT", "DOWN", "A");
		if(isPerfectSquare(y)) return keys("UP", "DOWN", "B", "RIGHT");
		if(y == a * b) return keys("A", "UP", "LEFT", "DOWN");
		if(y % 4 == 3 || bomb.hasPort(PortType.PS2)) return keys("UP", "B", "B", "B");
		if(c > d && bomb.getBatteryCount() >= 2) return keys("A", "A", "UP", "DOWN");
		if(y % 5 == 0) return keys("B", "A", "B", "LEFT");
		if(y % 3 == 0) return keys("RIGHT", "UP", "UP", "LEFT");
		return keys("B", "UP", "A", "DOWN");
	}

	private static boolean isPrime(int number) {
		if(number < 2) return false;
		for(int divisor = 2; divisor * divisor <= number; divisor++) {
			if(number % divisor == 0) return false;
		}
		return true;
	}

	private static boolean isPerfectSquare(int number) {
		int root = (int)Math.sqrt(number);
		return number > 0 && root * root == number;
	}

	private static List<String> keys(String... keys) {
		return List.of(keys);
	}
}
