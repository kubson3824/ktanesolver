
package ktanesolver.module.modded.regular.semaphore;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record FlagAngles(@JsonProperty ("leftFlagAngle") int leftFlagAngle, @JsonProperty ("rightFlagAngle") int rightFlagAngle) {
	@JsonCreator
	public static FlagAngles create(@JsonProperty ("leftFlagAngle") int leftFlagAngle, @JsonProperty ("rightFlagAngle") int rightFlagAngle) {
		return new FlagAngles(leftFlagAngle, rightFlagAngle);
	}
}
