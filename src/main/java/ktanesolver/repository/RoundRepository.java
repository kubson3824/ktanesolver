
package ktanesolver.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ktanesolver.entity.RoundEntity;

public interface RoundRepository extends JpaRepository<RoundEntity, UUID> {
}
