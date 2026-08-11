package ktanesolver.module.modded.regular.scripting;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
    type = ModuleType.SCRIPTING,
    id = "KritScripts",
    name = "Scripting",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Correct the using directives, variable type, method type, and action in the script.",
    tags = {"code", "edgework", "logic", "cycling"}
)
public class ScriptingSolver extends AbstractModuleSolver<ScriptingInput, ScriptingOutput> {
    private static final Set<String> PROGRAMS = Set.of("KTANE","KMAPI","BOMBGENERATOR","SCRIPTAPI","SYSTEM","UNITYENGINE","SYSTEM.LINQ","ENCRYPTEDPROGRAM","KMMODS","INTGENERATOR");

    @Override
    protected SolveResult<ScriptingOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ScriptingInput input) {
        if (input == null || input.usingPrograms() == null || input.intValue() == null || input.floatValue() == null || input.boolValue() == null) {
            return failure("Enter the three using directives and the int, float, and bool values seen while cycling");
        }
        List<String> programs = input.usingPrograms().stream().map(ScriptingSolver::normalize).toList();
        if (programs.size() != 3 || programs.stream().distinct().count() != 3 || programs.stream().anyMatch(p -> !PROGRAMS.contains(p))) {
            return failure("Choose three distinct using programs shown on the module");
        }
        if (input.intValue() < 1 || input.intValue() > 50 || !Double.isFinite(input.floatValue()) || input.floatValue() < 1 || input.floatValue() >= 50) {
            return failure("Enter values from the module's variable cycle");
        }

        int lit = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
        int unlit = (int) bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
        boolean blue = lit > unlit;
        boolean red = bomb.hasIndicator("SND") || bomb.hasIndicator("TRN") || bomb.hasIndicator("CLR");
        boolean green = bomb.isIndicatorLit("FRQ") || bomb.isIndicatorLit("SIG") || bomb.isIndicatorLit("BOB");
        List<Boolean> necessary;
        if (blue && red && green) necessary = List.of(false,false,false);
        else if (blue && red) necessary = bomb.getBatteryCount() % 2 == 0 ? List.of(false,false,true) : List.of(true,true,true);
        else if (blue && green) necessary = bomb.getLastDigit() >= 5 ? List.of(true,true,false) : List.of(true,true,true);
        else if (red && green) necessary = bomb.getIndicators().size() > bomb.getLastDigit() ? List.of(true,false,false) : List.of(true,true,true);
        else if (blue) necessary = List.of(false,true,true);
        else if (red) necessary = List.of(true,false,true);
        else if (green) necessary = List.of(true,true,false);
        else necessary = List.of(true,true,true);

        String variableType = input.intValue() < bomb.getLastDigit() ? "INT"
            : input.floatValue() < bomb.getBatteryCount() ? "FLOAT"
            : !input.boolValue() ? "BOOL" : "CHAR";
        long solved = bomb.getModules().stream().filter(ModuleEntity::isSolved).count();
        String methodType = solved % 2 == 0 ? "VOID" : "BOOL";
        String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
        boolean hasKtaneLetter = serial.chars().anyMatch(c -> "KTANE".indexOf(c) >= 0);
        boolean hasVowel = serial.chars().anyMatch(c -> "AEIOU".indexOf(c) >= 0);
        boolean importsKtane = programs.contains("KTANE");
        String action = hasKtaneLetter ? (importsKtane ? "HANDLE_SOLVE" : "HANDLE_STRIKE")
            : hasVowel ? (importsKtane ? "SOLVE" : "STRIKE")
            : importsKtane ? "ON_SOLVE" : "ON_STRIKE";
        return success(new ScriptingOutput(necessary, variableType, methodType, action));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace(";", "");
    }
}
