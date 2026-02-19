package ktanesolver.listener;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import ktanesolver.dto.RoundEventDto;
import ktanesolver.entity.RoundEntity;
import ktanesolver.entity.RoundEventEntity;
import ktanesolver.enums.EventType;
import ktanesolver.event.BombModuleUpdatedEvent;
import ktanesolver.event.StrikeAddedEvent;
import ktanesolver.repository.RoundEventRepository;
import ktanesolver.repository.RoundRepository;
import ktanesolver.service.RoundEventBroadcastService;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RoundEventPersistenceListener {

	private final RoundRepository roundRepo;
	private final RoundEventRepository roundEventRepo;
	private final RoundEventBroadcastService broadcastService;

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void onBombModuleUpdated(BombModuleUpdatedEvent event) {
		RoundEntity round = roundRepo.findById(event.getRoundId()).orElse(null);
		if (round == null) return;
		RoundEventEntity entity = new RoundEventEntity();
		entity.setRound(round);
		entity.setTimestamp(Instant.now());
		entity.setType(EventType.MODULE_SOLVED);
		Map<String, Object> payload = new HashMap<>();
		payload.put("moduleId", event.getModuleId().toString());
		payload.put("moduleType", event.getModuleType() != null ? event.getModuleType().name() : null);
		payload.put("bombId", event.getBombId().toString());
		payload.put("solved", event.isSolved());
		entity.setPayload(payload);
		roundEventRepo.save(entity);
		broadcastService.broadcastRoundEvent(event.getRoundId(), new RoundEventDto(entity.getId(), entity.getTimestamp(), entity.getType(), entity.getPayload()));
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void onStrikeAdded(StrikeAddedEvent event) {
		RoundEntity round = roundRepo.findById(event.getRoundId()).orElse(null);
		if (round == null) return;
		RoundEventEntity entity = new RoundEventEntity();
		entity.setRound(round);
		entity.setTimestamp(Instant.now());
		entity.setType(EventType.ROUND_STRIKE);
		Map<String, Object> payload = new HashMap<>();
		payload.put("bombId", event.getBombId().toString());
		payload.put("strikes", event.getStrikes());
		entity.setPayload(payload);
		roundEventRepo.save(entity);
		broadcastService.broadcastRoundEvent(event.getRoundId(), new RoundEventDto(entity.getId(), entity.getTimestamp(), entity.getType(), entity.getPayload()));
	}
}
