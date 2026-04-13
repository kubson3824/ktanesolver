package ktanesolver.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.AddModulesRequest;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.service.ModuleService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bombs/{bombId}/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleRepository moduleRepo;
    private final ModuleService moduleService;

    @PostMapping
    public List<ModuleEntity> addModules(@PathVariable UUID bombId, @RequestBody AddModulesRequest req) {
        return moduleService.addModules(bombId, req);
    }

    @GetMapping("/{moduleId}")
    public ModuleEntity getModule(@PathVariable UUID bombId, @PathVariable UUID moduleId) {
        ModuleEntity module = moduleRepo.findByIdWithBomb(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        if (!module.getBomb().getId().equals(bombId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found");
        }
        return module;
    }

    @DeleteMapping("/{moduleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeModule(@PathVariable UUID bombId, @PathVariable UUID moduleId) {
        moduleService.removeModule(bombId, moduleId);
    }
}
