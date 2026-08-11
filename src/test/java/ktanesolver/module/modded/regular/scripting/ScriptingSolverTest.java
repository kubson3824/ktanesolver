package ktanesolver.module.modded.regular.scripting;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ScriptingSolverTest {
    private final ScriptingSolver solver = new ScriptingSolver();

    @Test void appliesAllUsingRegionsAndExceptions() {
        assertNecessary(indicators(Map.of("AAA",true)),0,"AB1CD2",List.of(false,true,true));
        assertNecessary(indicators(Map.of("SND",false)),1,"AB1CD2",List.of(true,false,true));
        assertNecessary(indicators(Map.of("FRQ",true,"AAA",false)),0,"AB1CD2",List.of(true,true,false));
        assertNecessary(indicators(Map.of("SND",false,"FRQ",true,"AAA",false)),1,"AB1CD2",List.of(true,false,false));
        assertNecessary(indicators(Map.of("SND",false,"FRQ",true,"AAA",true)),0,"AB1CD2",List.of(false,false,false));
        assertNecessary(indicators(Map.of("SND",false,"AAA",true,"BBB",true)),1,"AB1CD2",List.of(true,true,true));
        assertNecessary(indicators(Map.of("SND",false,"AAA",true,"BBB",true)),2,"AB1CD2",List.of(false,false,true));
        assertNecessary(indicators(Map.of("FRQ",true)),0,"AB5CD6",List.of(true,true,false));
    }

    @Test void usesVariablePriorityMethodParityAndActionTable() {
        BombEntity bomb=bomb("KI1BC8",3,Map.of());
        ScriptingOutput first=solve(bomb,new ScriptingInput(List.of("System","KTaNE","KMAPI"),7,2.5,true));
        assertThat(first.variableType()).isEqualTo("INT"); assertThat(first.methodType()).isEqualTo("VOID"); assertThat(first.action()).isEqualTo("HANDLE_SOLVE");
        bomb.getModules().add(solvedModule());
        ScriptingOutput second=solve(bomb,new ScriptingInput(List.of("System","KMAPI","ScriptAPI"),9,2.5,true));
        assertThat(second.variableType()).isEqualTo("FLOAT"); assertThat(second.methodType()).isEqualTo("BOOL"); assertThat(second.action()).isEqualTo("HANDLE_STRIKE");
        bomb.setSerialNumber("IO1BC0"); bomb.setAaBatteryCount(0);
        assertThat(solve(bomb,new ScriptingInput(List.of("System","KTaNE","KMAPI"),9,9.0,false)).variableType()).isEqualTo("BOOL");
        assertThat(solve(bomb,new ScriptingInput(List.of("System","KMAPI","ScriptAPI"),9,9.0,true)).variableType()).isEqualTo("CHAR");
        assertThat(solve(bomb,new ScriptingInput(List.of("System","KTaNE","KMAPI"),9,9.0,true)).action()).isEqualTo("SOLVE");
        assertThat(solve(bomb,new ScriptingInput(List.of("System","KMAPI","ScriptAPI"),9,9.0,true)).action()).isEqualTo("STRIKE");
        bomb.setSerialNumber("BC1DF0");
        assertThat(solve(bomb,new ScriptingInput(List.of("System","KTaNE","KMAPI"),9,9.0,true)).action()).isEqualTo("ON_SOLVE");
        assertThat(solve(bomb,new ScriptingInput(List.of("System","KMAPI","ScriptAPI"),9,9.0,true)).action()).isEqualTo("ON_STRIKE");
    }

    @Test void rejectsIncompleteObservations() {
        assertThat(result(bomb("AB1CD2",0,Map.of()),new ScriptingInput(List.of("System","System","KMAPI"),1,2.0,false))).isInstanceOf(SolveFailure.class);
    }

    private void assertNecessary(Map<String,Boolean> indicators,int batteries,String serial,List<Boolean> expected){assertThat(solve(bomb(serial,batteries,indicators),input()).usingNecessary()).isEqualTo(expected);}
    private static ScriptingInput input(){return new ScriptingInput(List.of("System","KMAPI","ScriptAPI"),9,9.0,true);}
    private static Map<String,Boolean> indicators(Map<String,Boolean> values){return new HashMap<>(values);}
    private static BombEntity bomb(String serial,int batteries,Map<String,Boolean> indicators){BombEntity b=new BombEntity();b.setSerialNumber(serial);b.setAaBatteryCount(batteries);b.setIndicators(new HashMap<>(indicators));b.setModules(new ArrayList<>());return b;}
    private static ModuleEntity solvedModule(){ModuleEntity m=new ModuleEntity();m.setSolved(true);return m;}
    private ScriptingOutput solve(BombEntity bomb,ScriptingInput input){return((SolveSuccess<ScriptingOutput>)result(bomb,input)).output();}
    private Object result(BombEntity bomb,ScriptingInput input){return solver.solve(new RoundEntity(),bomb,new ModuleEntity(),input);}
}
