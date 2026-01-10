package ktanesolver.module.modded.regular.colorflash;

import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class ColorFlashSolver implements ModuleSolver<ColorFlashInput, ColorFlashOutput> {

    @Override
    public ModuleType getType() {
        return ModuleType.COLOR_FLASH;
    }

    @Override
    public Class<ColorFlashInput> inputType() {
        return ColorFlashInput.class;
    }
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("color_flash", "Color Flash", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"COLOR_FLASH", List.of("pattern", "timing"),
			"Press the button when the colors match", true, true);
	}

    @Override
    public SolveResult<ColorFlashOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, ColorFlashInput input) {
        List<ColorFlashEntry> sequence = input.sequence();
        
        // Store sequence in module state
        module.getState().put("sequence", Json.mapper().convertValue(sequence, new TypeReference<>() {}));
        
        if (sequence == null || sequence.size() != 8) {
            throw new IllegalArgumentException("Color Flash requires exactly 8 word/color pairs");
        }
        
        ColorFlashEntry lastEntry = sequence.get(7);
        String lastColor = lastEntry.color().toUpperCase();
        
        ColorFlashOutput output = switch (lastColor) {
            case "RED" -> solveRed(sequence);
            case "YELLOW" -> solveYellow(sequence);
            case "GREEN" -> solveGreen(sequence);
            case "BLUE" -> solveBlue(sequence);
            case "MAGENTA" -> solveMagenta(sequence);
            case "WHITE" -> solveWhite(sequence);
            default -> throw new IllegalArgumentException("Invalid color: " + lastColor);
        };
        
        setModuleSolution(module, output);
        module.setState(input);
        return new SolveSuccess<>(output, true);
    }

    private ColorFlashOutput solveRed(List<ColorFlashEntry> sequence) {
        // If Green is used as the word at least three times in the sequence, press Yes on the third time Green is used as either the word or the colour of the word in the sequence.
        int greenWordCount = countOccurrences(sequence, e -> e.word().equalsIgnoreCase("GREEN"));
        if (greenWordCount >= 3) {
            int position = findNthOccurrence(sequence, e -> 
                e.word().equalsIgnoreCase("GREEN") || e.color().equalsIgnoreCase("GREEN"), 3);
            return ColorFlashOutput.yes("Press Yes on the third time Green appears (as word or color)", position);
        }
        
        // Otherwise, if Blue is used as the colour of the word exactly once, press No when the word Magenta is shown.
        long blueColorCount = sequence.stream().filter(e -> e.color().equalsIgnoreCase("BLUE")).count();
        if (blueColorCount == 1) {
            int position = findFirstOccurrence(sequence, e -> e.word().equalsIgnoreCase("MAGENTA"));
            return ColorFlashOutput.no("Press No when the word Magenta is shown", position);
        }
        
        // Otherwise, press Yes the last time White is either the word or the colour of the word in the sequence.
        int position = findLastOccurrence(sequence, e -> 
            e.word().equalsIgnoreCase("WHITE") || e.color().equalsIgnoreCase("WHITE"));
        return ColorFlashOutput.yes("Press Yes the last time White appears (as word or color)", position);
    }

    private ColorFlashOutput solveYellow(List<ColorFlashEntry> sequence) {
        // If the word Blue is shown in Green colour, press Yes on the first time Green is used as the colour of the word.
        boolean blueInGreen = sequence.stream().anyMatch(e -> 
            e.word().equalsIgnoreCase("BLUE") && e.color().equalsIgnoreCase("GREEN"));
        if (blueInGreen) {
            int position = findFirstOccurrence(sequence, e -> e.color().equalsIgnoreCase("GREEN"));
            return ColorFlashOutput.yes("Press Yes on the first time Green is used as the color", position);
        }
        
        // Otherwise, if the word White is shown in either White or Red colour, press Yes on the second time in the sequence where the colour of the word does not match the word itself.
        boolean whiteInWhiteOrRed = sequence.stream().anyMatch(e -> 
            e.word().equalsIgnoreCase("WHITE") && 
            (e.color().equalsIgnoreCase("WHITE") || e.color().equalsIgnoreCase("RED")));
        if (whiteInWhiteOrRed) {
            int position = findNthOccurrence(sequence, e -> 
                !e.word().equalsIgnoreCase(e.color()), 2);
            return ColorFlashOutput.yes("Press Yes on the second time color doesn't match word", position);
        }
        
        // Otherwise, count the number of times Magenta is used as either the word or the colour of the word in the sequence (the word Magenta in Magenta colour only counts as one), and press No on the colour in the total's position
        int magentaCount = countOccurrences(sequence, e -> 
            e.word().equalsIgnoreCase("MAGENTA") || e.color().equalsIgnoreCase("MAGENTA"));
        return ColorFlashOutput.no("Press No on position " + magentaCount, magentaCount);
    }

    private ColorFlashOutput solveGreen(List<ColorFlashEntry> sequence) {
        // If a word occurs consecutively with different colors, press No on the fifth entry in the sequence.
        for (int i = 0; i < sequence.size() - 1; i++) {
            if (sequence.get(i).word().equalsIgnoreCase(sequence.get(i + 1).word()) &&
                !sequence.get(i).color().equalsIgnoreCase(sequence.get(i + 1).color())) {
                return ColorFlashOutput.no("Press No on the fifth entry (consecutive word with different colors)", 5);
            }
        }
        
        // If Magenta is used as the word at least three times in the sequence, press No on the first time Yellow is used as either the word or the colour of the word in the sequence.
        int magentaWordCount = countOccurrences(sequence, e -> e.word().equalsIgnoreCase("MAGENTA"));
        if (magentaWordCount >= 3) {
            int position = findFirstOccurrence(sequence, e -> 
                e.word().equalsIgnoreCase("YELLOW") || e.color().equalsIgnoreCase("YELLOW"));
            return ColorFlashOutput.no("Press No on first Yellow appearance (Magenta word ≥3 times)", position);
        }
        
        // Otherwise, press Yes on any colour where the colour of the word matches the word itself.
        int position = findFirstOccurrence(sequence, e -> e.word().equalsIgnoreCase(e.color()));
        return ColorFlashOutput.yes("Press Yes on first matching color/word", position);
    }

    private ColorFlashOutput solveBlue(List<ColorFlashEntry> sequence) {
        // If the colour of the word does not match the word itself three times or more in the sequence, press Yes on the first time in the sequence where the colour of the word does not match the word itself.
        long mismatchCount = sequence.stream().filter(e -> !e.word().equalsIgnoreCase(e.color())).count();
        if (mismatchCount >= 3) {
            int position = findFirstOccurrence(sequence, e -> !e.word().equalsIgnoreCase(e.color()));
            return ColorFlashOutput.yes("Press Yes on first color/word mismatch (≥3 mismatches)", position);
        }
        
        // If the word Red is shown in Yellow colour, or the word Yellow is shown in White colour, press No when the word White is shown in Red colour.
        boolean redInYellow = sequence.stream().anyMatch(e -> 
            e.word().equalsIgnoreCase("RED") && e.color().equalsIgnoreCase("YELLOW"));
        boolean yellowInWhite = sequence.stream().anyMatch(e -> 
            e.word().equalsIgnoreCase("YELLOW") && e.color().equalsIgnoreCase("WHITE"));
        if (redInYellow || yellowInWhite) {
            int position = findFirstOccurrence(sequence, e -> 
                e.word().equalsIgnoreCase("WHITE") && e.color().equalsIgnoreCase("RED"));
            return ColorFlashOutput.no("Press No when White is shown in Red", position);
        }
        
        // Otherwise, press Yes the last time Green is either the word or the colour of the word in the sequence.
        int position = findLastOccurrence(sequence, e -> 
            e.word().equalsIgnoreCase("GREEN") || e.color().equalsIgnoreCase("GREEN"));
        return ColorFlashOutput.yes("Press Yes on last Green appearance", position);
    }

    private ColorFlashOutput solveMagenta(List<ColorFlashEntry> sequence) {
        // If a colour occurs consecutively with different words, press Yes on the third entry in the sequence.
        for (int i = 0; i < sequence.size() - 1; i++) {
            if (sequence.get(i).color().equalsIgnoreCase(sequence.get(i + 1).color()) &&
                !sequence.get(i).word().equalsIgnoreCase(sequence.get(i + 1).word())) {
                return ColorFlashOutput.yes("Press Yes on the third entry (consecutive color with different words)", 3);
            }
        }
        
        // If the number of times the word Yellow appears is greater than the number of times that the colour of the word is Blue, press No the last time the word Yellow is in the sequence.
        long yellowWordCount = sequence.stream().filter(e -> e.word().equalsIgnoreCase("YELLOW")).count();
        long blueColorCount = sequence.stream().filter(e -> e.color().equalsIgnoreCase("BLUE")).count();
        if (yellowWordCount > blueColorCount) {
            int position = findLastOccurrence(sequence, e -> e.word().equalsIgnoreCase("YELLOW"));
            return ColorFlashOutput.no("Press No on last Yellow word (Yellow words > Blue colors)", position);
        }
        
        // Otherwise, press No on the first time in the sequence where the colour of the word matches the word of the seventh entry in the sequence.
        ColorFlashEntry seventhEntry = sequence.get(6);
        String seventhWord = seventhEntry.word();
        int position = findFirstOccurrence(sequence, e -> e.color().equalsIgnoreCase(seventhWord));
        return ColorFlashOutput.no("Press No when color matches seventh word (" + seventhWord + ")", position);
    }

    private ColorFlashOutput solveWhite(List<ColorFlashEntry> sequence) {
        // If the colour of the third word matches the word of the fourth word or fifth word, press No the first time that Blue is used as the word or the colour of the word in the sequence.
        ColorFlashEntry thirdWord = sequence.get(2);
        ColorFlashEntry fourthWord = sequence.get(3);
        ColorFlashEntry fifthWord = sequence.get(4);
        
        if (thirdWord.color().equalsIgnoreCase(fourthWord.word()) || 
            thirdWord.color().equalsIgnoreCase(fifthWord.word())) {
            int position = findFirstOccurrence(sequence, e -> 
                e.word().equalsIgnoreCase("BLUE") || e.color().equalsIgnoreCase("BLUE"));
            return ColorFlashOutput.no("Press No on first Blue appearance", position);
        }
        
        // If the word Yellow is shown in Red colour, press Yes on the last time Blue is used as the colour of the word.
        boolean yellowInRed = sequence.stream().anyMatch(e -> 
            e.word().equalsIgnoreCase("YELLOW") && e.color().equalsIgnoreCase("RED"));
        if (yellowInRed) {
            int position = findLastOccurrence(sequence, e -> e.color().equalsIgnoreCase("BLUE"));
            return ColorFlashOutput.yes("Press Yes on last Blue color (Yellow in Red)", position);
        }
        
        // Otherwise, press No.
        return ColorFlashOutput.no("Press No");
    }

    // Helper methods
    private int countOccurrences(List<ColorFlashEntry> sequence, Predicate<ColorFlashEntry> predicate) {
        return (int) sequence.stream().filter(predicate).count();
    }

    private int findNthOccurrence(List<ColorFlashEntry> sequence, Predicate<ColorFlashEntry> predicate, int n) {
        int count = 0;
        for (int i = 0; i < sequence.size(); i++) {
            if (predicate.test(sequence.get(i))) {
                count++;
                if (count == n) {
                    return i + 1; // 1-based position
                }
            }
        }
        return -1; // Return -1 if not found
    }

    private int findFirstOccurrence(List<ColorFlashEntry> sequence, Predicate<ColorFlashEntry> predicate) {
        for (int i = 0; i < sequence.size(); i++) {
            if (predicate.test(sequence.get(i))) {
                return i + 1; // 1-based position
            }
        }
        return -1; // Return -1 if not found
    }

    private int findLastOccurrence(List<ColorFlashEntry> sequence, Predicate<ColorFlashEntry> predicate) {
        for (int i = sequence.size() - 1; i >= 0; i--) {
            if (predicate.test(sequence.get(i))) {
                return i + 1; // 1-based position
            }
        }
        return -1; // Return -1 if not found
    }

    private void setModuleSolution(ModuleEntity module, ColorFlashOutput output) {
        module.setSolved(true);
        Map<String, Object> convertedValue = Json.mapper().convertValue(output, new TypeReference<>() {});
        convertedValue.forEach(module.getSolution()::put);
    }
}
