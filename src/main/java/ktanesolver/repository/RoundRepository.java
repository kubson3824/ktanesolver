
package ktanesolver.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ktanesolver.dto.RoundSummaryDto;
import ktanesolver.entity.RoundEntity;

public interface RoundRepository extends JpaRepository<RoundEntity, UUID> {

    @Query("""
            SELECT new ktanesolver.dto.RoundSummaryDto(
                r.id,
                r.status,
                r.startTime,
                r.version,
                COUNT(DISTINCT b.id),
                COUNT(m.id)
            )
            FROM RoundEntity r
            LEFT JOIN r.bombs b
            LEFT JOIN b.modules m
            GROUP BY r.id, r.status, r.startTime, r.version
            ORDER BY r.startTime DESC, r.id DESC
            """)
    List<RoundSummaryDto> findAllSummaries();

    @Query("""
            SELECT DISTINCT r FROM RoundEntity r
            LEFT JOIN FETCH r.bombs b
            LEFT JOIN FETCH b.portPlates
            LEFT JOIN FETCH b.indicators
            WHERE r.id = :id
            """)
    Optional<RoundEntity> findByIdWithDetails(@Param("id") UUID id);
}
