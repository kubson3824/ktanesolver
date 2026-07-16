
package ktanesolver.controller;

import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.module.modded.regular.crazytalk.CrazyTalkSolver;
import ktanesolver.service.ModuleCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping ("/api/modules")
@RequiredArgsConstructor
@CrossOrigin
public class ModuleCatalogController {

	private final ModuleCatalogService moduleCatalogService;
	private final CrazyTalkSolver crazyTalkSolver;

	@GetMapping
	public List<ModuleCatalogDto> getAllModules(@RequestParam (required = false) String category, @RequestParam (required = false) String search) {
		return moduleCatalogService.getAllModules(category, search);
	}

	@GetMapping ("/crazy-talk/displays")
	public List<String> getCrazyTalkDisplays() {
		return crazyTalkSolver.displays();
	}
}
