package ktanesolver.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import ktanesolver.service.BombService;

class BombConfigControllerTest {

    private MockMvc mockMvc;
    private BombService bombService;

    @BeforeEach
    void setUp() {
        bombService = mock(BombService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new BombConfigController(bombService)).build();
    }

    @Test
    void deleteBombUsesBombEndpoint() throws Exception {
        UUID bombId = UUID.randomUUID();

        mockMvc.perform(delete("/bombs/{bombId}", bombId))
                .andExpect(status().isOk());

        verify(bombService).deleteBomb(bombId);
    }
}
