package ktanesolver.module.modded.regular.twords;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.*;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.*;
import ktanesolver.enums.PortType;
import ktanesolver.logic.*;

class TWordsSolverTest {
	private final TWordsSolver solver=new TWordsSolver();
	@Test void selectsAllFiveColumnsInPriorityOrder(){
		BombEntity batteries=bomb();batteries.setAaBatteryCount(5);assertThat(TWordsSolver.column(batteries,TWordsInput.LedColor.BLUE)).isZero();
		BombEntity indicator=bomb();indicator.setIndicators(Map.of("BOB",false));assertThat(TWordsSolver.column(indicator,TWordsInput.LedColor.RED)).isEqualTo(1);
		BombEntity ports=bomb();ports.replacePortPlates(List.of(Set.of(PortType.SERIAL,PortType.DVI)));assertThat(TWordsSolver.column(ports,TWordsInput.LedColor.GREEN)).isEqualTo(2);
		BombEntity consonants=bomb();consonants.setSerialNumber("BC1DF2");assertThat(TWordsSolver.column(consonants,TWordsInput.LedColor.BLUE)).isEqualTo(3);
		assertThat(TWordsSolver.column(bomb(),TWordsInput.LedColor.ORANGE)).isEqualTo(4);
	}
	@Test void ledRestrictionsFallThrough(){BombEntity b=bomb();b.setAaBatteryCount(5);b.setIndicators(Map.of("CAR",true));assertThat(TWordsSolver.column(b,TWordsInput.LedColor.RED)).isEqualTo(1);assertThat(TWordsSolver.column(b,TWordsInput.LedColor.GREEN)).isEqualTo(0);}
	@Test void ordersPhysicalPositionsAndRecordsFinalWords(){BombEntity b=bomb();ModuleEntity module=new ModuleEntity();TWordsOutput out=solve(b,module,new TWordsInput(TWordsInput.LedColor.ORANGE,List.of("Terpsichorean","Tachygraphy","Tabernacular","Tectosphere")));assertThat(out.column()).isEqualTo(5);assertThat(out.positions()).containsExactly(2,4,1,3);assertThat(out.orderedWords()).containsExactly("Tachygraphy","Tectosphere","Terpsichorean","Tabernacular");assertThat(module.getState().get("tWordsWords")).isEqualTo(List.of("Terpsichorean","Tachygraphy","Tabernacular","Tectosphere"));}
	@Test void validatesFourDistinctSelectedColumnWords(){BombEntity b=bomb();ModuleEntity m=new ModuleEntity();assertThat(solver.solve(new RoundEntity(),b,m,new TWordsInput(TWordsInput.LedColor.ORANGE,List.of("Tachygraphy","Tachygraphy","Tamandua","Tablature")))).isInstanceOf(SolveFailure.class);assertThat(solver.solve(new RoundEntity(),b,m,new TWordsInput(TWordsInput.LedColor.ORANGE,List.of("Notaword","Tachygraphy","Tamandua","Tablature")))).isInstanceOf(SolveFailure.class);}
	@SuppressWarnings("unchecked")private TWordsOutput solve(BombEntity b,ModuleEntity m,TWordsInput i){return((SolveSuccess<TWordsOutput>)solver.solve(new RoundEntity(),b,m,i)).output();}
	private static BombEntity bomb(){BombEntity b=new BombEntity();b.setSerialNumber("AE1BC2");return b;}
}
