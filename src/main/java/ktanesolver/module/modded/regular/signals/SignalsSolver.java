package ktanesolver.module.modded.regular.signals;

import java.util.ArrayList;import java.util.Arrays;import java.util.HashSet;import java.util.List;import java.util.Set;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;import ktanesolver.dto.ModuleCatalogDto;import ktanesolver.entity.BombEntity;import ktanesolver.entity.ModuleEntity;import ktanesolver.entity.RoundEntity;import ktanesolver.enums.ModuleType;import ktanesolver.logic.AbstractModuleSolver;import ktanesolver.logic.SolveResult;import ktanesolver.module.modded.regular.signals.SignalsInput.SwitchWiring;

@Service
@ModuleInfo(type=ModuleType.SIGNALS,id="Signals",name="Signals",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description="Translate a waveform and decoded shuffled switch wiring into the generator settings.",tags={"oscilloscope","signals","switches","harmonics","strikes"})
public class SignalsSolver extends AbstractModuleSolver<SignalsInput,SignalsOutput> {
	private static final int[][][] TARGETS = {
		{{-1,1,-1},{-1,-1,-1},{-1,-1,1},{1,1,-1},{1,1,1},{1,-1,-1},{-1,1,1},{1,-1,1},{0,1,1},{-1,0,1},{0,-1,-1},{0,1,-1},{1,0,-1},{0,-1,1},{-1,0,-1},{1,0,1},{1,1,0},{-1,-1,0},{1,-1,0},{-1,1,0},{0,0,-1},{0,0,1},{0,0,0},{0,1,0},{-1,0,0},{1,0,0},{0,-1,0}},
		{{1,1,-1},{-1,1,-1},{-1,1,1},{1,1,1},{-1,-1,-1},{0,-1,-1},{-1,-1,1},{0,1,-1},{1,0,1},{1,-1,-1},{0,-1,1},{1,-1,1},{0,1,1},{1,-1,0},{1,1,0},{-1,0,1},{1,0,-1},{-1,0,-1},{0,0,1},{0,1,0},{-1,-1,0},{-1,0,0},{0,-1,0},{0,0,-1},{0,0,0},{-1,1,0},{1,0,0}},
		{{-1,1,1},{1,1,-1},{0,1,-1},{-1,-1,1},{0,-1,-1},{-1,-1,-1},{1,1,1},{1,-1,-1},{-1,1,-1},{1,0,1},{1,0,-1},{0,1,1},{-1,0,1},{1,-1,1},{1,-1,0},{1,1,0},{-1,1,0},{0,-1,1},{-1,0,-1},{0,0,1},{-1,0,0},{1,0,0},{0,1,0},{0,0,0},{0,-1,0},{0,0,-1},{-1,-1,0}}
	};
	@Override protected SolveResult<SignalsOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,SignalsInput input){
		if(input==null||input.inputFigure()<1||input.inputFigure()>27||input.strikes()<0)return failure("Enter figure 1–27 and a non-negative strike count");
		if(input.switches()==null||input.switches().size()!=3)return failure("Enter the decoded wiring for S1, S2, and S3");
		Set<Integer> coefficients=new HashSet<>();
		for(SwitchWiring wiring:input.switches()){
			if(wiring==null||wiring.currentState()==null||wiring.coefficient()<1||wiring.coefficient()>3)return failure("Each switch needs its coefficient and current state");
			coefficients.add(wiring.coefficient());
			if(!new HashSet<>(List.of(wiring.upValue(),wiring.centerValue(),wiring.downValue())).equals(Set.of(-1,0,1)))return failure("Each switch must map UP, CENTER, and DOWN to -1, 0, and 1 exactly once");
		}
		if(!coefficients.equals(Set.of(1,2,3)))return failure("C1, C2, and C3 must each be controlled by exactly one switch");
		int[] target=TARGETS[Math.min(input.strikes(),2)][input.inputFigure()-1];List<String> positions=new ArrayList<>(),clicks=new ArrayList<>();
		for(int switchIndex=0;switchIndex<3;switchIndex++){
			SwitchWiring wiring=input.switches().get(switchIndex);int desired=target[wiring.coefficient()-1];String position=desired==wiring.upValue()?"UP":desired==wiring.downValue()?"DOWN":"CENTER";positions.add(position);
			int count=clicks(wiring.currentState(),position);for(int i=0;i<count;i++)clicks.add("s"+(switchIndex+1));
		}
		return success(new SignalsOutput(Arrays.stream(target).boxed().toList(),positions,clicks));
	}
	static int clicks(SignalsSwitchState current,String target){int start=current.ordinal(),best=4;for(int i=0;i<4;i++){boolean match=target.equals("UP")&&i==0||target.equals("DOWN")&&i==2||target.equals("CENTER")&&(i==1||i==3);if(match)best=Math.min(best,(i-start+4)%4);}return best;}
	static int[] target(int figure,int strikes){return TARGETS[Math.min(strikes,2)][figure-1].clone();}
}
