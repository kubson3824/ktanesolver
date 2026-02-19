package ktanesolver.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import ktanesolver.dto.RoundEventDto;
import ktanesolver.enums.EventType;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoundEventBroadcastService {

	private static final String ROUND_TOPIC_PREFIX = "/topic/rounds/";

	private final SimpMessagingTemplate messagingTemplate;

	public void broadcastRoundEvent(UUID roundId, RoundEventDto event) {
		Map<String, Object> message = new HashMap<>();
		message.put("type", event.type().name());
		message.put("timestamp", event.timestamp().toString());
		message.put("payload", event.payload());
		if (event.id() != null) message.put("id", event.id().toString());
		messagingTemplate.convertAndSend(ROUND_TOPIC_PREFIX + roundId, message);
	}

	public void broadcastRoundUpdated(UUID roundId) {
		Map<String, Object> message = new HashMap<>();
		message.put("type", "ROUND_UPDATED");
		message.put("timestamp", Instant.now().toString());
		Map<String, Object> payload = new HashMap<>();
		payload.put("roundId", roundId.toString());
		message.put("payload", payload);
		messagingTemplate.convertAndSend(ROUND_TOPIC_PREFIX + roundId, message);
	}
}
