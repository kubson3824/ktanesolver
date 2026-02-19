
package ktanesolver.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ktanesolver.entity.BombEntity;

@Repository
public interface BombRepository extends JpaRepository<BombEntity, UUID> {

	@Query("SELECT b FROM BombEntity b LEFT JOIN FETCH b.modules WHERE b.id = :id")
	Optional<BombEntity> findByIdWithModules(@Param("id") UUID id);
}
