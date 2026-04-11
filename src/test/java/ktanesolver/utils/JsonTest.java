package ktanesolver.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

class JsonTest {

    @Test
    void mapperReturnsUsableMapperWithoutSpringInitialization() {
        @SuppressWarnings("unchecked")
        Map<String, Object> converted = Json.mapper().convertValue(Map.of("value", "test"), Map.class);

        assertThat(converted).containsEntry("value", "test");
    }
}
