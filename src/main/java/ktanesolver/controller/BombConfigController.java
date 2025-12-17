package ktanesolver.controller;

import ktanesolver.dto.BombConfig;
import ktanesolver.entity.BombEntity;
import ktanesolver.service.BombService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/bombs")
@RequiredArgsConstructor
public class BombConfigController {

    private final BombService bombService;

    @PutMapping("/{bombId}/config")
    public BombEntity configure(
        @PathVariable UUID bombId,
        @RequestBody BombConfig config
    ) {
        return bombService.configureBomb(bombId, config);
    }
}
