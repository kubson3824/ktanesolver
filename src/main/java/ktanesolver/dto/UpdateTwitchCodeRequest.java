package ktanesolver.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateTwitchCodeRequest(
        long version,
        @Size(max = 32) @Pattern(regexp = "[A-Za-z0-9]*", message = "must contain only letters and numbers") String twitchCode) {
}
