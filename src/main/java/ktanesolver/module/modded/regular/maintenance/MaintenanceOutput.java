package ktanesolver.module.modded.regular.maintenance;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MaintenanceOutput(
	String numberPlate,
	String model,
	String manufactured,
	String insuranceCompany,
	String vennLetter,
	int carValue,
	int uncoveredCost,
	boolean writeOff,
	List<String> jobs
) implements ModuleOutput {
}
