package ktanesolver.module.modded.regular.maintenance;

import ktanesolver.logic.ModuleInput;

public record MaintenanceInput(String numberPlate, Integer numberOfJobs) implements ModuleInput {
}
