package ktanesolver.enums;

import lombok.Getter;

@Getter
public enum ModuleType {
    WIRES(false),
    BUTTON(false),
    MEMORY(false),
    SIMON_SAYS(false),
    FORGET_ME_NOT(false),

    VENTING_GAS(true),
    CAPACITOR_DISCHARGE(true);

    private final boolean needy;

    ModuleType(boolean needy) {
        this.needy = needy;
    }

}
