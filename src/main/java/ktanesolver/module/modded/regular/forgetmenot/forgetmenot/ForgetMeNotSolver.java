
package ktanesolver.module.modded.regular.forgetmenot.forgetmenot;

import java.util.ArrayList;
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

@Service
@ModuleInfo (type = ModuleType.FORGET_ME_NOT, id = "forgetmenot", name = "Forget Me Not", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Remember the calculated numbers and press them in order", tags = {
	"needy", "display", "keypad", "sequence"}, checkFirst = true)
public class ForgetMeNotSolver extends AbstractModuleSolver<ForgetMeNotInput, ForgetMeNotOutput> {

	@Override
	public SolveResult<ForgetMeNotOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ForgetMeNotInput input) {
		ForgetMeNotState state = module.getStateAs(ForgetMeNotState.class, () -> new ForgetMeNotState(new ArrayList<>(), new ArrayList<>()));

		// When all modules are completed and display is blank, return the sequence
		if(input.allModulesCompleted() && input.display() == -1) {
			return success(new ForgetMeNotOutput(state.calculatedNumbers()));
		}

		// Calculate the number for this stage
		int calculatedNumber = calculateNumber(input, bomb, state);

		// Add display and calculated numbers to history
		List<Integer> newDisplayNumbers = new ArrayList<>(state.displayNumbers());
		newDisplayNumbers.add(input.display());

		List<Integer> newCalculatedNumbers = new ArrayList<>(state.calculatedNumbers());
		newCalculatedNumbers.add(calculatedNumber);

		ForgetMeNotState newState = new ForgetMeNotState(newDisplayNumbers, newCalculatedNumbers);
		module.setState(newState);

		ForgetMeNotOutput output = new ForgetMeNotOutput(newCalculatedNumbers);

		// Never mark as solved until all modules are complete
		return success(output, false);
	}

	private int calculateNumber(ForgetMeNotInput input, BombEntity bomb, ForgetMeNotState state) {
		int stage = input.stage();
		int display = input.display();
		
		int calculatedNumber;
		if(stage == 1) {
			calculatedNumber = calculateFirstNumber(bomb);
		}
		else if(stage == 2) {
			calculatedNumber = calculateSecondNumber(bomb, state.calculatedNumbers());
		}
		else {
			calculatedNumber = calculateOtherNumber(bomb, state.calculatedNumbers());
		}
		
		// Add the displayed number to the calculated number and return the least significant digit
		return (display + calculatedNumber) % 10;
	}

	private int calculateFirstNumber(BombEntity bomb) {
		// If the bomb has an unlit CAR indicator, the number is 2
		if(bomb.isIndicatorUnlit("CAR")) {
			return 2;
		}

		// Count lit and unlit indicators
		long litCount = bomb.getIndicators().values().stream().mapToLong(lit -> lit ? 1 : 0).sum();
		long unlitCount = bomb.getIndicators().size() - litCount;

		// Otherwise, if the bomb has more unlit indicators than lit indicators, the number is 7
		if(unlitCount > litCount) {
			return 7;
		}

		// Otherwise, if the bomb has no unlit indicators, the number is the number of lit indicators
		if(unlitCount == 0) {
			return (int)litCount;
		}

		// Otherwise, the number is the last digit of the serial
		return bomb.getLastDigit();
	}

	private int calculateSecondNumber(BombEntity bomb, List<Integer> calculatedNumbers) {
		int previousNumber = calculatedNumbers.getLast();

		// If the bomb has a serial port and 3 or more digits in the serial, the number is 3
		if(bomb.hasPort(PortType.SERIAL) && countDigitsInSerial(bomb.getSerialNumber()) >= 3) {
			return 3;
		}

		// Otherwise, if the previous calculated number was even, the number is the previous calculated number plus 1
		if(previousNumber % 2 == 0) {
			return previousNumber + 1;
		}

		// Otherwise, the number is the previous calculated number minus 1
		return previousNumber - 1;
	}

	private int calculateOtherNumber(BombEntity bomb, List<Integer> calculatedNumbers) {
		int size = calculatedNumbers.size();
		int prev1 = calculatedNumbers.get(size - 1);
		int prev2 = calculatedNumbers.get(size - 2);

		// If either of the previous two calculated numbers were 0, the number is the largest digit in the serial
		if(prev1 == 0 || prev2 == 0) {
			return getLargestDigitInSerial(bomb.getSerialNumber());
		}

		// Otherwise, if both of the previous two calculated numbers were even, the number is the smallest odd digit in the serial, or 9 if no such digit exists
		if(prev1 % 2 == 0 && prev2 % 2 == 0) {
			int smallestOdd = getSmallestOddDigitInSerial(bomb.getSerialNumber());
			return smallestOdd != -1 ? smallestOdd : 9;
		}

		// Otherwise, the number is the most significant digit of the sum of the previous two calculated numbers
		int sum = prev1 + prev2;
		return getMostSignificantDigit(sum);
	}

	private int countDigitsInSerial(String serial) {
		return (int)serial.chars().filter(Character::isDigit).count();
	}

	private int getLargestDigitInSerial(String serial) {
		return serial.chars().filter(Character::isDigit).map(c -> c - '0').max().orElse(0);
	}

	private int getSmallestOddDigitInSerial(String serial) {
		return serial.chars().filter(Character::isDigit).map(c -> c - '0').filter(d -> d % 2 == 1).min().orElse( -1);
	}

	private int getMostSignificantDigit(int number) {
		while(number >= 10) {
			number /= 10;
		}
		return number;
	}
}
