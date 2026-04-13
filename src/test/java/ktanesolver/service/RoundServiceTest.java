package ktanesolver.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.RoundEventRepository;
import ktanesolver.repository.RoundRepository;

@ExtendWith(MockitoExtension.class)
class RoundServiceTest {

    @Mock
    private RoundRepository roundRepo;

    @Mock
    private BombRepository bombRepo;

    @Mock
    private RoundEventRepository roundEventRepo;

    private RoundService roundService;

    @BeforeEach
    void setUp() {
        roundService = new RoundService(roundRepo, bombRepo, roundEventRepo);
    }

    @Test
    void getRoundWithDetailsLoadsBombModulesSeparately() {
        UUID roundId = UUID.randomUUID();
        UUID bombId = UUID.randomUUID();
        UUID moduleId = UUID.randomUUID();

        RoundEntity round = new RoundEntity();
        round.setId(roundId);

        BombEntity bomb = new BombEntity();
        bomb.setId(bombId);
        bomb.setRound(round);
        round.getBombs().add(bomb);

        ModuleEntity module = new ModuleEntity();
        module.setId(moduleId);
        module.setBomb(bomb);
        module.setType(ModuleType.BUTTON);
        bomb.getModules().add(module);

        when(roundRepo.findByIdWithDetails(roundId)).thenReturn(Optional.of(round));
        when(bombRepo.findAllByRoundIdWithModules(roundId)).thenReturn(List.of(bomb));

        RoundEntity result = roundService.getRoundWithDetails(roundId);

        assertThat(result.getBombs()).singleElement().satisfies(loadedBomb ->
                assertThat(loadedBomb.getModules())
                        .extracting(ModuleEntity::getId)
                        .containsExactly(moduleId));
        verify(bombRepo).findAllByRoundIdWithModules(roundId);
    }

    @Test
    void getRoundWithDetailsDeduplicatesBombsReturnedByFetchJoin() {
        UUID roundId = UUID.randomUUID();
        UUID bombId = UUID.randomUUID();
        UUID moduleId = UUID.randomUUID();

        RoundEntity round = new RoundEntity();
        round.setId(roundId);

        BombEntity duplicatedBomb = new BombEntity();
        duplicatedBomb.setId(bombId);
        duplicatedBomb.setRound(round);
        round.getBombs().add(duplicatedBomb);
        round.getBombs().add(duplicatedBomb);
        round.getBombs().add(duplicatedBomb);

        BombEntity bombWithModules = new BombEntity();
        bombWithModules.setId(bombId);

        ModuleEntity module = new ModuleEntity();
        module.setId(moduleId);
        module.setBomb(bombWithModules);
        module.setType(ModuleType.BUTTON);
        bombWithModules.getModules().add(module);

        when(roundRepo.findByIdWithDetails(roundId)).thenReturn(Optional.of(round));
        when(bombRepo.findAllByRoundIdWithModules(roundId)).thenReturn(List.of(bombWithModules));

        RoundEntity result = roundService.getRoundWithDetails(roundId);

        assertThat(result.getBombs()).hasSize(1);
        BombEntity loadedBomb = result.getBombs().get(0);
        assertThat(loadedBomb.getId()).isEqualTo(bombId);
        assertThat(loadedBomb.getModules())
                .extracting(ModuleEntity::getId)
                .containsExactly(moduleId);
    }

    @Test
    void getRoundWithDetailsDeduplicatesBombsWithoutReplacingManagedCollection() {
        UUID roundId = UUID.randomUUID();
        UUID bombId = UUID.randomUUID();

        RoundEntity round = new RoundEntity();
        round.setId(roundId);

        BombEntity duplicatedBomb = new BombEntity();
        duplicatedBomb.setId(bombId);
        duplicatedBomb.setRound(round);
        round.getBombs().add(duplicatedBomb);
        round.getBombs().add(duplicatedBomb);

        List<BombEntity> originalBombCollection = round.getBombs();

        BombEntity bombWithModules = new BombEntity();
        bombWithModules.setId(bombId);

        when(roundRepo.findByIdWithDetails(roundId)).thenReturn(Optional.of(round));
        when(bombRepo.findAllByRoundIdWithModules(roundId)).thenReturn(List.of(bombWithModules));

        RoundEntity result = roundService.getRoundWithDetails(roundId);

        assertThat(result.getBombs() == originalBombCollection).isTrue();
        assertThat(result.getBombs()).hasSize(1);
    }

    @Test
    void getRoundWithDetailsLoadsModulesWithoutReplacingBombModuleCollection() {
        UUID roundId = UUID.randomUUID();
        UUID bombId = UUID.randomUUID();
        UUID moduleId = UUID.randomUUID();

        RoundEntity round = new RoundEntity();
        round.setId(roundId);

        BombEntity bomb = new BombEntity();
        bomb.setId(bombId);
        bomb.setRound(round);
        round.getBombs().add(bomb);

        List<ModuleEntity> originalModuleCollection = bomb.getModules();

        BombEntity bombWithModules = new BombEntity();
        bombWithModules.setId(bombId);

        ModuleEntity module = new ModuleEntity();
        module.setId(moduleId);
        module.setBomb(bombWithModules);
        module.setType(ModuleType.BUTTON);
        bombWithModules.getModules().add(module);

        when(roundRepo.findByIdWithDetails(roundId)).thenReturn(Optional.of(round));
        when(bombRepo.findAllByRoundIdWithModules(roundId)).thenReturn(List.of(bombWithModules));

        RoundEntity result = roundService.getRoundWithDetails(roundId);

        BombEntity loadedBomb = result.getBombs().getFirst();
        assertThat(loadedBomb.getModules() == originalModuleCollection).isTrue();
        assertThat(loadedBomb.getModules())
                .extracting(ModuleEntity::getId)
                .containsExactly(moduleId);
    }

    @Test
    void startRoundReturnsHydratedRoundDetailsForSerialization() {
        UUID roundId = UUID.randomUUID();
        UUID bombId = UUID.randomUUID();
        UUID moduleId = UUID.randomUUID();

        RoundEntity round = new RoundEntity();
        round.setId(roundId);
        round.setStatus(ktanesolver.enums.RoundStatus.SETUP);

        BombEntity roundBomb = new BombEntity();
        roundBomb.setId(bombId);
        roundBomb.setRound(round);
        round.getBombs().add(roundBomb);

        BombEntity bombWithModules = new BombEntity();
        bombWithModules.setId(bombId);

        ModuleEntity module = new ModuleEntity();
        module.setId(moduleId);
        module.setBomb(bombWithModules);
        module.setType(ModuleType.BUTTON);
        bombWithModules.getModules().add(module);

        when(roundRepo.findById(roundId)).thenReturn(Optional.of(round));
        when(roundRepo.save(round)).thenReturn(round);
        when(roundRepo.findByIdWithDetails(roundId)).thenReturn(Optional.of(round));
        when(bombRepo.findAllByRoundIdWithModules(roundId)).thenReturn(List.of(bombWithModules));

        RoundEntity result = roundService.startRound(roundId);

        assertThat(result.getStatus()).isEqualTo(ktanesolver.enums.RoundStatus.ACTIVE);
        assertThat(result.getStartTime()).isNotNull();
        assertThat(result.getBombs()).singleElement().satisfies(loadedBomb ->
                assertThat(loadedBomb.getModules())
                        .extracting(ModuleEntity::getId)
                        .containsExactly(moduleId));
        verify(roundRepo).findByIdWithDetails(roundId);
        verify(bombRepo).findAllByRoundIdWithModules(roundId);
    }
}
