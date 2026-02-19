
package ktanesolver.entity;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.Type;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import ktanesolver.enums.EventType;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@Table (name = "round_events")
public class RoundEventEntity {

	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne (fetch = FetchType.LAZY)
	private RoundEntity round;

	private Instant timestamp;

	@Enumerated (EnumType.STRING)
	private EventType type;

	@Type (JsonType.class)
	@Column (columnDefinition = "jsonb")
	private Map<String, Object> payload;
}
