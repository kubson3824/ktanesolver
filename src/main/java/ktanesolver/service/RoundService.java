package ktanesolver.service;


import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.RoundStatus;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepo;

    @Transactional
    public RoundEntity createRound() {
        RoundEntity round = new RoundEntity();
        round.setStatus(RoundStatus.SETUP);
        round.setGlobalStrikes(0);
        return roundRepo.save(round);
    }

    @Transactional
    public RoundEntity startRound(UUID roundId) {
        RoundEntity round = getRound(roundId);

        if (round.getStatus() != RoundStatus.SETUP) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Round already started or finished"
            );
        }

        if (round.getBombs().isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot start round without bombs"
            );
        }

        round.setStatus(RoundStatus.ACTIVE);
        round.setStartTime(Instant.now());

        return roundRepo.save(round);
    }

    @Transactional
    public RoundEntity getRound(UUID roundId) {
        return roundRepo.findById(roundId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Round not found"
            ));
    }

    @Transactional(readOnly = true)
    public void addStrike(RoundEntity round, int count) {
        round.setGlobalStrikes(round.getGlobalStrikes() + count);
        roundRepo.save(round);
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
}
