package ktanesolver.module.modded.regular.wirespaghetti;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.BooleanSupplier;
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
@ModuleInfo(type=ModuleType.WIRE_SPAGHETTI,id="wireSpaghetti",name="Wire Spaghetti",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description="Apply twelve edgework-dependent swaps to the fifteen-color cutting order.",tags={"wires","colors","ordering","edgework"})
public class WireSpaghettiSolver extends AbstractModuleSolver<WireSpaghettiInput,WireSpaghettiOutput>{
	static final List<String> BASE=List.of("PURPLE","LIME","DARK RED","WHITE","GREEN","ORANGE","BLUE","YELLOW","LIGHT RED","BLACK","DARK GREY","PINK","AQUA","BROWN","LIGHT GREY");
	private static final Map<String,String> ALIAS=Map.ofEntries(Map.entry("PURPLE","p"),Map.entry("LIME","l"),Map.entry("DARK RED","dr"),Map.entry("WHITE","w"),Map.entry("GREEN","g"),Map.entry("ORANGE","o"),Map.entry("BLUE","b"),Map.entry("YELLOW","y"),Map.entry("LIGHT RED","lr"),Map.entry("BLACK","k"),Map.entry("DARK GREY","dg"),Map.entry("PINK","i"),Map.entry("AQUA","a"),Map.entry("BROWN","r"),Map.entry("LIGHT GREY","lg"));
	@Override protected SolveResult<WireSpaghettiOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,WireSpaghettiInput input){
		if(input==null||input.wires()==null||input.wires().isEmpty()||input.wires().size()>21)return failure("Enter between 1 and 21 active wires");
		List<String>wires=input.wires().stream().map(v->v==null?"":v.trim().replace('_',' ').toUpperCase(Locale.ROOT)).toList();
		if(wires.stream().anyMatch(v->!BASE.contains(v)))return failure("Every wire must use one of the fifteen manual colors");
		Map<String,Long> c=BASE.stream().collect(java.util.stream.Collectors.toMap(v->v,v->wires.stream().filter(v::equals).count()));
		List<String> order=new ArrayList<>(BASE);
		swap(order,0,6,()->sum(c,"DARK GREY","LIGHT GREY","BLACK","WHITE")<5);
		swap(order,2,5,()->c.get("AQUA")==0); swap(order,4,13,()->bomb.getPortPlates().size()>sum(c,"YELLOW","DARK RED","ORANGE"));
		swap(order,6,10,()->sum(c,"LIME","PINK")>sum(c,"GREEN","PURPLE"));
		swap(order,13,14,()->c.get("LIGHT RED")<c.get("BROWN")&&c.get("BLACK")>c.get("BLUE"));
		swap(order,1,12,()->wires.size()>13); swap(order,4,9,()->List.of(2L,3L,5L,7L,11L,13L,17L,19L).contains(sum(c,"DARK RED","PINK","AQUA")));
		long lit=bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count(); swap(order,7,10,()->lit<sum(c,"BLACK","BROWN"));
		swap(order,2,7,()->sum(c,"GREEN","DARK GREY")>c.get("PINK")*2); swap(order,8,11,()->c.get("WHITE")>=3);
		swap(order,3,13,()->bomb.getBatteryCount()==sum(c,"YELLOW","ORANGE")); swap(order,0,1,()->c.get("BROWN")==sum(c,"LIGHT GREY","LIME"));
		List<String> result=wires.stream().sorted(Comparator.comparingInt(order::indexOf)).toList();
		return success(new WireSpaghettiOutput(result,result.stream().map(ALIAS::get).toList()));
	}
	private static long sum(Map<String,Long>c,String...names){long n=0;for(String name:names)n+=c.get(name);return n;}
	private static void swap(List<String>list,int a,int b,BooleanSupplier condition){if(condition.getAsBoolean())java.util.Collections.swap(list,a,b);}
}
