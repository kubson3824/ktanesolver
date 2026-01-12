package ktanesolver.module.modded.regular.combinationlock;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.AbstractModuleSolver;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
        type = ModuleType.COMBINATION_LOCK,
        id = "combination_lock",
        name = "Combination Lock",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Turn the dial: RIGHT to X → LEFT to Y → RIGHT to Z",
        tags = {"modded", "regular", "combination"}
)
public class CombinationLockSolver extends AbstractModuleSolver<CombinationLockInput, CombinationLockOutput> {

    @Override
    public SolveResult<CombinationLockOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, CombinationLockInput input) {
        // Calculate solved modules count from bomb
        int solvedModulesCount = (int) bomb.getModules().stream()
            .filter(m -> m.isSolved())
            .count();
        
        try {
            // Calculate first number (last digit of serial number + solved modules + batteries)
            int firstNumber = calculateFirstNumber(bomb, solvedModulesCount);
            
            // Calculate second number (total modules + solved modules)
            int secondNumber = calculateSecondNumber(bomb, solvedModulesCount);
            
            // Calculate third number
            int thirdNumber = calculateThirdNumber(firstNumber, secondNumber);
            
            // Generate instruction
            String instruction = String.format(
                "Turn the dial: RIGHT to %d → LEFT to %d → RIGHT to %d",
                firstNumber, secondNumber, thirdNumber
            );
            
            // Check for sequential same numbers and add full revolution note
            if (firstNumber == secondNumber) {
                instruction = instruction.replace(" → LEFT to " + secondNumber, " → LEFT past " + secondNumber + " (full revolution) to " + secondNumber);
            }
            if (secondNumber == thirdNumber) {
                instruction = instruction.replace(" → RIGHT to " + thirdNumber, " → RIGHT past " + thirdNumber + " (full revolution) to " + thirdNumber);
            }
            
            CombinationLockOutput output = new CombinationLockOutput(true, instruction, firstNumber, secondNumber, thirdNumber);
            return success(output);
            
        } catch (Exception e) {
            CombinationLockOutput output = new CombinationLockOutput(false, "Error calculating combination: " + e.getMessage(), 0, 0, 0);
            return success(output, false);
        }
    }
    
    private int calculateFirstNumber(BombEntity bomb, int solvedModulesCount) {
        int sum = 0;
        
        // Use last digit of serial number + number of solved modules
        sum += bomb.getLastDigit();

        sum += solvedModulesCount;
        
        // Add number of batteries
        sum += bomb.getBatteryCount();
        
        // Modulo 20 (keep subtracting 20 until between 0-19)
        while (sum >= 20) {
            sum -= 20;
        }
        while (sum < 0) {
            sum += 20;
        }
        
        return sum;
    }
    
    private int calculateSecondNumber(BombEntity bomb, int solvedModulesCount) {
        int sum = 0;
        
        // Use number of modules on the bomb
        sum += bomb.getModules().size();
        
        // Add number of solved modules
        sum += solvedModulesCount;
        
        // Modulo 20
        while (sum >= 20) {
            sum -= 20;
        }
        while (sum < 0) {
            sum += 20;
        }
        
        return sum;
    }
    
    private int calculateThirdNumber(int firstNumber, int secondNumber) {
        int sum = firstNumber + secondNumber;
        
        // Modulo 20
        while (sum >= 20) {
            sum -= 20;
        }
        
        return sum;
    }

}
