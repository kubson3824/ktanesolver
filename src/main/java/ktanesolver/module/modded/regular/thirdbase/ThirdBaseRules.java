package ktanesolver.module.modded.regular.thirdbase;

import java.util.List;

import ktanesolver.module.vanilla.regular.whosonfirst.ButtonPosition;

final class ThirdBaseRules {
	static final List<String> LABELS = List.of(
		"NHXS", "IH6X", "XI8Z", "I8O9", "XOHZ", "H68S", "8OXN", "Z8IX", "SXHN", "6NZH", "H6SI", "6O8I", "NXO8", "66I8",
		"S89H", "SNZX", "9NZS", "8I99", "ZHOX", "SI9X", "SZN6", "ZSN8", "HZN9", "X9HI", "IS9H", "XZNS", "X6IS", "8NSZ"
	);

	private static final ButtonPosition[] DISPLAY_POSITIONS = {
		ButtonPosition.MIDDLE_LEFT, ButtonPosition.TOP_RIGHT, ButtonPosition.BOTTOM_RIGHT, ButtonPosition.TOP_RIGHT,
		ButtonPosition.BOTTOM_RIGHT, ButtonPosition.MIDDLE_LEFT, ButtonPosition.BOTTOM_LEFT, ButtonPosition.MIDDLE_RIGHT,
		ButtonPosition.BOTTOM_RIGHT, ButtonPosition.MIDDLE_LEFT, ButtonPosition.BOTTOM_RIGHT, ButtonPosition.MIDDLE_RIGHT,
		ButtonPosition.MIDDLE_RIGHT, ButtonPosition.BOTTOM_LEFT, ButtonPosition.BOTTOM_LEFT, ButtonPosition.BOTTOM_RIGHT,
		ButtonPosition.MIDDLE_RIGHT, ButtonPosition.BOTTOM_RIGHT, ButtonPosition.MIDDLE_RIGHT, ButtonPosition.MIDDLE_RIGHT,
		ButtonPosition.TOP_LEFT, ButtonPosition.BOTTOM_RIGHT, ButtonPosition.BOTTOM_LEFT, ButtonPosition.MIDDLE_RIGHT,
		ButtonPosition.MIDDLE_LEFT, ButtonPosition.BOTTOM_RIGHT, ButtonPosition.TOP_RIGHT, ButtonPosition.BOTTOM_RIGHT
	};

	private static final int[][] PRIORITIES = {
		{3, 10, 6, 11, 5, 4, 13, 2, 1, 0, 9, 7, 8, 12},
		{6, 10, 3, 11, 0, 7, 8, 13, 9, 4, 12, 5, 1, 2},
		{0, 3, 4, 11, 9, 13, 10, 7, 2, 8, 5, 6, 1, 12},
		{11, 8, 5, 0, 6, 1, 12, 3, 9, 2, 7, 13, 4, 10},
		{6, 4, 9, 1, 2, 7, 11, 8, 3, 5, 12, 0, 13, 10},
		{9, 3, 0, 11, 8, 10, 1, 6, 12, 2, 7, 4, 13, 5},
		{2, 1, 9, 4, 3, 0, 10, 8, 13, 7, 6, 11, 12, 5},
		{12, 10, 3, 11, 7, 13, 2, 1, 8, 4, 9, 6, 0, 5},
		{7, 6, 12, 5, 4, 2, 10, 0, 1, 9, 13, 3, 8, 11},
		{10, 9, 5, 8, 11, 0, 7, 4, 6, 12, 13, 2, 3, 1},
		{0, 1, 2, 13, 8, 12, 4, 10, 11, 9, 6, 7, 3, 5},
		{7, 2, 3, 4, 1, 13, 8, 12, 9, 11, 10, 5, 6, 0},
		{6, 8, 7, 3, 0, 9, 5, 13, 4, 12, 1, 2, 10, 11},
		{10, 11, 0, 2, 13, 3, 1, 6, 7, 9, 5, 4, 8, 12},
		{15, 27, 24, 19, 22, 20, 21, 23, 14, 16, 26, 25, 17, 18},
		{15, 18, 17, 16, 23, 25, 21, 24, 27, 26, 22, 20, 14, 19},
		{27, 17, 18, 22, 24, 15, 20, 25, 19, 16, 21, 26, 23, 14},
		{18, 24, 26, 15, 19, 23, 21, 25, 16, 14, 22, 27, 20, 17},
		{21, 17, 15, 18, 24, 20, 27, 14, 22, 16, 19, 25, 26, 23},
		{16, 25, 22, 18, 14, 23, 21, 26, 17, 15, 20, 24, 19, 27},
		{23, 14, 20, 15, 19, 27, 18, 25, 22, 26, 24, 21, 17, 16},
		{20, 14, 17, 22, 24, 21, 23, 16, 15, 26, 18, 27, 25, 19},
		{16, 22, 20, 24, 21, 17, 14, 18, 19, 15, 27, 23, 26, 25},
		{27, 15, 24, 19, 18, 20, 22, 25, 26, 16, 14, 17, 21, 23},
		{19, 15, 21, 18, 25, 27, 24, 26, 23, 17, 20, 22, 14, 16},
		{17, 14, 23, 21, 16, 20, 27, 19, 22, 24, 25, 15, 18, 26},
		{22, 24, 14, 20, 25, 23, 21, 19, 15, 16, 26, 27, 17, 18},
		{17, 23, 26, 22, 16, 25, 15, 20, 27, 14, 19, 24, 18, 21}
	};

	static ButtonPosition displayPosition(int labelIndex) {
		return DISPLAY_POSITIONS[labelIndex];
	}

	static int[] priorities(int labelIndex) {
		return PRIORITIES[labelIndex];
	}

	private ThirdBaseRules() {
	}
}
