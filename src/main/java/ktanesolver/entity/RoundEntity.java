
package ktanesolver.entity;

import java.time.Instant;
import java.util.*;

import org.hibernate.annotations.Type;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import ktanesolver.enums.RoundStatus;
import lombok.Data;

@Data
@Entity
@Table (name = "rounds")
public class RoundEntity {

	@Id
	@GeneratedValue
	private UUID id;

	@Enumerated (EnumType.STRING)
	private RoundStatus status;

	private Instant startTime;

	@Version
	private long version;

	@OneToMany (mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<BombEntity> bombs = new ArrayList<>();

	@Type (JsonType.class)
	@Column (columnDefinition = "jsonb")
	private Map<String, Object> roundState = new HashMap<>();

	// helpers
	public List<ModuleEntity> allModules() {
		return bombs.stream().flatMap(b -> b.getModules().stream()).toList();
	}
}
