package ktanesolver.repository;

import ktanesolver.entity.BombEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BombRepository extends JpaRepository<BombEntity, UUID> {
}
