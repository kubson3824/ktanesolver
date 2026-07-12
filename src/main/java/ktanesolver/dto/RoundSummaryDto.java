package ktanesolver.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.enums.RoundStatus;

public record RoundSummaryDto(
        UUID id,
        RoundStatus status,
        Instant startTime,
        long version,
        long bombCount,
        long moduleCount,
        List<BombSummaryDto> bombs
) {
    public record BombSummaryDto(
            String serialNumber,
            int aaBatteryCount,
            int dBatteryCount,
            Map<String, Boolean> indicators,
            List<PortType> ports,
            List<ModuleType> moduleTypes
    ) {
    }
}
