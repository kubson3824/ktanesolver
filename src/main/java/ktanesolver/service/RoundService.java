
package ktanesolver.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.RoundStatus;
import ktanesolver.repository.RoundEventRepository;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoundService {

	private final RoundRepository roundRepo;
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

		return roundRepo.save(round);
	}

	@Transactional
	public RoundEntity getRound(UUID roundId) {
		return roundRepo.findById(roundId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
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

	@Transactional
	public List<RoundEntity> getAllRounds() {
		return roundRepo.findAll();
	}

	@Transactional
	public void deleteRound(UUID roundId) {
		RoundEntity round = getRound(roundId);
		roundEventRepo.deleteByRound_Id(roundId);
		roundRepo.delete(round);
	}
}
