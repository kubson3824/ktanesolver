
package ktanesolver.entity;

import java.util.*;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import ktanesolver.enums.BombStatus;
import ktanesolver.enums.PortType;
import lombok.Data;

@Data
@Entity
@Table (name = "bombs")
public class BombEntity {

	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne (fetch = FetchType.LAZY)
	@JsonIgnore
	private RoundEntity round;

	private String serialNumber;

	@JsonProperty("aaBatteryCount")
	private int aaBatteryCount;
	@JsonProperty("dBatteryCount")
	private int dBatteryCount;

	@ElementCollection
	@CollectionTable (name = "bomb_indicators", joinColumns = @JoinColumn (name = "bomb_id"))
	@MapKeyColumn (name = "indicator_name")
	@Column (name = "is_lit")
	private Map<String, Boolean> indicators = new HashMap<>();

	@OneToMany (mappedBy = "bomb", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderColumn (name = "plate_order")
	private List<PortPlateEntity> portPlates = new ArrayList<>();

	@Enumerated (EnumType.STRING)
	private BombStatus status;

	private int strikes;

	@OneToMany (mappedBy = "bomb", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ModuleEntity> modules = new ArrayList<>();

	public void replacePortPlates(List<Set<PortType>> portPlateDefinitions) {
		portPlates.clear();
		if(portPlateDefinitions == null) {
			return;
		}

		for(Set<PortType> ports: portPlateDefinitions) {
			PortPlateEntity plate = new PortPlateEntity();
			plate.setBomb(this);
			if(ports == null) {
				plate.setPorts(new LinkedHashSet<>());
			}
			else {
				plate.setPorts(new LinkedHashSet<>(ports));
			}
			portPlates.add(plate);
		}
	}

	@JsonIgnore
	public int getBatteryCount() {
		return aaBatteryCount + dBatteryCount;
	}

	public boolean isIndicatorLit(String indicator) {
		Boolean indicatorStatus = indicators.getOrDefault(indicator, null);
		return indicatorStatus != null && indicatorStatus;
	}

	public boolean isIndicatorUnlit(String indicator) {
		Boolean indicatorStatus = indicators.getOrDefault(indicator, null);
		return indicatorStatus != null && !indicatorStatus;
	}

	@JsonIgnore
	public boolean isLastDigitOdd() {
		return serialNumber.chars().filter(Character::isDigit).map(c -> c - '0').reduce((a, b) -> b).orElse(0) % 2 == 1;
	}

	@JsonIgnore
	public boolean isLastDigitEven() {
		return !isLastDigitOdd();
	}

	@JsonIgnore
	public int getLastDigit() {
		return serialNumber.chars().filter(Character::isDigit).map(c -> c - '0').reduce((a, b) -> b).orElse(0);
	}

	public boolean serialHasVowel() {
		return serialNumber.chars().anyMatch(c -> "AEIOU".indexOf(c) >= 0);
	}

    public boolean hasPort(PortType portType) {
        return portPlates.stream().anyMatch(plate -> plate.getPorts().contains(portType));
    }

	@JsonIgnore
    public int getBatteryHolders() {
        return (int) (aaBatteryCount / 2.0 + dBatteryCount);
    }
}
