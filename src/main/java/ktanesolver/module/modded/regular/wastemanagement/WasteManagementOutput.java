package ktanesolver.module.modded.regular.wastemanagement;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record WasteManagementOutput(
	int paperAmount,
	int plasticAmount,
	int metalAmount,
	List<Allocation> allocations
) implements ModuleOutput {
	public record Allocation(String material, int total, int recycle, int waste, int unused) {}
}
