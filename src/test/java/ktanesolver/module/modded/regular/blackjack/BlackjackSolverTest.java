package ktanesolver.module.modded.regular.blackjack;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.blackjack.BlackjackInput.StartingCard;

class BlackjackSolverTest {
	private final BlackjackSolver solver = new BlackjackSolver();

	@Test void followsEveryHiddenCardPriorityList() {
		assertDecision(bomb("BCD123",0,0,Map.of("BOB",true)), StartingCard.ACE_OF_SPADES, "King of Hearts",100);
		assertDecision(bomb("EBC123",0,0,Map.of()), StartingCard.ACE_OF_SPADES, "Five of Diamonds",1);
		assertDecision(bomb("BCD459",0,0,Map.of()), StartingCard.ACE_OF_SPADES, "Seven of Spades",250);
		assertDecision(bomb("BCD102",0,0,Map.of()), StartingCard.ACE_OF_SPADES, "Two of Clubs",10);
		assertDecision(bomb("XYZ123",0,0,Map.of("CAR",false)), StartingCard.KING_OF_DIAMONDS, "Queen of Hearts",250);
		assertDecision(bomb("XYZ123",0,2,Map.of()), StartingCard.KING_OF_DIAMONDS, "Nine of Spades",100);
		assertDecision(bombWithPorts("XYZ123",0,0,Map.of(),Set.of(PortType.SERIAL)), StartingCard.KING_OF_DIAMONDS, "Three of Diamonds",10);
		assertDecision(bomb("XYZ123",0,0,Map.of()), StartingCard.KING_OF_DIAMONDS, "Four of Clubs",1);
		assertDecision(bombWithPorts("XYZ123",0,0,Map.of(),Set.of(PortType.DVI)), StartingCard.TWO_OF_HEARTS, "Ace of Diamonds",100);
		assertDecision(bomb("XYZ123",1,0,Map.of("NSA",false)), StartingCard.TWO_OF_HEARTS, "Three of Hearts",10);
		assertDecision(bomb("XYZ123",0,0,Map.of()), StartingCard.TWO_OF_HEARTS, "Seven of Clubs",250);
		assertDecision(bomb("XYZ123",1,0,Map.of()), StartingCard.TWO_OF_HEARTS, "Four of Spades",1);
		assertDecision(bomb("CZX123",0,0,Map.of()), StartingCard.TEN_OF_CLUBS, "Five of Clubs",100);
		assertDecision(bomb("BDE123",4,0,Map.of()), StartingCard.TEN_OF_CLUBS, "Three of Hearts",1);
		assertDecision(bombWithPorts("BDE123",0,0,Map.of(),Set.of(PortType.PARALLEL)), StartingCard.TEN_OF_CLUBS, "Six of Diamonds",250);
		assertDecision(bomb("BDE123",0,0,Map.of()), StartingCard.TEN_OF_CLUBS, "Ace of Spades",10);
	}

	@Test void returnsTheBetThenCalculatesTheShortestWinningPlay() {
		BombEntity bomb = bomb("BCD102",0,0,Map.of());
		ModuleEntity module = new ModuleEntity();
		var first = success(solver.solve(new RoundEntity(),bomb,module,new BlackjackInput(StartingCard.ACE_OF_SPADES,null)));
		assertThat(first.actions()).containsExactly("bet 10");
		assertThat(first.awaitingExtraCard()).isTrue();
		assertThat(module.getState()).containsEntry("blackjackHiddenCard","Two of Clubs");
		var second = success(solver.solve(new RoundEntity(),bomb,module,new BlackjackInput(StartingCard.ACE_OF_SPADES,6)));
		assertThat(second.dealOrder()).isEqualTo(6);
		assertThat(second.actions()).containsExactly("stand");
		assertThat(second.playerTotal()).isEqualTo(19);
		assertThat(second.dealerTotal()).isEqualTo(15);
	}

	@Test void handlesImmediateBlackjackSoftAceAndValidation() {
		var blackjack = success(solver.solve(new RoundEntity(),bomb("BCD123",0,0,Map.of("BOB",true)),new ModuleEntity(),new BlackjackInput(StartingCard.ACE_OF_SPADES,null)));
		assertThat(blackjack.actions()).containsExactly("check");
		assertThat(blackjack.playerTotal()).isEqualTo(21);
		var soft = success(solver.solve(new RoundEntity(),bomb("BCD459",0,0,Map.of()),new ModuleEntity(),new BlackjackInput(StartingCard.ACE_OF_SPADES,6)));
		assertThat(soft.playerTotal()).isLessThanOrEqualTo(21);
		assertThat(solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new BlackjackInput(StartingCard.TWO_OF_HEARTS,7))).isInstanceOf(SolveFailure.class);
	}

	@Test void findsAWinningPlayForAllEightDealOrders() {
		List<BombEntity> bombs = List.of(
			bomb("EBC123",0,0,Map.of()),
			bomb("BCD102",0,0,Map.of()),
			bombWithPorts("XYZ123",0,0,Map.of(),Set.of(PortType.DVI)),
			bomb("BCD459",0,0,Map.of())
		);
		List<StartingCard> cards = List.of(StartingCard.ACE_OF_SPADES,StartingCard.ACE_OF_SPADES,StartingCard.TWO_OF_HEARTS,StartingCard.ACE_OF_SPADES);
		for (int index=0;index<bombs.size();index++) for (int extra=1;extra<=6;extra++) {
			BlackjackOutput output=success(solver.solve(new RoundEntity(),bombs.get(index),new ModuleEntity(),new BlackjackInput(cards.get(index),extra)));
			assertThat(output.actions()).isNotEmpty().endsWith("stand");
			assertThat(output.playerTotal()).isLessThanOrEqualTo(21);
			assertThat(output.dealerTotal()>21||output.playerTotal()>=output.dealerTotal()).isTrue();
		}
	}

	private void assertDecision(BombEntity bomb, StartingCard card, String hidden, int bet) {
		BlackjackOutput output = success(solver.solve(new RoundEntity(),bomb,new ModuleEntity(),new BlackjackInput(card,null)));
		assertThat(output.hiddenCard()).isEqualTo(hidden);
		assertThat(output.bet()).isEqualTo(bet);
	}

	@SuppressWarnings("unchecked") private static BlackjackOutput success(Object result) { return ((SolveSuccess<BlackjackOutput>) result).output(); }
	private static BombEntity bomb(String serial,int aa,int d,Map<String,Boolean> indicators) { BombEntity bomb=new BombEntity();bomb.setSerialNumber(serial);bomb.setAaBatteryCount(aa);bomb.setDBatteryCount(d);bomb.setIndicators(indicators);return bomb; }
	private static BombEntity bombWithPorts(String serial,int aa,int d,Map<String,Boolean> indicators,Set<PortType> ports) { BombEntity bomb=bomb(serial,aa,d,indicators);bomb.replacePortPlates(List.of(ports));return bomb; }
}
