
package ktanesolver.controller;

import ktanesolver.dto.ModuleCatalogDto;
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

	@GetMapping
	public List<ModuleCatalogDto> getAllModules(@RequestParam (required = false) String category, @RequestParam (required = false) String search) {
		return moduleCatalogService.getAllModules(category, search);
	}
}
