package ktanesolver.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import ktanesolver.enums.PortType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "port_plates")
public class PortPlateEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bomb_id")
    @JsonIgnore
    private BombEntity bomb;

    @ElementCollection
    @CollectionTable(name = "port_plate_ports", joinColumns = @JoinColumn(name = "port_plate_id"))
    @Column(name = "port_type")
    @Enumerated(EnumType.STRING)
    private Set<PortType> ports = new LinkedHashSet<>();
}
