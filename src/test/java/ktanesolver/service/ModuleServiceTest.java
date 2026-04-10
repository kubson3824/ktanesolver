package ktanesolver.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.utils.Json;
import ktanesolver.registry.ModuleSolverRegistry;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;

@ExtendWith(MockitoExtension.class)
class ModuleServiceTest {

    @Mock
    private BombRepository bombRepo;

    @Mock
    private ModuleRepository moduleRepo;

    @Mock
    private ModuleSolverRegistry registry;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ModuleSolver<TestInput, TestOutput> solver;

    private ModuleService moduleService;

    @BeforeEach
    void setUp() {
        new Json(new ObjectMapper());
        moduleService = new ModuleService(bombRepo, moduleRepo, registry, eventPublisher);
    }

    @Test
    void solveModuleReturnsNotImplementedWhenModuleTypeHasNoRegisteredSolver() {
        ModuleEntity module = createModule(ModuleType.VENTING_GAS);
        when(moduleRepo.findByIdWithBombAndRound(module.getId())).thenReturn(Optional.of(module));
        when(registry.<ModuleInput, ModuleOutput>get(ModuleType.VENTING_GAS)).thenReturn(null);

        assertThatThrownBy(() -> moduleService.solveModule(
                module.getBomb().getRound().getId(),
                module.getBomb().getId(),
                module.getId(),
                Map.of()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> {
                    ResponseStatusException response = (ResponseStatusException) error;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_IMPLEMENTED);
                    assertThat(response.getReason()).isEqualTo("No solver is registered for module type VENTING_GAS");
                });

        verify(moduleRepo, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void solveModuleReturnsBadRequestWhenInputCannotBeConverted() {
        ModuleEntity module = createModule(ModuleType.BUTTON);
        when(moduleRepo.findByIdWithBombAndRound(module.getId())).thenReturn(Optional.of(module));
        when(registry.<TestInput, TestOutput>get(ModuleType.BUTTON)).thenReturn(solver);
        when(solver.inputType()).thenReturn(TestInput.class);

        assertThatThrownBy(() -> moduleService.solveModule(
                module.getBomb().getRound().getId(),
                module.getBomb().getId(),
                module.getId(),
                Map.of("selection", "NOT_A_REAL_MODULE")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> {
                    ResponseStatusException response = (ResponseStatusException) error;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(response.getReason()).isEqualTo("Invalid solve input for module type BUTTON");
                });

        verify(moduleRepo, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    private static ModuleEntity createModule(ModuleType moduleType) {
        RoundEntity round = new RoundEntity();
        round.setId(UUID.randomUUID());

        BombEntity bomb = new BombEntity();
        bomb.setId(UUID.randomUUID());
        bomb.setRound(round);

        ModuleEntity module = new ModuleEntity();
        module.setId(UUID.randomUUID());
        module.setBomb(bomb);
        module.setType(moduleType);

        return module;
    }

    private record TestInput(ModuleType selection) implements ModuleInput {
    }

    private record TestOutput(String value) implements ModuleOutput {
    }
}
