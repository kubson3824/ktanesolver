package ktanesolver.module.modded.regular.jewelvault;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.jewelvault.JewelVaultInput.Jewel;

public record JewelVaultOutput(List<Jewel> correctJewels, String targetOrientation, List<String> actions)
	implements ModuleOutput {
}
