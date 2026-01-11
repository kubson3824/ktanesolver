package ktanesolver.module.modded.regular.pianokeys;

import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
        type = ModuleType.PIANO_KEYS,
        id = "piano_keys",
        name = "Piano Keys",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Play the correct sequence of piano keys",
        tags = {"music", "pattern"}
)
public class PianoKeysSolver extends AbstractModuleSolver<PianoKeysInput, PianoKeysOutput> {

    @Override
    public SolveResult<PianoKeysOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, PianoKeysInput input) {
        List<PianoKeysSymbol> symbols = input.symbols();
        
        // Store symbols in module state
        storeState(module, "symbols", symbols);
        storeState(module, "input", input);
        if (symbols == null || symbols.size() != 3) {
            return failure("Piano Keys requires exactly 3 symbols");
        }
        
        // Check rules in order
        PianoKeysOutput output = checkRules(symbols, bomb);
        
        return success(output);
    }

    private PianoKeysOutput checkRules(List<PianoKeysSymbol> symbols, BombEntity bomb) {
        // Rule 1: If Flat is present and last digit of serial number is even
        if (symbols.contains(PianoKeysSymbol.FLAT) && bomb.isLastDigitEven()) {
            return createMelody(
                    PianoKeysNote.A_SHARP, PianoKeysNote.A_SHARP, PianoKeysNote.A_SHARP, PianoKeysNote.A_SHARP,
                PianoKeysNote.F_SHARP, PianoKeysNote.G_SHARP, PianoKeysNote.A_SHARP, PianoKeysNote.G_SHARP, 
                PianoKeysNote.A_SHARP);
        }
        
        // Rule 2: If Cut Time or Sharp and 2+ battery holders
        if ((symbols.contains(PianoKeysSymbol.CUT_TIME) || symbols.contains(PianoKeysSymbol.SHARP)) 
            && bomb.getBatteryHolders() >= 2) {
            return createMelody(
                    PianoKeysNote.D_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.D, PianoKeysNote.D,
                PianoKeysNote.D_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.D, PianoKeysNote.D_SHARP,
                PianoKeysNote.D_SHARP, PianoKeysNote.D, PianoKeysNote.D, PianoKeysNote.D_SHARP);
        }
        
        // Rule 3: If Natural and Fermata
        if (symbols.contains(PianoKeysSymbol.NATURAL) && symbols.contains(PianoKeysSymbol.FERMATA)) {
            return createMelody(
                    PianoKeysNote.E, PianoKeysNote.F_SHARP, PianoKeysNote.F_SHARP, PianoKeysNote.F_SHARP,
                PianoKeysNote.F_SHARP, PianoKeysNote.E, PianoKeysNote.E, PianoKeysNote.E);
        }
        
        // Rule 4: If Common Time or Turn and RCA port
        if ((symbols.contains(PianoKeysSymbol.COMMON_TIME) || symbols.contains(PianoKeysSymbol.TURN))
            && bomb.hasPort(PortType.STEREO_RCA)) {
            return createMelody(
                    PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP, PianoKeysNote.F,
                PianoKeysNote.D_SHARP, PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP,
                PianoKeysNote.F, PianoKeysNote.D_SHARP);
        }
        
        // Rule 5: If C Clef and lit SND indicator
        if (symbols.contains(PianoKeysSymbol.C_CLEF) && bomb.isIndicatorLit("SND")) {
            return createMelody(
                    PianoKeysNote.E, PianoKeysNote.E, PianoKeysNote.E, PianoKeysNote.C,
                PianoKeysNote.E, PianoKeysNote.G, PianoKeysNote.G);
        }
        
        // Rule 6: If Mordent or Fermata or Cut Time and 3+ batteries
        if ((symbols.contains(PianoKeysSymbol.MORDENT) || symbols.contains(PianoKeysSymbol.FERMATA) 
            || symbols.contains(PianoKeysSymbol.CUT_TIME)) && bomb.getBatteryCount() >= 3) {
            return createMelody(
                    PianoKeysNote.C_SHARP, PianoKeysNote.D, PianoKeysNote.E, PianoKeysNote.F,
                PianoKeysNote.C_SHARP, PianoKeysNote.D, PianoKeysNote.E, PianoKeysNote.F,
                PianoKeysNote.A_SHARP, PianoKeysNote.A);
        }
        
        // Rule 7: If Flat and Sharp
        if (symbols.contains(PianoKeysSymbol.FLAT) && symbols.contains(PianoKeysSymbol.SHARP)) {
            return createMelody(
                    PianoKeysNote.G, PianoKeysNote.G, PianoKeysNote.C, PianoKeysNote.G,
                PianoKeysNote.G, PianoKeysNote.C, PianoKeysNote.G, PianoKeysNote.C);
        }
        
        // Rule 8: If Common Time or Mordent and serial number has 3, 7, or 8
        if ((symbols.contains(PianoKeysSymbol.COMMON_TIME) || symbols.contains(PianoKeysSymbol.MORDENT))
            && bomb.getSerialNumber().matches(".*[378].*")) {
            return createMelody(
                    PianoKeysNote.A, PianoKeysNote.E, PianoKeysNote.F, PianoKeysNote.G,
                PianoKeysNote.F, PianoKeysNote.E, PianoKeysNote.D, PianoKeysNote.D,
                PianoKeysNote.F, PianoKeysNote.A);
        }
        
        // Rule 9: If Natural or Turn or C Clef
        if (symbols.contains(PianoKeysSymbol.NATURAL) || symbols.contains(PianoKeysSymbol.TURN)
            || symbols.contains(PianoKeysSymbol.C_CLEF)) {
            return createMelody(
                    PianoKeysNote.G, PianoKeysNote.G, PianoKeysNote.G, PianoKeysNote.D_SHARP,
                PianoKeysNote.A_SHARP, PianoKeysNote.G, PianoKeysNote.D_SHARP, PianoKeysNote.A_SHARP,
                PianoKeysNote.G);
        }
        
        // Default rule: Otherwise
        return createMelody(
                PianoKeysNote.B, PianoKeysNote.D, PianoKeysNote.A, PianoKeysNote.G,
            PianoKeysNote.A, PianoKeysNote.B, PianoKeysNote.D, PianoKeysNote.A);
    }

    private PianoKeysOutput createMelody(PianoKeysNote... notes) {
        return new PianoKeysOutput(List.of(notes));
    }
}
