package ktanesolver.module.modded.regular.europeantravel;

import ktanesolver.logic.ModuleOutput;

public record EuropeanTravelOutput(
	String ticketType,
	String travelClass,
	String departure,
	String destination,
	String seat,
	String price
) implements ModuleOutput {
}
