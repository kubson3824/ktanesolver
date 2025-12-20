
package ktanesolver.dto;

import java.util.List;
import java.util.Map;
import java.util.Set;

import ktanesolver.enums.PortType;

public record BombConfig(String serialNumber, Integer aaBatteryCount, Integer dBatteryCount, Map<String, Boolean> indicators, List<Set<PortType>> portPlates) {
}
