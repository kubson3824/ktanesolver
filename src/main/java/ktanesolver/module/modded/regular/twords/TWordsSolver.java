package ktanesolver.module.modded.regular.twords;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.*;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.T_WORDS,id="tWords",name="T-Words",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,description="Order four T-words using the LED-selected edgework column.",tags={"words","ordering","led","edgework"})
public class TWordsSolver extends AbstractModuleSolver<TWordsInput,TWordsOutput> {
	static final List<List<String>> COLUMNS=List.of(
		List.of("Tautochronous","Tarantella","Tenderometer","Tellurometer","Tectosphere","Tessaraglot","Tamandua","Tabernacular","Tachygraphy","Tangoreceptor","Tatterdemalion","Teichoscopy","Terpsichorean","Tellurian","Taphephobia","Tabernacle","Tachyphrasia","Tauromorphous","Taphrogenesis","Tablature"),
		List.of("Tatterdemalion","Taphephobia","Tachyphrasia","Teichoscopy","Tenderometer","Tautochronous","Taphrogenesis","Tabernacle","Tangoreceptor","Tellurian","Terpsichorean","Tellurometer","Tectosphere","Tauromorphous","Tablature","Tamandua","Tabernacular","Tarantella","Tachygraphy","Tessaraglot"),
		List.of("Tauromorphous","Tellurian","Taphephobia","Tenderometer","Teichoscopy","Tangoreceptor","Tellurometer","Tamandua","Tachygraphy","Tablature","Taphrogenesis","Tachyphrasia","Tatterdemalion","Tabernacle","Tectosphere","Tessaraglot","Tarantella","Tabernacular","Terpsichorean","Tautochronous"),
		List.of("Tellurometer","Tachyphrasia","Tabernacular","Tautochronous","Tachygraphy","Tellurian","Tablature","Tessaraglot","Terpsichorean","Tatterdemalion","Tamandua","Tenderometer","Tauromorphous","Teichoscopy","Taphrogenesis","Tarantella","Tabernacle","Tectosphere","Taphephobia","Tangoreceptor"),
		List.of("Tachygraphy","Tablature","Tamandua","Taphrogenesis","Tangoreceptor","Taphephobia","Tectosphere","Tauromorphous","Tessaraglot","Tachyphrasia","Tellurometer","Tautochronous","Tenderometer","Tarantella","Tabernacle","Teichoscopy","Tatterdemalion","Terpsichorean","Tellurian","Tabernacular")
	);

	@Override protected SolveResult<TWordsOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,TWordsInput input){
		if(input==null||input.ledColor()==null||input.words()==null||input.words().size()!=4)return failure("Enter the LED color and exactly four words");
		if(input.words().stream().anyMatch(Objects::isNull)||input.words().stream().map(String::toLowerCase).distinct().count()!=4)return failure("The four words must be distinct");
		int column=column(bomb,input.ledColor());List<String> list=COLUMNS.get(column);List<Integer> ranks=new ArrayList<>();List<String> canonical=new ArrayList<>();
		for(String word:input.words()){int rank=indexOfIgnoreCase(list,word.trim());if(rank<0)return failure("Each word must appear in the selected table column");ranks.add(rank);canonical.add(list.get(rank));}
		List<Integer> order=new ArrayList<>(List.of(0,1,2,3));order.sort(Comparator.comparingInt(ranks::get));
		List<Integer> positions=order.stream().map(i->i+1).toList();List<String> ordered=order.stream().map(canonical::get).toList();
		storeState(module,"tWordsWords",canonical);storeState(module,"tWordsLedColor",input.ledColor().name());
		return success(new TWordsOutput(column+1,positions,ordered));
	}

	static int column(BombEntity bomb,TWordsInput.LedColor led){
		if(bomb.getBatteryCount()>4&&led!=TWordsInput.LedColor.RED)return 0;
		if((bomb.isIndicatorUnlit("BOB")||bomb.isIndicatorUnlit("FRK")||bomb.isIndicatorLit("CAR")||bomb.isIndicatorLit("IND"))&&led!=TWordsInput.LedColor.GREEN)return 1;
		if(bomb.hasPort(PortType.SERIAL)&&bomb.hasPort(PortType.DVI)&&led!=TWordsInput.LedColor.BLUE)return 2;
		if(!bomb.serialHasVowel()&&led!=TWordsInput.LedColor.ORANGE)return 3;
		return 4;
	}

	private static int indexOfIgnoreCase(List<String> values,String target){for(int i=0;i<values.size();i++)if(values.get(i).equalsIgnoreCase(target))return i;return-1;}
}
