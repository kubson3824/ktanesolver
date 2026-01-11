package ktanesolver.module.modded.regular.semaphore;

import java.util.HashMap;
import java.util.List;
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
@ModuleInfo(
        type = ModuleType.SEMAPHORE,
        id = "semaphore",
        name = "Semaphore",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Decode the semaphore flags and form words",
        tags = {"decoding", "pattern"}
)
public class SemaphoreSolver extends AbstractModuleSolver<SemaphoreInput, SemaphoreOutput> {

    @Override
    public SolveResult<SemaphoreOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SemaphoreInput input) {
        List<FlagAngles> flagAnglesSequence = input.sequence();
        
        if (flagAnglesSequence == null || flagAnglesSequence.isEmpty()) {
            return failure("Invalid semaphore sequence");
        }
        
        // Convert flag angles to semaphore positions and track mode
        boolean numeralsMode;
        
        for (FlagAngles angles : flagAnglesSequence) {
            SemaphorePosition position = SemaphorePosition.fromAngles(angles.leftFlagAngle(), angles.rightFlagAngle());
            if (position == null) {
                return failure("Invalid flag angles: (" + angles.leftFlagAngle() + "°, " + angles.rightFlagAngle() + "°)");
            }
        }
        
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
            return failure("Bomb serial number is required");
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
            return failure("Could not determine missing character");
        }
        
        // Always return resolved since we're no longer navigating
        SemaphoreOutput output = new SemaphoreOutput(missingCharacter, true);
        storeState(module, "input", input);
        return success(output);
    }
}
