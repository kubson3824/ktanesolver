package ktanesolver.module.modded.regular.shapeshift;

import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.shapeshift.ShapeShiftInput.Edge;

@Service
@ModuleInfo(type = ModuleType.SHAPE_SHIFT, id = "shape_shift", name = "Shape Shift", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Follow the shape flowchart and submit the first shape visited twice.", tags = {"shape", "flowchart", "edgework"})
public class ShapeShiftSolver extends AbstractModuleSolver<ShapeShiftInput, ShapeShiftOutput> {
	private record Shape(Edge left, Edge right) {}

	@Override
	protected SolveResult<ShapeShiftOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ShapeShiftInput input) {
		if(input == null || input.left() == null || input.right() == null) return failure("Select both sides of the displayed shape");
		storeState(module, "input", input);

		Shape current = new Shape(input.left(), input.right());
		Set<Shape> seen = new HashSet<>();
		while(seen.add(current)) current = next(current, bomb);
		return success(new ShapeShiftOutput(current.left(), current.right()));
	}

	private static Shape next(Shape shape, BombEntity bomb) {
		return switch(shape.left()) {
			case SQUARE -> switch(shape.right()) {
				case SQUARE -> shape(2, bomb.isLastDigitOdd() ? 0 : 1);
				case ROUND -> shape(bomb.hasPort(PortType.DVI) ? 1 : 3, 2);
				case POINT -> shape(bomb.isIndicatorLit("MSA") ? 3 : 2, bomb.isIndicatorLit("MSA") ? 2 : 0);
				case CONCAVE -> shape(bomb.isIndicatorUnlit("BOB") ? 3 : 2, bomb.isIndicatorUnlit("BOB") ? 1 : 2);
			};
			case ROUND -> switch(shape.right()) {
				case SQUARE -> shape(1, bomb.isIndicatorLit("SND") ? 1 : 3);
				case ROUND -> shape(bomb.serialHasVowel() ? 3 : 0, bomb.serialHasVowel() ? 3 : 1);
				case POINT -> shape(bomb.isIndicatorLit("SIG") ? 3 : 0, bomb.isIndicatorLit("SIG") ? 3 : 0);
				case CONCAVE -> shape(bomb.getAaBatteryCount() >= 2 ? 3 : 0, bomb.getAaBatteryCount() >= 2 ? 0 : 3);
			};
			case POINT -> switch(shape.right()) {
				case SQUARE -> shape(bomb.isIndicatorUnlit("CAR") ? 3 : 1, bomb.isIndicatorUnlit("CAR") ? 1 : 3);
				case ROUND -> shape(bomb.hasPort(PortType.PARALLEL) ? 0 : 1, bomb.hasPort(PortType.PARALLEL) ? 2 : 0);
				case POINT -> shape(bomb.isIndicatorLit("IND") ? 2 : 0, bomb.isIndicatorLit("IND") ? 3 : 0);
				case CONCAVE -> shape(1, bomb.hasPort(PortType.RJ45) ? 2 : 1);
			};
			case CONCAVE -> switch(shape.right()) {
				case SQUARE -> shape(bomb.isIndicatorUnlit("FRQ") ? 0 : 2, bomb.isIndicatorUnlit("FRQ") ? 1 : 2);
				case ROUND -> shape(bomb.hasPort(PortType.STEREO_RCA) ? 0 : 1, bomb.hasPort(PortType.STEREO_RCA) ? 2 : 0);
				case POINT -> shape(2, bomb.hasPort(PortType.PS2) ? 3 : 1);
				case CONCAVE -> shape(bomb.getBatteryCount() >= 3 ? 3 : 0, bomb.getBatteryCount() >= 3 ? 0 : 3);
			};
		};
	}

	private static Shape shape(int left, int right) {
		return new Shape(Edge.values()[left], Edge.values()[right]);
	}
}
