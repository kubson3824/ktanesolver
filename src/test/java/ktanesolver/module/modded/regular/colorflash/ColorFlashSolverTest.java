package ktanesolver.module.modded.regular.colorflash;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;

class ColorFlashSolverTest {

    @Test
    void catalogNameUsesColourFlashSpellingForTimwiManualLookup() {
        ModuleInfo moduleInfo = ColorFlashSolver.class.getAnnotation(ModuleInfo.class);

        assertThat(moduleInfo).isNotNull();
        assertThat(moduleInfo.name()).isEqualTo("Colour Flash");
    }
}
