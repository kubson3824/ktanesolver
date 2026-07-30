package ktanesolver.module.modded.regular.drdoctor;

import ktanesolver.logic.ModuleOutput;

public record DrDoctorOutput(
	String diagnosis,
	String treatment,
	String dose,
	int followUpDay,
	int followUpMonth
) implements ModuleOutput {}
