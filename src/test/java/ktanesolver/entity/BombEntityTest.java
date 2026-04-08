package ktanesolver.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

class BombEntityTest {

    private BombEntity bomb(String serial) {
        BombEntity b = new BombEntity();
        b.setSerialNumber(serial);
        b.setIndicators(Map.of());
        return b;
    }

    @Test
    void getLastDigit_returnsLastNumericCharacter() {
        assertThat(bomb("AB1CD2").getLastDigit()).isEqualTo(2);
    }

    @Test
    void getLastDigit_serialWithNoDigits_returnsZero() {
        assertThat(bomb("ABCDEF").getLastDigit()).isEqualTo(0);
    }

    @Test
    void isLastDigitOdd_delegatesToGetLastDigit() {
        assertThat(bomb("AB3").isLastDigitOdd()).isTrue();
        assertThat(bomb("AB4").isLastDigitOdd()).isFalse();
    }

    @Test
    void isLastDigitEven_isOppositeOfOdd() {
        assertThat(bomb("AB4").isLastDigitEven()).isTrue();
        assertThat(bomb("AB3").isLastDigitEven()).isFalse();
    }

    @Test
    void isIndicatorLit_trueWhenLit() {
        BombEntity b = new BombEntity();
        b.setSerialNumber("AA1AA1");
        b.setIndicators(Map.of("SND", true, "CLR", false));
        assertThat(b.isIndicatorLit("SND")).isTrue();
        assertThat(b.isIndicatorLit("CLR")).isFalse();
        assertThat(b.isIndicatorLit("BOB")).isFalse();
    }

    @Test
    void isIndicatorUnlit_trueWhenUnlit() {
        BombEntity b = new BombEntity();
        b.setSerialNumber("AA1AA1");
        b.setIndicators(Map.of("SND", true, "CLR", false));
        assertThat(b.isIndicatorUnlit("CLR")).isTrue();
        assertThat(b.isIndicatorUnlit("SND")).isFalse();
        assertThat(b.isIndicatorUnlit("BOB")).isFalse();
    }
}
