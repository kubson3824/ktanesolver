package ktanesolver.module.modded.regular.gameoflife;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.GAME_OF_LIFE_SIMPLE,
	id = "game-of-life-simple",
	name = "Game of Life Simple",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Apply one generation of Conway's Game of Life to a 6×8 grid",
	tags = {"grid", "cellular automaton", "Conway", "modded"}
)
public class GameOfLifeSimpleSolver extends AbstractModuleSolver<GameOfLifeInput, GameOfLifeOutput> {
	@Override
	protected SolveResult<GameOfLifeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, GameOfLifeInput input
	) {
		String error = input == null ? "Enter all 48 cells" : GameOfLifeRules.validate(input.cells());
		if (error != null) return failure(error);
		if (input.cells().stream().anyMatch(cell -> cell.first() != cell.second()
			|| cell.first() != GameOfLifeInput.Color.BLACK && cell.first() != GameOfLifeInput.Color.WHITE)) {
			return failure("Simple cells must be solid black or white");
		}

		return success(new GameOfLifeOutput(GameOfLifeRules.nextGeneration(input.cells().stream()
			.map(cell -> cell.first() == GameOfLifeInput.Color.WHITE).toList()), false));
	}
}
