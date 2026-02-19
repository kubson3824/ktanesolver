
package ktanesolver.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.CreateBombRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.BombStatus;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.RoundRepository;
import ktanesolver.service.RoundEventBroadcastService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping ("/rounds/{roundId}/bombs")
@RequiredArgsConstructor
public class BombController {

	private final RoundRepository roundRepo;
	private final BombRepository bombRepo;
	private final RoundEventBroadcastService roundEventBroadcastService;

	@PostMapping
	public BombEntity createBomb(@PathVariable UUID roundId, @RequestBody CreateBombRequest req) {
		RoundEntity round = roundRepo.findById(roundId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));

		BombEntity bomb = new BombEntity();
		bomb.setRound(round);
		bomb.setSerialNumber(req.serialNumber());
		bomb.setAaBatteryCount(req.aaBatteryCount());
		bomb.setDBatteryCount(req.dBatteryCount());
		bomb.setIndicators(req.indicators());
		bomb.replacePortPlates(req.portPlates());
		bomb.setStatus(BombStatus.ACTIVE);

		bomb = bombRepo.save(bomb);
		roundEventBroadcastService.broadcastRoundUpdated(roundId);
		return bomb;
	}
}
