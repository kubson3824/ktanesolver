package ktanesolver.listener;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.event.BombModuleUpdatedEvent;
import ktanesolver.event.StrikeAddedEvent;
import ktanesolver.module.modded.regular.turnthekeys.TurnTheKeysSolver;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TurnTheKeysRefreshListener {

	private final RoundRepository roundRepo;
	private final BombRepository bombRepo;
	private final ModuleRepository moduleRepo;
	private final TurnTheKeysSolver turnTheKeysSolver;

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void onBombModuleUpdated(BombModuleUpdatedEvent event) {
		refreshTurnTheKeysOnBomb(event.getRoundId(), event.getBombId());
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void onStrikeAdded(StrikeAddedEvent event) {
		refreshTurnTheKeysOnBomb(event.getRoundId(), event.getBombId());
	}

	private void refreshTurnTheKeysOnBomb(UUID roundId, UUID bombId) {
		RoundEntity round = roundRepo.findById(roundId).orElse(null);
		if (round == null) {
			return;
		}
		BombEntity bomb = bombRepo.findByIdWithModules(bombId).orElse(null);
		if (bomb == null) {
			return;
		}
		for (ModuleEntity module : bomb.getModules()) {
			if (module.getType() != ModuleType.TURN_THE_KEYS) {
				continue;
			}
			turnTheKeysSolver.refreshSolution(round, bomb, module);
			moduleRepo.save(module);
		}
	}
}
