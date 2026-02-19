package ktanesolver.event;

import java.util.UUID;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class StrikeAddedEvent extends ApplicationEvent {

	private final UUID bombId;
	private final UUID roundId;
	private final int strikes;

	public StrikeAddedEvent(Object source, UUID bombId, UUID roundId, int strikes) {
		super(source);
		this.bombId = bombId;
		this.roundId = roundId;
		this.strikes = strikes;
	}
}
