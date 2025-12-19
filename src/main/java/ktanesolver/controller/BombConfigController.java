package ktanesolver.controller;

import ktanesolver.dto.BombConfig;
import ktanesolver.entity.BombEntity;
import ktanesolver.enums.BombStatus;
import ktanesolver.service.BombService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/bombs")
@RequiredArgsConstructor
public class BombConfigController {

    private final BombService bombService;

    @PutMapping("/{bombId}/config")
    public BombEntity configure(@PathVariable UUID bombId, @RequestBody BombConfig config) {
        return bombService.configureBomb(bombId, config);
    }

    @PostMapping("/{bombId}/strike")
    public BombEntity addStrike(@PathVariable UUID bombId) {
        return bombService.addStrike(bombId);
    }
}
