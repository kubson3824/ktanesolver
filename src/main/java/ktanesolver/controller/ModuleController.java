
package ktanesolver.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.AddModulesRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping ("/bombs/{bombId}/modules")
@RequiredArgsConstructor
public class ModuleController {

	private final BombRepository bombRepo;
	private final ModuleRepository moduleRepo;

	@PostMapping
	public List<ModuleEntity> addModules(@PathVariable UUID bombId, @RequestBody AddModulesRequest req) {
		BombEntity bomb = bombRepo.findById(bombId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));

		List<ModuleEntity> modules = new ArrayList<>();

		for(int i = 0; i < req.count(); i++) {
			ModuleEntity m = new ModuleEntity();
			m.setBomb(bomb);
			m.setType(req.type());
			m.setSolved(false);
			modules.add(m);
		}

		return moduleRepo.saveAll(modules);
	}

	@GetMapping("/{moduleId}")
	public ModuleEntity getModule(@PathVariable UUID bombId, @PathVariable UUID moduleId) {
		return moduleRepo.findById(moduleId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
	}
}
