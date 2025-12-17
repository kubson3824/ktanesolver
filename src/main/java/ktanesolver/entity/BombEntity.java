package ktanesolver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ktanesolver.enums.BombStatus;
import ktanesolver.enums.PortType;
import jakarta.persistence.MapKeyColumn;
import lombok.Data;

@Data
@Entity
@Table(name = "bombs")
public class BombEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private RoundEntity round;

    private String serialNumber;

    private int aaBatteryCount;
    private int dBatteryCount;

    @ElementCollection
    @CollectionTable(name = "bomb_indicators", joinColumns = @JoinColumn(name = "bomb_id"))
    @MapKeyColumn(name = "indicator_name")
    @Column(name = "is_lit")
    private Map<String, Boolean> indicators = new HashMap<>();

    @OneToMany(mappedBy = "bomb", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "plate_order")
    @JsonIgnore
    private List<PortPlateEntity> portPlates = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private BombStatus status;

    @OneToMany(mappedBy = "bomb", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleEntity> modules = new ArrayList<>();

    public void replacePortPlates(List<Set<PortType>> portPlateDefinitions) {
        portPlates.clear();
        if (portPlateDefinitions == null) {
            return;
        }

        for (Set<PortType> ports : portPlateDefinitions) {
            PortPlateEntity plate = new PortPlateEntity();
            plate.setBomb(this);
            if (ports == null) {
                plate.setPorts(new LinkedHashSet<>());
            } else {
                plate.setPorts(new LinkedHashSet<>(ports));
            }
            portPlates.add(plate);
        }
    }
}
