
package ktanesolver.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import ktanesolver.dto.SolveModuleRequest;
import ktanesolver.logic.SolveResult;
import ktanesolver.service.ModuleService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping ("/rounds/{roundId}/bombs/{bombId}/modules")
@RequiredArgsConstructor
public class SolveController {

	private final ModuleService moduleService;

	@PostMapping ("/{moduleId}/solve")
	public SolveResult<?> solve(@PathVariable UUID roundId, @PathVariable UUID bombId, @PathVariable UUID moduleId, @RequestBody SolveModuleRequest req) {
		return moduleService.solveModule(roundId, bombId, moduleId, req.input());
	}
}
