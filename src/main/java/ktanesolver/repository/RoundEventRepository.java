package ktanesolver.repository;

import ktanesolver.entity.RoundEntity;
import ktanesolver.entity.RoundEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoundEventRepository extends JpaRepository<RoundEventEntity, UUID> {

    List<RoundEventEntity> findByRound(RoundEntity round);
}
