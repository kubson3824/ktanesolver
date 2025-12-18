package ktanesolver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import ktanesolver.enums.ModuleType;
import lombok.Data;
import org.hibernate.annotations.Type;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

@Entity
@Data
@Table(name = "modules")
public class ModuleEntity {


    @Transient
    @JsonIgnore
    private static ObjectMapper mapper;

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

    public <T> T getStateAs(Class<T> type, Supplier<T> defaultSupplier) {
        if (state == null || state.isEmpty()) {
            T value = defaultSupplier.get();
            setState(value);
            return value;
        }
        return mapper.convertValue(state, type);
    }

    public void setState(Object value) {
        this.state = mapper.convertValue(value, new TypeReference<Map<String, Object>>() {
        });
    }


}
