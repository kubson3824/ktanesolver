package ktanesolver.dto;

import ktanesolver.enums.PortType;

import java.util.List;
import java.util.Map;
import java.util.Set;

public record CreateBombRequest(
    String serialNumber,
    int aaBatteryCount,
    int dBatteryCount,
    Map<String, Boolean> indicators,
    List<Set<PortType>> portPlates
) {}
