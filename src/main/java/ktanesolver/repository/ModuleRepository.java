
package ktanesolver.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ktanesolver.entity.ModuleEntity;

public interface ModuleRepository extends JpaRepository<ModuleEntity, UUID> {

    @Query("SELECT m FROM ModuleEntity m JOIN FETCH m.bomb WHERE m.id = :id")
    Optional<ModuleEntity> findByIdWithBomb(@Param("id") UUID id);

    @Query("""
            SELECT m FROM ModuleEntity m
            JOIN FETCH m.bomb b
            JOIN FETCH b.round
            WHERE m.id = :id
            """)
    Optional<ModuleEntity> findByIdWithBombAndRound(@Param("id") UUID id);
}
