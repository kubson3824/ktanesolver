
package ktanesolver.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.BombConfig;
import ktanesolver.entity.BombEntity;
import ktanesolver.enums.BombStatus;
import ktanesolver.repository.BombRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BombService {

	private final BombRepository bombRepo;

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

		return bombRepo.save(bomb);
	}

	@Transactional
	public BombEntity addStrike(UUID bombId) {
		BombEntity bomb = bombRepo.findById(bombId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));
		bomb.setStrikes(bomb.getStrikes() + 1);
		return bombRepo.save(bomb);
	}
}
