package ktanesolver.module.modded.regular.sillyslots;

import java.util.ArrayList;
import java.util.List;

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
	type = ModuleType.SILLY_SLOTS,
	id = "silly-slots",
	name = "Silly Slots",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press KEEP when the slots are legal, pull the lever when illegal. Module defuses after 4 lever pulls.",
	tags = { "slots", "modded" },
	hasInput = true,
	hasOutput = true
)
public class SillySlotsSolver extends AbstractModuleSolver<SillySlotsInput, SillySlotsOutput> {

	/** Resolved slot: (adjective meaning, noun meaning, colour) after substitution. */
	private record ResolvedSlot(Keyword adjMeaning, Keyword nounMeaning, Keyword colour) {
		static ResolvedSlot of(Slot slot, Keyword keyword) {
			return new ResolvedSlot(
				SillySlotsMatrix.substituteAdjective(slot.adjective(), keyword),
				SillySlotsMatrix.substituteNoun(slot.noun(), keyword),
				slot.colour()
			);
		}
	}

	@Override
	protected SolveResult<SillySlotsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SillySlotsInput input) {
		if (input.slots() == null || input.slots().size() != 3) {
			return failure("Exactly 3 slots are required");
		}
		Keyword keyword = input.keyword();
		if (keyword == null) {
			return failure("Keyword is required");
		}

		SillySlotsState state = module.getStateAs(SillySlotsState.class, SillySlotsState::new);
		if (state.leverPullCount() >= 4) {
			return success(new SillySlotsOutput(true), true);
		}

		List<ResolvedSlot> current = input.slots().stream()
			.map(s -> ResolvedSlot.of(s, keyword))
			.toList();

		Keyword sillySubst = SillySlotsMatrix.substitute("SILLY", keyword);
		Keyword sassySubst = keyword; // Sassy placeholder = keyword
		Keyword soggySubst = SillySlotsMatrix.substitute("SOGGY", keyword);
		Keyword sallySubst = SillySlotsMatrix.substitute("SALLY", keyword);
		Keyword simonSubst = SillySlotsMatrix.substitute("SIMON", keyword);
		Keyword sausageSubst = SillySlotsMatrix.substitute("SAUSAGE", keyword);
		Keyword stevenSubst = SillySlotsMatrix.substitute("STEVEN", keyword);

		// For rule 2 we need "slot in same position 2 stages ago was Soggy" — use raw adjective, not substituted.
		List<Slot> twoAgoRaw = (state.twoStagesAgoSlots() != null && state.twoStagesAgoSlots().size() == 3)
			? state.twoStagesAgoSlots() : null;

		Integer illegalRule = null;
		if (illegalRule == null) illegalRule = rule1(current, sillySubst, sausageSubst);
		if (illegalRule == null) illegalRule = rule2(current, sassySubst, sallySubst, twoAgoRaw);
		if (illegalRule == null) illegalRule = rule3(current, soggySubst, stevenSubst);
		if (illegalRule == null) illegalRule = rule4(current, simonSubst, sassySubst);
		if (illegalRule == null) illegalRule = rule5(current, sausageSubst, sallySubst, soggySubst);
		if (illegalRule == null) illegalRule = rule6(current, sillySubst, stevenSubst);
		if (illegalRule == null) illegalRule = rule7(current, soggySubst, sausageSubst, state);
		if (illegalRule == null) illegalRule = rule8(current, state);
		if (illegalRule == null) illegalRule = rule9(current, sallySubst, sillySubst, stevenSubst, state);
		if (illegalRule == null) illegalRule = rule10(current, sillySubst, simonSubst, state);

		boolean legal = (illegalRule == null);

		if (!legal) {
			// Advance state: current -> previous, previous -> twoStagesAgo; update flags
			boolean hadSoggySausage = state.hadSoggySausageInAnyPreviousStage();
			boolean hadSassySausage = state.hadSassySausageInAnyPreviousStage();
			for (Slot s : input.slots()) {
				if (s.adjective() == Adjective.SOGGY && s.noun() == Noun.SAUSAGE) hadSoggySausage = true;
				if (s.adjective() == Adjective.SASSY && s.noun() == Noun.SAUSAGE) hadSassySausage = true;
			}
			boolean lastSillySteven = current.stream().anyMatch(r ->
				r.adjMeaning() == sillySubst && r.nounMeaning() == stevenSubst);
			boolean prevSausage = current.stream().anyMatch(r -> r.nounMeaning() == sausageSubst);
			int nextPulls = state.leverPullCount() + 1;

			SillySlotsState newState = new SillySlotsState(
				new ArrayList<>(input.slots()),
				state.previousStageSlots() != null ? new ArrayList<>(state.previousStageSlots()) : null,
				hadSoggySausage,
				hadSassySausage,
				lastSillySteven,
				prevSausage,
				nextPulls
			);
			storeTypedState(module, newState);
			boolean solved = nextPulls >= 4;
			return success(new SillySlotsOutput(legal, illegalRule), solved);
		}

		return success(new SillySlotsOutput(legal, illegalRule), false);
	}

	/** Rule 1: Exactly one Silly Sausage. */
	private static Integer rule1(List<ResolvedSlot> current, Keyword sillySubst, Keyword sausageSubst) {
		long n = current.stream().filter(r -> r.adjMeaning() == sillySubst && r.nounMeaning() == sausageSubst).count();
		return n == 1 ? 1 : null;
	}

	/** Rule 2: Exactly one Sassy Sally, unless the slot in the same position 2 stages ago was Soggy. */
	private static Integer rule2(List<ResolvedSlot> current, Keyword sassySubst, Keyword sallySubst,
			List<Slot> twoAgoRaw) {
		int count = 0;
		int sassySallyIndex = -1;
		for (int i = 0; i < current.size(); i++) {
			ResolvedSlot r = current.get(i);
			if (r.adjMeaning() == sassySubst && r.nounMeaning() == sallySubst) {
				count++;
				sassySallyIndex = i;
			}
		}
		if (count != 1) return null;
		if (twoAgoRaw != null && sassySallyIndex >= 0 && sassySallyIndex < twoAgoRaw.size()
			&& twoAgoRaw.get(sassySallyIndex).adjective() == Adjective.SOGGY) {
			return null; // same position 2 stages ago was Soggy -> legal
		}
		return 2;
	}

	/** Rule 3: 2+ Soggy Stevens. */
	private static Integer rule3(List<ResolvedSlot> current, Keyword soggySubst, Keyword stevenSubst) {
		long n = current.stream().filter(r -> r.adjMeaning() == soggySubst && r.nounMeaning() == stevenSubst).count();
		return n >= 2 ? 3 : null;
	}

	/** Rule 4: 3 Simons, unless any of them are Sassy. */
	private static Integer rule4(List<ResolvedSlot> current, Keyword simonSubst, Keyword sassySubst) {
		long simons = current.stream().filter(r -> r.nounMeaning() == simonSubst).count();
		if (simons != 3) return null;
		boolean anySassy = current.stream().anyMatch(r -> r.nounMeaning() == simonSubst && r.adjMeaning() == sassySubst);
		return anySassy ? null : 4;
	}

	/** Rule 5: Sausage adjacent to Sally, unless every adjacent Sally is Soggy. */
	private static Integer rule5(List<ResolvedSlot> current, Keyword sausageSubst, Keyword sallySubst, Keyword soggySubst) {
		boolean sausageAdjacentToSally = false;
		boolean allAdjacentSallySoggy = true;
		for (int i = 0; i < current.size() - 1; i++) {
			ResolvedSlot a = current.get(i);
			ResolvedSlot b = current.get(i + 1);
			boolean iIsSausage = a.nounMeaning() == sausageSubst;
			boolean iIsSally = a.nounMeaning() == sallySubst;
			boolean jIsSausage = b.nounMeaning() == sausageSubst;
			boolean jIsSally = b.nounMeaning() == sallySubst;
			if ((iIsSausage && jIsSally) || (iIsSally && jIsSausage)) {
				sausageAdjacentToSally = true;
				if (iIsSally && a.adjMeaning() != soggySubst) allAdjacentSallySoggy = false;
				if (jIsSally && b.adjMeaning() != soggySubst) allAdjacentSallySoggy = false;
			}
		}
		if (!sausageAdjacentToSally) return null;
		return allAdjacentSallySoggy ? null : 5;
	}

	/** Rule 6: Exactly 2 Silly slots, unless they are both Steven. */
	private static Integer rule6(List<ResolvedSlot> current, Keyword sillySubst, Keyword stevenSubst) {
		long sillyCount = current.stream().filter(r -> r.adjMeaning() == sillySubst).count();
		if (sillyCount != 2) return null;
		long sillyStevenCount = current.stream().filter(r ->
			r.adjMeaning() == sillySubst && r.nounMeaning() == stevenSubst).count();
		return sillyStevenCount == 2 ? null : 6;
	}

	/** Rule 7: Exactly one Soggy slot, unless previous stage had any Sausage. */
	private static Integer rule7(List<ResolvedSlot> current, Keyword soggySubst, Keyword sausageSubst, SillySlotsState state) {
		long soggyCount = current.stream().filter(r -> r.adjMeaning() == soggySubst).count();
		if (soggyCount != 1) return null;
		return state.previousStageHadSausage() ? null : 7;
	}

	/** Rule 8: All 3 same symbol and colour, unless Soggy Sausage in any previous stage. */
	private static Integer rule8(List<ResolvedSlot> current, SillySlotsState state) {
		if (state.hadSoggySausageInAnyPreviousStage()) return null;
		ResolvedSlot first = current.get(0);
		Keyword symAdj = first.adjMeaning();
		Keyword symNoun = first.nounMeaning();
		Keyword col = first.colour();
		boolean allSame = current.stream().allMatch(r ->
			r.adjMeaning() == symAdj && r.nounMeaning() == symNoun && r.colour() == col);
		return allSame ? 8 : null;
	}

	/** Rule 9: All 3 same colour, unless any Sally or Silly Steven in last stage. */
	private static Integer rule9(List<ResolvedSlot> current, Keyword sallySubst, Keyword sillySubst,
			Keyword stevenSubst, SillySlotsState state) {
		Keyword col = current.get(0).colour();
		if (current.stream().anyMatch(r -> r.colour() != col)) return null;
		if (current.stream().anyMatch(r -> r.nounMeaning() == sallySubst)) return null;
		if (state.lastStageHadSillySteven()) return null;
		return 9;
	}

	/** Rule 10: Any Silly Simons, unless Sassy Sausage in any previous stage. */
	private static Integer rule10(List<ResolvedSlot> current, Keyword sillySubst, Keyword simonSubst, SillySlotsState state) {
		if (state.hadSassySausageInAnyPreviousStage()) return null;
		boolean anySillySimon = current.stream().anyMatch(r ->
			r.adjMeaning() == sillySubst && r.nounMeaning() == simonSubst);
		return anySillySimon ? 10 : null;
	}
}
