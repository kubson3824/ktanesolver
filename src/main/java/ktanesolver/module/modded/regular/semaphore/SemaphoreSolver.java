package ktanesolver.module.modded.regular.semaphore;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;
import ktanesolver.dto.ModuleCatalogDto;

@Service
public class SemaphoreSolver implements ModuleSolver<SemaphoreInput, SemaphoreOutput> {

    @Override
    public ModuleType getType() {
        return ModuleType.SEMAPHORE;
    }

    @Override
    public Class<SemaphoreInput> inputType() {
        return SemaphoreInput.class;
    }
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("semaphore", "Semaphore", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"SEMAPHORE", List.of("decoding", "pattern"),
			"Decode the semaphore flags and form words", true, true);
	}

    @Override
    public SolveResult<SemaphoreOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, SemaphoreInput input) {
        List<FlagAngles> flagAnglesSequence = input.sequence();
        
        if (flagAnglesSequence == null || flagAnglesSequence.isEmpty()) {
            return new SolveFailure<>("Invalid semaphore sequence");
        }
        
        // Convert flag angles to semaphore positions and track mode
        List<SemaphorePosition> sequence = new ArrayList<>();
        boolean numeralsMode = false;
        
        for (FlagAngles angles : flagAnglesSequence) {
            SemaphorePosition position = SemaphorePosition.fromAngles(angles.leftFlagAngle(), angles.rightFlagAngle());
            if (position == null) {
                return new SolveFailure<>("Invalid flag angles: (" + angles.leftFlagAngle() + "°, " + angles.rightFlagAngle() + "°)");
            }
            
            // Check for control characters
            if (position == SemaphorePosition.NUMERALS) {
                numeralsMode = true;
                continue; // Don't add control characters to sequence
            } else if (position == SemaphorePosition.LETTERS) {
                numeralsMode = false;
                continue; // Don't add control characters to sequence
            }
            
            sequence.add(position);
        }
        
        // Count character occurrences in the sequence
        Map<Character, Integer> sequenceCharCounts = new HashMap<>();
        numeralsMode = false; // Reset for counting
        
        // We need to process the original sequence again to get the correct characters
        for (FlagAngles angles : flagAnglesSequence) {
            SemaphorePosition position = SemaphorePosition.fromAngles(angles.leftFlagAngle(), angles.rightFlagAngle());
            if (position == null) {
                continue;
            }
            
            // Update mode if this is a control character
            if (position == SemaphorePosition.NUMERALS) {
                numeralsMode = true;
                continue;
            } else if (position == SemaphorePosition.LETTERS) {
                numeralsMode = false;
                continue;
            }
            
            // Get the appropriate character based on mode
            char c;
            if (numeralsMode && position.hasNumber()) {
                c = position.getNumberChar();
            } else {
                c = position.getCharacter();
            }
            
            if (c >= 'A' && c <= 'Z' || c >= '0' && c <= '9') {
                sequenceCharCounts.put(c, 
                    sequenceCharCounts.getOrDefault(c, 0) + 1);
            }
        }
        
        String serialNumber = bomb.getSerialNumber();
        if (serialNumber == null || serialNumber.isEmpty()) {
            return new SolveFailure<>("Bomb serial number is required");
        }
        
        // Count character occurrences in the serial number
        Map<Character, Integer> serialCharCounts = new HashMap<>();
        for (char c : serialNumber.toUpperCase().toCharArray()) {
            if ((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')) {
                serialCharCounts.put(c, 
                    serialCharCounts.getOrDefault(c, 0) + 1);
            }
        }
        
        // Find the character that appears in sequence but not in serial number
        char missingCharacter = '\0';
        for (Map.Entry<Character, Integer> entry : sequenceCharCounts.entrySet()) {
            char seqChar = entry.getKey();
            int seqCount = entry.getValue();
            int serialCount = serialCharCounts.getOrDefault(seqChar, 0);
            
            if (seqCount > serialCount) {
                missingCharacter = seqChar;
                break;
            }
        }
        
        if (missingCharacter == '\0') {
            return new SolveFailure<>("Could not determine missing character");
        }
        
        // Always return resolved since we're no longer navigating
        SemaphoreOutput output = new SemaphoreOutput(missingCharacter, true);
        module.setSolved(true);
        Json.mapper().convertValue(output, new TypeReference<Map<String, Object>>() {})
            .forEach(module.getSolution()::put);
        
        module.setState(input);
        return new SolveSuccess<>(output, true);
    }
}
