
package ktanesolver.controller;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import ktanesolver.dto.RoundEventDto;
import ktanesolver.entity.RoundEntity;
import ktanesolver.service.RoundEventService;
import ktanesolver.service.RoundService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping ("/rounds")
@RequiredArgsConstructor
public class RoundController {

	private final RoundService roundService;
	private final RoundEventService roundEventService;

	@PostMapping
	public RoundEntity createRound() {
		return roundService.createRound();
	}

	@GetMapping ("/{roundId}")
	public RoundEntity getRound(@PathVariable UUID roundId) {
		return roundService.getRound(roundId);
	}

	@GetMapping ("/{roundId}/events")
	public List<RoundEventDto> getEvents(
		@PathVariable UUID roundId,
		@RequestParam (required = false) String since,
		@RequestParam (defaultValue = "50") int limit
	) {
		Instant sinceInstant = null;
		if (since != null && !since.isBlank()) {
			try {
				sinceInstant = Instant.parse(since);
			} catch (Exception ignored) {
				// ignore malformed since param
			}
		}
		return roundEventService.getEvents(roundId, sinceInstant, limit);
	}

	@PostMapping ("/{roundId}/start")
	public RoundEntity startRound(@PathVariable UUID roundId) {
		return roundService.startRound(roundId);
	}

	@GetMapping
	public List<RoundEntity> getAllRounds() {
		return roundService.getAllRounds();
	}

	@DeleteMapping ("/{roundId}")
	public void deleteRound(@PathVariable UUID roundId) {
		roundService.deleteRound(roundId);
	}
}
