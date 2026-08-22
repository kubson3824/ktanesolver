package ktanesolver.module.modded.regular.transmittedmorse;

import ktanesolver.logic.ModuleInput;

public record TransmittedMorseInput(String receivedMessage, String topLed, String bottomLed) implements ModuleInput {}
