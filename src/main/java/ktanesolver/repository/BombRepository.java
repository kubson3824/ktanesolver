
package ktanesolver.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ktanesolver.entity.BombEntity;

@Repository
public interface BombRepository extends JpaRepository<BombEntity, UUID> {
}
