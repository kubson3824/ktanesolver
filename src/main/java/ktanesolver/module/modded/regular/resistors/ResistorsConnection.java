package ktanesolver.module.modded.regular.resistors;

public record ResistorsConnection(
	ResistorsPin inputPin,
	ResistorsPin outputPin,
	ResistorsPath path,
	double resistanceOhms
) {
}
