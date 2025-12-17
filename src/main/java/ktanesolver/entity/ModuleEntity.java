package ktanesolver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import ktanesolver.enums.ModuleType;
import lombok.Data;
import org.hibernate.annotations.Type;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Data
@Table(name = "modules")
public class ModuleEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private BombEntity bomb;

    @Enumerated(EnumType.STRING)
    private ModuleType type;

    private boolean solved;

    private int strikes;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> state = new HashMap<>();

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> solution = new HashMap<>();
}
