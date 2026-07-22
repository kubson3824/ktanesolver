package ktanesolver.module.modded.regular.humanresources;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.humanresources.HumanResourcesInput.Person;

public record HumanResourcesOutput(Person fire, Person hire) implements ModuleOutput {
}
