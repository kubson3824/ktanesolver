
package ktanesolver.module.modded.regular.emojiMath;

import java.util.Map;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo (type = ModuleType.EMOJI_MATH, id = "emoji_math", name = "Emoji Math", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Solve math problems with emoji values", tags = {
	"puzzle", "visual"})
public class EmojiMathSolver extends AbstractModuleSolver<EmojiMathInput, EmojiMathOutput> {

	private static final Map<String, String> EMOJI_TO_DIGIT = Map.ofEntries(
		Map.entry(":)", "0"), Map.entry("=(", "1"), Map.entry("(:", "2"), Map.entry(")=", "3"), Map.entry(":(", "4"), Map.entry("):", "5"), Map.entry("=)", "6"), Map.entry("(=", "7"),
		Map.entry(":|", "8"), Map.entry("|:", "9"));

	@Override
	public SolveResult<EmojiMathOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, EmojiMathInput input) {
		String emojiEquation = input.emojiEquation();

		if(emojiEquation == null || emojiEquation.trim().isEmpty()) {
			return failure("Emoji equation cannot be empty");
		}

		emojiEquation = emojiEquation.trim().replaceAll("\\s+", "");

		// Find the operator position
		int operatorIndex = -1;
		String operator = null;

		for(int i = 0; i < emojiEquation.length(); i++) {
			char c = emojiEquation.charAt(i);
			if(c == '+' || c == '-' || c == '*' || c == '/') {
				operatorIndex = i;
				operator = String.valueOf(c);
				break;
			}
		}

		if(operatorIndex == -1) {
			return failure("Invalid emoji equation format. Expected format: emoji [+,-,*,/] emoji (e.g., ')::(+)=:(')");
		}

		String leftEmojis = emojiEquation.substring(0, operatorIndex);
		String rightEmojis = emojiEquation.substring(operatorIndex + 1);

		if(leftEmojis.isEmpty() || rightEmojis.isEmpty()) {
			return failure("Invalid emoji equation format. Expected format: emoji [+,-,*,/] emoji (e.g., ')::(+)=:(')");
		}

		try {
			String leftNumber = translateEmojisToNumber(leftEmojis);
			String rightNumber = translateEmojisToNumber(rightEmojis);

			if(leftNumber == null || rightNumber == null) {
				return failure("Invalid emoji in equation. Supported emojis: :) =( (: )= :( ): =) (= :| |:");
			}

			String translatedEquation = leftNumber + " " + operator + " " + rightNumber;

			long leftOperand = Long.parseLong(leftNumber);
			long rightOperand = Long.parseLong(rightNumber);

			long result;
			switch(operator) {
				case "+":
					result = leftOperand + rightOperand;
					break;
				case "-":
					result = leftOperand - rightOperand;
					break;
				case "*":
					result = leftOperand * rightOperand;
					break;
				case "/":
					if(rightOperand == 0) {
						return failure("Division by zero is not allowed");
					}
					result = leftOperand / rightOperand;
					break;
				default:
					return failure("Unsupported operator: " + operator);
			}

			EmojiMathOutput output = new EmojiMathOutput(result, translatedEquation);

			storeState(module, "input", input);
			return success(output);

		}
		catch(NumberFormatException e) {
			return failure("Invalid number format in translated equation");
		}
		catch(ArithmeticException e) {
			return failure("Arithmetic error: " + e.getMessage());
		}
	}

	private String translateEmojisToNumber(String emojis) {
		StringBuilder number = new StringBuilder();
		int i = 0;

		while(i < emojis.length()) {
			if(i + 1 < emojis.length()) {
				String twoCharEmoji = emojis.substring(i, i + 2);
				if(EMOJI_TO_DIGIT.containsKey(twoCharEmoji)) {
					number.append(EMOJI_TO_DIGIT.get(twoCharEmoji));
					i += 2;
					continue;
				}
			}

			String oneCharEmoji = emojis.substring(i, i + 1);
			if(EMOJI_TO_DIGIT.containsKey(oneCharEmoji)) {
				number.append(EMOJI_TO_DIGIT.get(oneCharEmoji));
				i += 1;
			}
			else {
				return null;
			}
		}

		return number.toString();
	}
}
