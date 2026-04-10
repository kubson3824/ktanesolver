package ktanesolver.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import ktanesolver.dto.RoundSummaryDto;
import ktanesolver.enums.RoundStatus;
import ktanesolver.service.RoundEventService;
import ktanesolver.service.RoundService;

class RoundControllerTest {

    private MockMvc mockMvc;
    private RoundService roundService;

    @BeforeEach
    void setUp() {
        roundService = mock(RoundService.class);
        RoundEventService roundEventService = mock(RoundEventService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new RoundController(roundService, roundEventService))
                .build();
    }

    @Test
    void getAllRoundsReturnsSummaryCountsWithoutSerializingBombCollections() throws Exception {
        UUID roundId = UUID.randomUUID();
        when(roundService.getAllRoundSummaries()).thenReturn(List.of(
                new RoundSummaryDto(
                        roundId,
                        RoundStatus.ACTIVE,
                        Instant.parse("2026-04-10T12:00:00Z"),
                        3L,
                        2L,
                        11L)
        ));

        mockMvc.perform(get("/rounds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(roundId.toString()))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[0].bombCount").value(2))
                .andExpect(jsonPath("$[0].moduleCount").value(11))
                .andExpect(jsonPath("$[0].bombs").doesNotExist());
    }
}
