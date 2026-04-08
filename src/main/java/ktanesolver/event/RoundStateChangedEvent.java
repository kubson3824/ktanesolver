package ktanesolver.event;

import java.util.UUID;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class RoundStateChangedEvent extends ApplicationEvent {

    private final UUID roundId;

    public RoundStateChangedEvent(Object source, UUID roundId) {
        super(source);
        this.roundId = roundId;
    }
}
