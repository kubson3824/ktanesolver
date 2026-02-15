
package ktanesolver.module.modded.regular.letterkeys;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo (name = "Letter Keys", type = ModuleType.LETTER_KEYS, id = "letterkeys", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Press one of the four buttons based on the two-digit number in the display.", tags = {
	"4-buttons"})
public class LetterKeysModuleSolver extends AbstractModuleSolver<LetterKeysInput, LetterKeysOutput> {

	@Override
	protected SolveResult<LetterKeysOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, LetterKeysInput input) {
		storeState(module, "input", input);
		int number = input.number();
		if(number == 69){
			return success(new LetterKeysOutput('D'));
		} else if (number % 6 == 0) {
			return success(new LetterKeysOutput('A'));
		} else if (bomb.getBatteryCount() >= 2 && number % 3 == 0) {
			return success(new LetterKeysOutput('B'));
		} else if ((bomb.serialHasCharacter('C') || bomb.serialHasCharacter('E') || bomb.serialHasCharacter('3')) && number <= 79 && number >= 22 ) {
			return success(new LetterKeysOutput('B'));
		} else if (bomb.serialHasCharacter('C') || bomb.serialHasCharacter('E') || bomb.serialHasCharacter('3')) {
			return success(new LetterKeysOutput('C'));
		} else if (number < 46) {
			return success(new LetterKeysOutput('D'));
		}
		return success(new LetterKeysOutput('A'));
	}
}
