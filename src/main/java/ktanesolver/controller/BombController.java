package ktanesolver.controller;

import ktanesolver.dto.CreateBombRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.BombStatus;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/rounds/{roundId}/bombs")
@RequiredArgsConstructor
public class BombController {

    private final RoundRepository roundRepo;
    private final BombRepository bombRepo;

    @PostMapping
    public BombEntity createBomb(
        @PathVariable UUID roundId,
        @RequestBody CreateBombRequest req
    ) {
        RoundEntity round = roundRepo.findById(roundId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Round not found"
            ));

        BombEntity bomb = new BombEntity();
        bomb.setRound(round);
        bomb.setSerialNumber(req.serialNumber());
        bomb.setAaBatteryCount(req.aaBatteryCount());
        bomb.setDBatteryCount(req.dBatteryCount());
        bomb.setIndicators(req.indicators());
        bomb.replacePortPlates(req.portPlates());
        bomb.setStatus(BombStatus.ACTIVE);

        return bombRepo.save(bomb);
    }
}
