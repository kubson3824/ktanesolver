package ktanesolver.configuration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void mapsResponseStatusExceptionToConsistentErrorBody() throws Exception {
        mockMvc.perform(get("/status"))
                .andExpect(status().isNotImplemented())
                .andExpect(jsonPath("$.status").value(501))
                .andExpect(jsonPath("$.error").value("Not Implemented"))
                .andExpect(jsonPath("$.message").value("No solver is registered for module type VENTING_GAS"));
    }

    @Test
    void mapsIllegalArgumentExceptionToBadRequestErrorBody() throws Exception {
        mockMvc.perform(get("/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Invalid solve input for module type BUTTON"));
    }

    @RestController
    private static class ThrowingController {

        @GetMapping("/status")
        void throwStatus() {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                    "No solver is registered for module type VENTING_GAS");
        }

        @GetMapping("/bad-request")
        void throwBadRequest() {
            throw new IllegalArgumentException("Invalid solve input for module type BUTTON");
        }
    }
}
