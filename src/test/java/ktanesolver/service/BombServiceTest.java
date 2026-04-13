package ktanesolver.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import ktanesolver.dto.CreateBombRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.RoundRepository;

@ExtendWith(MockitoExtension.class)
class BombServiceTest {

    @Mock
    private BombRepository bombRepo;

    @Mock
    private RoundRepository roundRepo;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private BombService bombService;

    @BeforeEach
    void setUp() {
        bombService = new BombService(bombRepo, roundRepo, eventPublisher);
        when(bombRepo.save(any(BombEntity.class))).thenAnswer(invocation -> {
            BombEntity bomb = invocation.getArgument(0);
            if (bomb.getId() == null) {
                bomb.setId(UUID.randomUUID());
            }
            return bomb;
        });
    }

    @Test
    void createBombLeavesModulesEmptyWhenInitialModulesAreMissing() {
        UUID roundId = UUID.randomUUID();
        RoundEntity round = createRound(roundId);
        when(roundRepo.findById(roundId)).thenReturn(Optional.of(round));

        BombEntity result = bombService.createBomb(roundId, request(null));

        assertThat(result.getModules()).isEmpty();
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    void createBombAddsSingleInitialModuleType() {
        UUID roundId = UUID.randomUUID();
        RoundEntity round = createRound(roundId);
        when(roundRepo.findById(roundId)).thenReturn(Optional.of(round));

        BombEntity result = bombService.createBomb(roundId, request(Map.of(ModuleType.BUTTON, 1)));

        assertThat(result.getModules())
                .singleElement()
                .satisfies(module -> {
                    assertThat(module.getType()).isEqualTo(ModuleType.BUTTON);
                    assertThat(module.isSolved()).isFalse();
                    assertThat(module.getBomb()).isSameAs(result);
                });
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    void createBombAddsAllRequestedInitialModules() {
        UUID roundId = UUID.randomUUID();
        RoundEntity round = createRound(roundId);
        when(roundRepo.findById(roundId)).thenReturn(Optional.of(round));

        BombEntity result = bombService.createBomb(
                roundId,
                request(Map.of(
                        ModuleType.BUTTON, 2,
                        ModuleType.WIRES, 1)));

        assertThat(result.getModules()).hasSize(3);
        assertThat(result.getModules())
                .extracting(ModuleEntity::getType)
                .containsExactlyInAnyOrder(ModuleType.BUTTON, ModuleType.BUTTON, ModuleType.WIRES);
        assertThat(result.getModules()).allSatisfy(module -> {
            assertThat(module.isSolved()).isFalse();
            assertThat(module.getBomb()).isSameAs(result);
        });
        verify(eventPublisher).publishEvent(any());
    }

    private static RoundEntity createRound(UUID roundId) {
        RoundEntity round = new RoundEntity();
        round.setId(roundId);
        return round;
    }

    private static CreateBombRequest request(Map<ModuleType, Integer> modules) {
        return new CreateBombRequest(
                "ABC123",
                2,
                1,
                Map.of("CAR", true),
                List.of(Set.of(PortType.DVI)),
                modules);
    }
}
