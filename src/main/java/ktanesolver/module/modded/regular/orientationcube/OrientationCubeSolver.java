
package ktanesolver.module.modded.regular.orientationcube;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import static ktanesolver.module.modded.regular.orientationcube.OrientationCubeFace.*;
import static ktanesolver.module.modded.regular.orientationcube.OrientationCubeRotation.*;
import static ktanesolver.module.modded.regular.orientationcube.OrientationCubeRotation.ROTATE_LEFT;
import static ktanesolver.module.modded.regular.orientationcube.OrientationCubeRotation.ROTATE_RIGHT;

@Service
@ModuleInfo (type = ModuleType.ORIENTATION_CUBE, id = "orientation_cube", name = "Orientation Cube", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Rotate a cube in 3D space in such a way that specific faces move to specific new locations.", tags = {
	"top", "reset", "left-arrow", "right-arrow", "rotate-clockwise", "rotate-anticlockwise"})
public class OrientationCubeSolver extends AbstractModuleSolver<OrientationCubeInput, OrientationCubeOutput> {

	private static final OrientationCubeRotation CW = ROTATE_CLOCKWISE;
	private static final OrientationCubeRotation CCW = ROTATE_COUNTERCLOCKWISE;
	private static final OrientationCubeRotation L = ROTATE_LEFT;
	private static final OrientationCubeRotation R = ROTATE_RIGHT;

	private record RotationResult(Map<OrientationCubeFace, List<OrientationCubeRotation>> rotations, boolean needsUpdatedFace) {
	}

	@Override
	protected SolveResult<OrientationCubeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, OrientationCubeInput input) {
		storeState(module, "initialFace", input.initialFace());
		storeState(module, "updatedFace", input.updatedFace());
		RotationResult result = determineRotations(bomb, input);
		OrientationCubeOutput output = new OrientationCubeOutput(result.rotations().get(input.initialFace()), result.needsUpdatedFace());
		return success(output);
	}

	@SafeVarargs
	private static Map<OrientationCubeFace, List<OrientationCubeRotation>> rotations(Map.Entry<OrientationCubeFace, List<OrientationCubeRotation>> ... entries) {
		return Map.ofEntries(entries);
	}

	private static Map.Entry<OrientationCubeFace, List<OrientationCubeRotation>> face(OrientationCubeFace face, OrientationCubeRotation ... rotations) {
		return Map.entry(face, List.of(rotations));
	}

	private RotationResult determineRotations(BombEntity bomb, OrientationCubeInput input) {
		if(bomb.serialHasCharacter('R')) {
			return new RotationResult(rotations(face(FRONT, CW), face(RIGHT, L, CCW), face(BACK, CCW), face(LEFT, L, CW)), false);
		}

		if(bomb.isIndicatorLit("TRN") || bomb.hasIndicator("CAR")) {
			return new RotationResult(rotations(face(FRONT, CCW), face(RIGHT, CW, R), face(BACK, CW), face(LEFT, CW, L)), false);
		}

		if(bomb.hasPort(PortType.PS2) || bomb.getStrikes() >= 1) {
			return new RotationResult(rotations(face(FRONT, CCW, L), face(RIGHT, L, CW), face(BACK, CW, L), face(LEFT, L, CCW)), false);
		}

		if(bomb.serialHasCharacter('7') || bomb.serialHasCharacter('8')) {
			return new RotationResult(rotations(face(FRONT, CW, L, L), face(RIGHT, R, CW, R), face(BACK, CCW, L, L), face(LEFT, R, CCW, R)), false);
		}

		if(bomb.getBatteryCount() >= 3 || input.initialFace() == LEFT) {
			if(input.updatedFace() == null) {
				return new RotationResult(rotations(face(FRONT, CW), face(RIGHT, CW), face(BACK, CW), face(LEFT, CW)), true);
			}

			return switch(input.updatedFace()) {
				case FRONT -> new RotationResult(rotations(face(LEFT, CW, R, CCW), face(FRONT, CW, CW), face(RIGHT, CW, R, CW)), false);
				case RIGHT -> new RotationResult(rotations(face(FRONT, CW, L, CW), face(RIGHT, CW, CW), face(BACK, CW, L, CCW)), false);
				case BACK -> new RotationResult(rotations(face(RIGHT, CW, L, CW), face(BACK, CW, CW), face(LEFT, CW, L, CCW)), false);
				case LEFT -> new RotationResult(rotations(face(FRONT, CW, L, CCW), face(LEFT, CW, CW), face(BACK, CW, L, CW)), false);
			};
		}

		return new RotationResult(rotations(face(FRONT, CCW), face(RIGHT, CW, R), face(BACK, CW)), false);
	}
}
