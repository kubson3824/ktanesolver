
package ktanesolver.service;

import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.BombConfig;
import ktanesolver.entity.BombEntity;
import ktanesolver.enums.BombStatus;
import ktanesolver.event.StrikeAddedEvent;
import ktanesolver.repository.BombRepository;
import ktanesolver.service.RoundEventBroadcastService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BombService {

	private final BombRepository bombRepo;
	private final ApplicationEventPublisher eventPublisher;
	private final RoundEventBroadcastService roundEventBroadcastService;

	@Transactional
	public BombEntity configureBomb(UUID bombId, BombConfig config) {
		BombEntity bomb = bombRepo.findById(bombId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));

		if(config.serialNumber() != null) {
			bomb.setSerialNumber(config.serialNumber());
		}

		if(config.aaBatteryCount() != null) {
			bomb.setAaBatteryCount(config.aaBatteryCount());
		}

		if(config.dBatteryCount() != null) {
			bomb.setDBatteryCount(config.dBatteryCount());
		}

		if(config.indicators() != null) {
			bomb.setIndicators(config.indicators());
		}

		if(config.portPlates() != null) {
			bomb.replacePortPlates(config.portPlates());
		}

		bomb = bombRepo.save(bomb);
		roundEventBroadcastService.broadcastRoundUpdated(bomb.getRound().getId());
		return bomb;
	}

	@Transactional
	public BombEntity addStrike(UUID bombId) {
		BombEntity bomb = bombRepo.findById(bombId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));
		bomb.setStrikes(bomb.getStrikes() + 1);
		bomb = bombRepo.save(bomb);
		eventPublisher.publishEvent(new StrikeAddedEvent(this, bomb.getId(), bomb.getRound().getId(), bomb.getStrikes()));
		return bomb;
	}
}
