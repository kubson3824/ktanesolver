
package ktanesolver.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import ktanesolver.entity.RoundEntity;
import ktanesolver.entity.RoundEventEntity;

@Repository
public interface RoundEventRepository extends JpaRepository<RoundEventEntity, UUID> {

	List<RoundEventEntity> findByRound(RoundEntity round);

	Page<RoundEventEntity> findByRoundOrderByTimestampDesc(RoundEntity round, Pageable pageable);

	Page<RoundEventEntity> findByRoundAndTimestampAfterOrderByTimestampDesc(RoundEntity round, Instant since, Pageable pageable);

	@Modifying
	void deleteByRound_Id(UUID roundId);
}
