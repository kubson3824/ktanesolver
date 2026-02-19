package ktanesolver.event;

import java.util.UUID;

import org.springframework.context.ApplicationEvent;

import ktanesolver.enums.ModuleType;
import lombok.Getter;

@Getter
public class BombModuleUpdatedEvent extends ApplicationEvent {

	private final UUID roundId;
	private final UUID bombId;
	private final UUID moduleId;
	private final ModuleType moduleType;
	private final boolean solved;

	public BombModuleUpdatedEvent(Object source, UUID roundId, UUID bombId, UUID moduleId, ModuleType moduleType, boolean solved) {
		super(source);
		this.roundId = roundId;
		this.bombId = bombId;
		this.moduleId = moduleId;
		this.moduleType = moduleType;
		this.solved = solved;
	}
}
