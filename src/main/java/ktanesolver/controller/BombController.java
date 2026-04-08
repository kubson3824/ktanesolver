
package ktanesolver.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import ktanesolver.dto.CreateBombRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.service.BombService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rounds/{roundId}/bombs")
@RequiredArgsConstructor
public class BombController {

	private final BombService bombService;

	@PostMapping
	public BombEntity createBomb(@PathVariable UUID roundId, @RequestBody CreateBombRequest req) {
		return bombService.createBomb(roundId, req);
	}
}
