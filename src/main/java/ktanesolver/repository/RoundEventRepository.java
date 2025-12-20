
package ktanesolver.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ktanesolver.entity.RoundEntity;
import ktanesolver.entity.RoundEventEntity;

@Repository
public interface RoundEventRepository extends JpaRepository<RoundEventEntity, UUID> {

	List<RoundEventEntity> findByRound(RoundEntity round);
}
