package ktanesolver.repository;

import ktanesolver.entity.RoundEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RoundRepository extends JpaRepository<RoundEntity, UUID> {
}
