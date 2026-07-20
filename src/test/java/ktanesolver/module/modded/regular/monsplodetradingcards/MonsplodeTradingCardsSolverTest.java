package ktanesolver.module.modded.regular.monsplodetradingcards;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.monsplodetradingcards.MonsplodeTradingCardsInput.Card;

class MonsplodeTradingCardsSolverTest {
	private final MonsplodeTradingCardsSolver solver = new MonsplodeTradingCardsSolver();

	@Test
	void valuesCardsUsingSerialIndicatorsBatteriesAndCondition() {
		BombEntity bomb = bomb("AB12CD", 2, Map.of("CAR", true, "FRK", false, "BOB", true));
		MonsplodeTradingCardsOutput output = solve(bomb, new ModuleEntity(), input(
			List.of(card("Aluga", "COMMON", "C4", false, 0), card("Bob", "COMMON", "A2", false, 0),
				card("Buhar", "RARE", "B3", true, 1)),
			card("Asteran", "COMMON", "C4", false, 0), 2
		));

		assertThat(output.handValues()).containsExactly(4d, 5d, 12.25d);
		assertThat(output.offerValue()).isEqualTo(4d);
		assertThat(output.action()).isEqualTo("TRADE");
		assertThat(output.tradeCard()).isEqualTo(1);
	}

	@Test
	void fakeCardsAreWorthZeroAndFinalHandIsKeptForSouvenir() {
		BombEntity bomb = bomb("A112CD", 0, Map.of());
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MONSPLODE_TRADING_CARDS);
		List<Card> hand = List.of(
			card("Aluga", "COMMON", "A2", false, 0),
			card("Bob", "UNCOMMON", "B3", false, 0),
			card("Buhar", "ULTRA_RARE", "C4", false, 0)
		);

		MonsplodeTradingCardsOutput fakeOffer = solve(bomb, module, input(hand, card("Asteran", "COMMON", "A1", true, 0), 1));
		assertThat(fakeOffer.offerValue()).isZero();
		assertThat(fakeOffer.action()).isEqualTo("KEEP");
		solve(bomb, module, input(hand, card("Asteran", "COMMON", "D4", false, 0), 1));
		MonsplodeTradingCardsOutput finalOutput = solve(bomb, module, input(hand, card("Asteran", "COMMON", "I8", false, 0), 1));

		assertThat(finalOutput.stage()).isEqualTo(3);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("souvenirCardNames")).isEqualTo(List.of("Aluga", "Bob", "Buhar"));
		assertThat(module.getState().get("souvenirPrintVersions")).isEqualTo(List.of("A2", "B3", "C4"));
	}

	private MonsplodeTradingCardsOutput solve(BombEntity bomb, ModuleEntity module, MonsplodeTradingCardsInput input) {
		module.setState(module.getState() == null ? new HashMap<>() : module.getState());
		return ((SolveSuccess<MonsplodeTradingCardsOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static MonsplodeTradingCardsInput input(List<Card> hand, Card offer, int selectedCard) {
		return new MonsplodeTradingCardsInput(hand, offer, selectedCard);
	}

	private static Card card(String name, String rarity, String printVersion, boolean foil, int bentCorners) {
		return new Card(name, rarity, printVersion, foil, bentCorners);
	}

	private static BombEntity bomb(String serial, int batteries, Map<String, Boolean> indicators) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		bomb.setIndicators(new HashMap<>(indicators));
		return bomb;
	}
}
