package ktanesolver.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class ModuleCatalogDtoJsonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serializesCatalogFlagsWithExplicitInputOutputNames() throws Exception {
        ModuleCatalogDto dto = new ModuleCatalogDto(
                "wires",
                "Wires",
                ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
                "WIRES",
                List.of("vanilla"),
                "Cut the right wire",
                true,
                true,
                false);

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json).contains("\"hasInput\":true");
        assertThat(json).contains("\"hasOutput\":true");
        assertThat(json).doesNotContain("isSolvable");
        assertThat(json).doesNotContain("hasSolver");
    }
}
