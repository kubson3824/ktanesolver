package ktanesolver.module.modded.regular.accumulation;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.accumulation.AccumulationInput.Color;
import ktanesolver.module.modded.regular.accumulation.AccumulationInput.StageObservation;

@Service
@ModuleInfo(
	type = ModuleType.ACCUMULATION,
	id = "accumulation",
	name = "Accumulation",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Accumulate five color-derived keypad values.",
	tags = {"colors", "keypad", "numbers", "five-stage"}
)
public class AccumulationSolver extends AbstractModuleSolver<AccumulationInput, AccumulationOutput> {
	@Override
	protected SolveResult<AccumulationOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, AccumulationInput input) {
		if(input==null||input.borderColor()==null)return failure("Select the border color");
		if(input.stages()==null||input.stages().isEmpty()||input.stages().size()>5)return failure("Enter between one and five stages");
		for(int stage=0;stage<input.stages().size();stage++){
			StageObservation observation=input.stages().get(stage);
			if(observation==null||observation.backgroundColor()==null||observation.digitColors()==null||observation.digitColors().size()!=10||observation.digitColors().stream().anyMatch(java.util.Objects::isNull))
				return failure("Enter the background and all ten digit colors for stage "+(stage+1));
		}
		int target=bomb.getBatteryCount()+bomb.getPortPlates().size()+bomb.getIndicators().size()+value(input.borderColor());
		int priorKeyTotal=0;
		List<Integer> answers=new ArrayList<>();
		for(int stage=0;stage<input.stages().size();stage++){
			StageObservation observation=input.stages().get(stage);
			target=(target+value(observation.backgroundColor())*(stage+1)+priorKeyTotal)%1000;
			answers.add(target);
			priorKeyTotal=String.valueOf(target).chars().map(digit->value(observation.digitColors().get(digit-'0'))).sum();
		}
		storeState(module,Map.of(
			"accumulationBorderColor",display(input.borderColor()),
			"accumulationBackgroundColors",input.stages().stream().map(StageObservation::backgroundColor).map(AccumulationSolver::display).toList()
		));
		int answer=answers.getLast();
		return success(new AccumulationOutput(List.copyOf(answers),answer,input.stages().size(),List.of("submit "+answer)),input.stages().size()==5);
	}
	static int value(Color color){return switch(color){case BLUE->9;case BROWN->23;case GREEN->4;case GREY->15;case LIME->26;case ORANGE->2;case PINK->8;case RED->17;case WHITE->11;case YELLOW->10;};}
	static String display(Color color){String name=color.name().toLowerCase(java.util.Locale.ROOT);return Character.toUpperCase(name.charAt(0))+name.substring(1);}
}
