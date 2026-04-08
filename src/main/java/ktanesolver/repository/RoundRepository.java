
package ktanesolver.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ktanesolver.entity.RoundEntity;

public interface RoundRepository extends JpaRepository<RoundEntity, UUID> {

    @Query("""
            SELECT DISTINCT r FROM RoundEntity r
            LEFT JOIN FETCH r.bombs b
            LEFT JOIN FETCH b.modules
            LEFT JOIN FETCH b.portPlates
            LEFT JOIN FETCH b.indicators
            WHERE r.id = :id
            """)
    Optional<RoundEntity> findByIdWithDetails(@Param("id") UUID id);
}
