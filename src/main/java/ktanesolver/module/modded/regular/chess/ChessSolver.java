package ktanesolver.module.modded.regular.chess;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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

@Service
@ModuleInfo(
	type = ModuleType.CHESS,
	id = "chess",
	name = "Chess",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the one square not covered by the six chess pieces and enter its coordinate (letter then number).",
	tags = { "chess", "modded" },
	hasInput = true,
	hasOutput = true
)
public class ChessSolver extends AbstractModuleSolver<ChessInput, ChessOutput> {

	private static final int BOARD_SIZE = 6;
	private static final List<String> FILES = List.of("a", "b", "c", "d", "e", "f");

	@Override
	protected SolveResult<ChessOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ChessInput input) {
		List<String> coords = input.coordinates();
		if (coords == null || coords.size() != 6) {
			return failure("Exactly 6 coordinates are required (positions 1–6).");
		}

		int[][] positions = new int[6][2]; // [index][0]=file, [index][1]=rank
		Set<String> seen = new HashSet<>();
		for (int i = 0; i < 6; i++) {
			String c = coords.get(i);
			if (c == null) c = "";
			String normalized = c.trim().toLowerCase();
			if (normalized.length() != 2) {
				return failure("Coordinate at position " + (i + 1) + " must be letter (a–f) then digit (1–6), e.g. a1.");
			}
			int file = FILES.indexOf(normalized.substring(0, 1));
			if (file < 0) {
				return failure("Coordinate at position " + (i + 1) + ": file must be a–f.");
			}
			char rankChar = normalized.charAt(1);
			if (rankChar < '1' || rankChar > '6') {
				return failure("Coordinate at position " + (i + 1) + ": rank must be 1–6.");
			}
			int rank = rankChar - '0';
			if (!seen.add(normalized)) {
				return failure("Duplicate coordinate: " + normalized);
			}
			positions[i][0] = file;
			positions[i][1] = rank;
		}

		ChessPiece[] pieces = resolvePieces(bomb, positions);
		Set<String> occupied = new HashSet<>();
		for (int i = 0; i < 6; i++) {
			occupied.add(key(positions[i][0], positions[i][1]));
		}
		Set<String> attacked = new HashSet<>();
		for (int i = 0; i < 6; i++) {
			addAttacked(positions[i][0], positions[i][1], pieces[i], occupied, attacked);
		}
		String solution = null;
		for (int file = 0; file < BOARD_SIZE; file++) {
			for (int rank = 1; rank <= BOARD_SIZE; rank++) {
				String k = key(file, rank);
				// Only empty squares can be the solution; piece squares are not "uncovered" for submission
				if (!attacked.contains(k) && !occupied.contains(k)) {
					if (solution != null) {
						return failure("Internal error: multiple uncovered squares.");
					}
					solution = FILES.get(file) + rank;
				}
			}
		}
		if (solution == null) {
			return failure("Internal error: no uncovered square found.");
		}
		Map<String, String> pieceAssignments = new HashMap<>();
		for (int i = 0; i < 6; i++) {
			String coord = FILES.get(positions[i][0]) + positions[i][1];
			pieceAssignments.put(coord, pieces[i].name());
		}
		storeState(module, "coordinates", coords);
		storeState(module, "pieceAssignments", pieceAssignments);
		storeState(module, "coordinate", solution);
		return success(new ChessOutput(solution, pieceAssignments));
	}

	private static boolean isWhite(int file, int rank) {
		return (file + rank) % 2 == 0;
	}

	private static String key(int file, int rank) {
		return file + "," + rank;
	}

	/** Resolve piece for each position (0–5). Order: 4, 5, 2, 6, 3, 1 to satisfy dependencies. */
	private ChessPiece[] resolvePieces(BombEntity bomb, int[][] positions) {
		ChessPiece[] pieces = new ChessPiece[6];
		// Position 4 (index 3): always Rook
		pieces[3] = ChessPiece.ROOK;
		// Position 5 (index 4): Queen if white else Rook
		pieces[4] = isWhite(positions[4][0], positions[4][1]) ? ChessPiece.QUEEN : ChessPiece.ROOK;
		// Position 2 (index 1): Rook if last digit odd else Knight
		pieces[1] = bomb.isLastDigitOdd() ? ChessPiece.ROOK : ChessPiece.KNIGHT;
		// Position 6 (index 5): Queen if no other queens, else Knight if no other knights, else Bishop
		int queens = (pieces[4] == ChessPiece.QUEEN ? 1 : 0);
		int knights = (pieces[1] == ChessPiece.KNIGHT ? 1 : 0);
		if (queens == 0) pieces[5] = ChessPiece.QUEEN;
		else if (knights == 0) pieces[5] = ChessPiece.KNIGHT;
		else pieces[5] = ChessPiece.BISHOP;
		// Position 3 (index 2): Queen if < 2 rooks else King
		int rooks = (pieces[3] == ChessPiece.ROOK ? 1 : 0) + (pieces[4] == ChessPiece.ROOK ? 1 : 0);
		pieces[2] = rooks < 2 ? ChessPiece.QUEEN : ChessPiece.KING;
		// Position 1 (index 0): King if position 5 is Queen else Bishop
		pieces[0] = (pieces[4] == ChessPiece.QUEEN) ? ChessPiece.KING : ChessPiece.BISHOP;
		return pieces;
	}

	private void addAttacked(int file, int rank, ChessPiece piece, Set<String> occupied, Set<String> attacked) {
		switch (piece) {
			case KING -> addKingAttacks(file, rank, attacked);
			case QUEEN -> addSlidingAttacks(file, rank, occupied, attacked, true, true);
			case ROOK -> addSlidingAttacks(file, rank, occupied, attacked, true, false);
			case BISHOP -> addSlidingAttacks(file, rank, occupied, attacked, false, true);
			case KNIGHT -> addKnightAttacks(file, rank, attacked);
		}
	}

	private static void addKingAttacks(int file, int rank, Set<String> attacked) {
		for (int df = -1; df <= 1; df++) {
			for (int dr = -1; dr <= 1; dr++) {
				if (df == 0 && dr == 0) continue;
				int f = file + df, r = rank + dr;
				if (inBounds(f, r)) attacked.add(key(f, r));
			}
		}
	}

	private static final int[] KNIGHT_OFFSETS = { -2, -1, 2, 1 };

	private static void addKnightAttacks(int file, int rank, Set<String> attacked) {
		for (int df : KNIGHT_OFFSETS) {
			for (int dr : KNIGHT_OFFSETS) {
				if (Math.abs(df) == Math.abs(dr)) continue;
				int f = file + df, r = rank + dr;
				if (inBounds(f, r)) attacked.add(key(f, r));
			}
		}
	}

	private void addSlidingAttacks(int file, int rank, Set<String> occupied, Set<String> attacked,
		boolean rookLike, boolean bishopLike) {
		if (rookLike) {
			for (int f = file - 1; f >= 0; f--) { if (!addUntilBlocked(f, rank, occupied, attacked)) break; }
			for (int f = file + 1; f < BOARD_SIZE; f++) { if (!addUntilBlocked(f, rank, occupied, attacked)) break; }
			for (int r = rank - 1; r >= 1; r--) { if (!addUntilBlocked(file, r, occupied, attacked)) break; }
			for (int r = rank + 1; r <= BOARD_SIZE; r++) { if (!addUntilBlocked(file, r, occupied, attacked)) break; }
		}
		if (bishopLike) {
			for (int d = 1; d < BOARD_SIZE; d++) {
				if (file - d >= 0 && rank - d >= 1) { if (!addUntilBlocked(file - d, rank - d, occupied, attacked)) break; } else break;
			}
			for (int d = 1; d < BOARD_SIZE; d++) {
				if (file - d >= 0 && rank + d <= BOARD_SIZE) { if (!addUntilBlocked(file - d, rank + d, occupied, attacked)) break; } else break;
			}
			for (int d = 1; d < BOARD_SIZE; d++) {
				if (file + d < BOARD_SIZE && rank - d >= 1) { if (!addUntilBlocked(file + d, rank - d, occupied, attacked)) break; } else break;
			}
			for (int d = 1; d < BOARD_SIZE; d++) {
				if (file + d < BOARD_SIZE && rank + d <= BOARD_SIZE) { if (!addUntilBlocked(file + d, rank + d, occupied, attacked)) break; } else break;
			}
		}
	}

	/** Add one square; return false if blocked (occupied). */
	private boolean addUntilBlocked(int file, int rank, Set<String> occupied, Set<String> attacked) {
		String k = key(file, rank);
		attacked.add(k);
		return !occupied.contains(k);
	}

	private static boolean inBounds(int file, int rank) {
		return file >= 0 && file < BOARD_SIZE && rank >= 1 && rank <= BOARD_SIZE;
	}

	private enum ChessPiece {
		KING, QUEEN, ROOK, BISHOP, KNIGHT
	}
}
