package ktanesolver.module.modded.regular.europeantravel;

import ktanesolver.logic.ModuleInput;

public record EuropeanTravelInput(String country, String ticketSerial) implements ModuleInput {
}
