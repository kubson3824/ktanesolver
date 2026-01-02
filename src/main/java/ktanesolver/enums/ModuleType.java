package ktanesolver.enums;

import lombok.Getter;

@Getter
public enum ModuleType {
    WIRES(false), BUTTON(false), KEYPADS(false), MEMORY(false), SIMON_SAYS(false), MORSE_CODE(false), FORGET_ME_NOT(true), WHOS_ON_FIRST(false), VENTING_GAS(true), CAPACITOR_DISCHARGE(true), COMPLICATED_WIRES(false), WIRE_SEQUENCES(false), PASSWORDS(false), MAZES(false), KNOBS(true), COLOR_FLASH(false), PIANO_KEYS(false);

    private final boolean needy;

    ModuleType(boolean needy) {
        this.needy = needy;
    }

}
