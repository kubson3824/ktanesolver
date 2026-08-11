package ktanesolver.module.modded.regular.shikaku;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.shikaku.ShikakuInput.Clue;
import ktanesolver.module.modded.regular.shikaku.ShikakuOutput.Region;

@Service
@ModuleInfo(type = ModuleType.SHIKAKU, id = "shikaku", name = "Shikaku",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Partition a 6×6 grid into numbered regions and oriented symbol shapes.",
	tags = {"grid", "shapes", "partition", "exact cover"})
public class ShikakuSolver extends AbstractModuleSolver<ShikakuInput, ShikakuOutput> {
	private static final String MANUAL = "GWEKTYAIOUSDMQHJRLBXCVZNF";
	private static final int[][] DIR = {{0,-1},{1,0},{0,1},{-1,0}};

	@Override protected SolveResult<ShikakuOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ShikakuInput input) {
		if (input == null || input.clues() == null || input.clues().isEmpty()) return failure("Enter every numbered or symbol clue");
		List<Parsed> clues = new ArrayList<>(); Set<Integer> clueCells = new HashSet<>(); int numberSum = 0;
		for (Clue raw : input.clues()) {
			if (raw == null || raw.cell() == null || raw.shown() == null) return failure("Every clue needs a cell and displayed value");
			int cell = cell(raw.cell()); if (cell < 0 || !clueCells.add(cell)) return failure("Clue cells must be unique A1 through F6");
			String shown = raw.shown().trim().toUpperCase(Locale.ROOT), alternate = raw.alternate() == null ? "" : raw.alternate().trim().toUpperCase(Locale.ROOT);
			if (shown.matches("[2-7]")) { if (!alternate.isEmpty()) return failure("Number clues do not have an alternate symbol"); numberSum += Integer.parseInt(shown); clues.add(new Parsed(cell, shown, shown, true)); }
			else {
				if (shown.length() != 1 || alternate.length() != 1 || shown.equals(alternate) || MANUAL.indexOf(shown) < 0 || MANUAL.indexOf(alternate) < 0)
					return failure("Symbol clues need two distinct letters from the manual diagram");
				clues.add(new Parsed(cell, shown, alternate, false));
			}
		}
		int selector = (numberSum - 1) % 4 + 1;
		List<List<Long>> options = new ArrayList<>();
		for (Parsed clue : clues) {
			String correct = clue.number() ? clue.shown() : correctHint(clue.shown(), clue.alternate(), selector);
			clue.correct = correct;
			Set<Long> generated = clue.number() ? numberRegions(clue.cell(), Integer.parseInt(correct)) : symbolRegions(correct.charAt(0));
			long own = 1L << clue.cell();
			List<Long> valid = generated.stream().filter(mask -> (mask & own) != 0 && clueCells.stream().allMatch(other -> other == clue.cell() || (mask & (1L << other)) == 0)).toList();
			if (valid.isEmpty()) return failure("No valid region can contain clue " + coordinate(clue.cell()));
			options.add(valid);
		}
		long[] chosen = new long[clues.size()];
		if (!cover(clues, options, chosen, 0L, 0)) return failure("The observations do not produce a complete valid partition");
		List<Region> regions = new ArrayList<>(); List<String> presses = new ArrayList<>();
		for (int i = 0; i < clues.size(); i++) {
			Parsed clue = clues.get(i); String clueCell = coordinate(clue.cell()); presses.add(clueCell);
			if (!clue.number() && !clue.shown().equals(clue.correct)) presses.add(clueCell);
			List<String> cells = cells(chosen[i]); cells.stream().filter(value -> !value.equals(clueCell)).forEach(presses::add);
			regions.add(new Region(clueCell, clue.correct, cells));
		}
		return success(new ShikakuOutput(regions, presses));
	}

	static String correctHint(String first, String second, int selector) {
		int a = MANUAL.indexOf(first), b = MANUAL.indexOf(second); int[] anchor = switch (selector) { case 1 -> new int[]{2,-1}; case 2 -> new int[]{5,2}; case 3 -> new int[]{2,5}; default -> new int[]{-1,2}; };
		int da = Math.abs(a % 5 - anchor[0]) + Math.abs(a / 5 - anchor[1]), db = Math.abs(b % 5 - anchor[0]) + Math.abs(b / 5 - anchor[1]);
		boolean adjacent = Math.abs(a % 5 - b % 5) + Math.abs(a / 5 - b / 5) == 1;
		return (adjacent ? da >= db : da <= db) ? first : second;
	}

	private static boolean cover(List<Parsed> clues, List<List<Long>> options, long[] chosen, long occupied, int count) {
		if (count == clues.size()) return occupied == (1L << 36) - 1;
		int best = -1; List<Long> candidates = null;
		for (int i = 0; i < clues.size(); i++) if (chosen[i] == 0) {
			List<Long> available = options.get(i).stream().filter(mask -> (mask & occupied) == 0).toList();
			if (available.isEmpty()) return false;
			if (candidates == null || available.size() < candidates.size()) { best = i; candidates = available; }
		}
		for (long mask : candidates) { chosen[best] = mask; if (cover(clues, options, chosen, occupied | mask, count + 1)) return true; chosen[best] = 0; }
		return false;
	}

	static Set<Long> symbolRegions(char hint) {
		String chars; Shape shape;
		if ((chars="ABAB").indexOf(hint)>=0) shape=Shape.LINE; else if ((chars="CDEF").indexOf(hint)>=0) shape=Shape.L;
		else if ((chars="GHIJ").indexOf(hint)>=0) shape=Shape.T; else if ((chars="KLMN").indexOf(hint)>=0) shape=Shape.U;
		else if (hint=='O') { chars="OOOO"; shape=Shape.PLUS; } else if ((chars="QRQR").indexOf(hint)>=0) shape=Shape.H;
		else if ((chars="STST").indexOf(hint)>=0) shape=Shape.SMALL_S; else if ((chars="UVUV").indexOf(hint)>=0) shape=Shape.SMALL_Z;
		else if ((chars="WXWX").indexOf(hint)>=0) shape=Shape.LARGE_S; else { chars="YZYZ"; shape=Shape.LARGE_Z; }
		int d = chars.indexOf(hint), r = (d + 1) % 4; Set<Long> out = new LinkedHashSet<>();
		for (int p=0;p<36;p++) for (int a=2;a<=6;a++) for (int b=2;b<=6;b++) {
			if (shape==Shape.LINE) add(out, line(p,d,a));
			if (shape==Shape.L) add(out, line(p,d,a),line(p,r,b));
			if (shape==Shape.T) for(int c=2;c<=6;c++) add(out,line(p,(d+2)%4,a),line(p,(r+2)%4,b),line(p,r,c));
			if (shape==Shape.U) { int q=move(p,r,b-1); if(q>=0) for(int c=2;c<=6;c++) add(out,line(p,r,b),line(p,d,a),line(q,d,c)); }
			if (shape==Shape.SMALL_S||shape==Shape.SMALL_Z||shape==Shape.LARGE_S||shape==Shape.LARGE_Z) {
				int connector=(shape==Shape.SMALL_S||shape==Shape.SMALL_Z)?1:2; int vd=(shape==Shape.SMALL_Z||shape==Shape.LARGE_Z)?(d+2)%4:d;
				int q=move(move(p,r,a-1),vd,connector); if(q>=0) add(out,line(p,r,a),line(move(p,r,a-1),vd,connector+1),line(q,r,b));
			}
		}
		if (shape==Shape.PLUS) for(int p=0;p<36;p++) for(int a=2;a<=6;a++) for(int b=2;b<=6;b++) for(int c=2;c<=6;c++) for(int e=2;e<=6;e++) add(out,line(p,d,a),line(p,(d+2)%4,b),line(p,r,c),line(p,(r+2)%4,e));
		if (shape==Shape.H) for(int p=0;p<36;p++) for(int sep=3;sep<=6;sep++) { int q=move(p,r,sep-1); if(q<0) continue; for(int a=2;a<=6;a++) for(int b=2;b<=6;b++) for(int c=2;c<=6;c++) for(int e=2;e<=6;e++) add(out,line(p,r,sep),line(p,d,a),line(p,(d+2)%4,b),line(q,d,c),line(q,(d+2)%4,e)); }
		return out;
	}

	private static Set<Long> numberRegions(int clue, int size) { Set<Long> out=new LinkedHashSet<>(); grow(1L<<clue,size,out); return out; }
	private static void grow(long mask,int size,Set<Long> out) { if(Long.bitCount(mask)==size){out.add(mask);return;} long edge=0; for(int i=0;i<36;i++) if((mask&(1L<<i))!=0) for(int d=0;d<4;d++){int n=move(i,d,1);if(n>=0)edge|=1L<<n;} edge&=~mask; while(edge!=0){long bit=Long.lowestOneBit(edge);edge-=bit;grow(mask|bit,size,out);} }
	private static long line(int p,int d,int length) { long mask=0; for(int i=0;i<length;i++){int n=move(p,d,i);if(n<0)return -1;mask|=1L<<n;} return mask; }
	private static void add(Set<Long> out,long... masks){long result=0;for(long mask:masks){if(mask<0)return;result|=mask;}out.add(result);}
	private static int move(int p,int d,int steps){int x=p%6+DIR[d][0]*steps,y=p/6+DIR[d][1]*steps;return x<0||x>5||y<0||y>5?-1:y*6+x;}
	private static int cell(String value){String s=value.trim().toUpperCase(Locale.ROOT);return s.matches("[A-F][1-6]")?(s.charAt(1)-'1')*6+s.charAt(0)-'A':-1;}
	private static String coordinate(int cell){return Character.toString((char)('A'+cell%6))+(cell/6+1);}
	private static List<String> cells(long mask){List<String> out=new ArrayList<>();for(int i=0;i<36;i++)if((mask&(1L<<i))!=0)out.add(coordinate(i));return out;}
	private enum Shape {LINE,L,T,U,PLUS,H,SMALL_S,SMALL_Z,LARGE_S,LARGE_Z}
	private static final class Parsed { final int cell; final String shown,alternate; final boolean number; String correct; Parsed(int c,String s,String a,boolean n){cell=c;shown=s;alternate=a;number=n;} int cell(){return cell;} String shown(){return shown;} String alternate(){return alternate;} boolean number(){return number;} }
}
