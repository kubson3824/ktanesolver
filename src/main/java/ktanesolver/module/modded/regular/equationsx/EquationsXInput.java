package ktanesolver.module.modded.regular.equationsx;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record EquationsXInput(Symbol symbol, List<Integer> numbers) implements ModuleInput {
    public enum Symbol { H_OF_T, POWER, POSITION, ANGULAR_VELOCITY, Z_OF_T, TORQUE, STATIC_FRICTION, ANGULAR_ACCELERATION, KINETIC_ENERGY }
}
