
package ktanesolver.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ktanesolver.entity.ModuleEntity;

public interface ModuleRepository extends JpaRepository<ModuleEntity, UUID> {
}
