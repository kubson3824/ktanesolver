
package ktanesolver.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.RoundSummaryDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.RoundStatus;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.RoundEventRepository;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoundService {

	private final RoundRepository roundRepo;
	private final BombRepository bombRepo;
	private final RoundEventRepository roundEventRepo;

	@Transactional
	public RoundEntity createRound() {
		RoundEntity round = new RoundEntity();
		round.setStatus(RoundStatus.SETUP);
		return roundRepo.save(round);
	}

	@Transactional
	public RoundEntity startRound(UUID roundId) {
		RoundEntity round = getRound(roundId);

		if(round.getStatus() != RoundStatus.SETUP) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Round already started or finished");
		}

		if(round.getBombs().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot start round without bombs");
		}

		round.setStatus(RoundStatus.ACTIVE);
		round.setStartTime(Instant.now());

		roundRepo.save(round);
		return getRoundWithDetails(roundId);
	}

	@Transactional(readOnly = true)
	public RoundEntity getRound(UUID roundId) {
		return roundRepo.findById(roundId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
	}

	@Transactional(readOnly = true)
	public RoundEntity getRoundWithDetails(UUID roundId) {
		RoundEntity round = roundRepo.findByIdWithDetails(roundId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));

		Set<UUID> seenBombIds = new HashSet<>();
		round.getBombs().removeIf(bomb -> !seenBombIds.add(bomb.getId()));

		Map<UUID, BombEntity> bombsWithModules = bombRepo.findAllByRoundIdWithModules(roundId).stream()
				.collect(Collectors.toMap(BombEntity::getId, Function.identity()));

		for (BombEntity bomb : round.getBombs()) {
			BombEntity loadedBomb = bombsWithModules.get(bomb.getId());
			if (loadedBomb == null || loadedBomb == bomb) {
				continue;
			}

			bomb.getModules().clear();
			for (ModuleEntity module : loadedBomb.getModules()) {
				module.setBomb(bomb);
				bomb.getModules().add(module);
			}
		}

		return round;
	}

	@Transactional
	public void completeRound(UUID roundId) {
		RoundEntity round = getRound(roundId);
		round.setStatus(RoundStatus.COMPLETED);
		roundRepo.save(round);
	}

	@Transactional
	public void failRound(UUID roundId) {
		RoundEntity round = getRound(roundId);
		round.setStatus(RoundStatus.FAILED);
		roundRepo.save(round);
	}

	@Transactional(readOnly = true)
	public List<RoundEntity> getAllRounds() {
		return roundRepo.findAll();
	}

	@Transactional(readOnly = true)
	public List<RoundSummaryDto> getAllRoundSummaries() {
		return roundRepo.findAllSummaries();
	}

	@Transactional
	public void deleteRound(UUID roundId) {
		RoundEntity round = getRound(roundId);
		roundEventRepo.deleteByRound_Id(roundId);
		roundRepo.delete(round);
	}
}
