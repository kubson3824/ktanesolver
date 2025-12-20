
package ktanesolver.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import ktanesolver.entity.RoundEntity;
import ktanesolver.service.RoundService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping ("/rounds")
@RequiredArgsConstructor
public class RoundController {

	private final RoundService roundService;

	@PostMapping
	public RoundEntity createRound() {
		return roundService.createRound();
	}

	@GetMapping ("/{roundId}")
	public RoundEntity getRound(@PathVariable UUID roundId) {
		return roundService.getRound(roundId);
	}

	@PostMapping ("/{roundId}/start")
	public RoundEntity startRound(@PathVariable UUID roundId) {
		return roundService.startRound(roundId);
	}
}
