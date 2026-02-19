package ktanesolver.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import ktanesolver.enums.EventType;

public record RoundEventDto(UUID id, Instant timestamp, EventType type, Map<String, Object> payload) {
}
