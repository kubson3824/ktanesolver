package ktanesolver.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class Json {

    private static ObjectMapper mapper;

    public Json(ObjectMapper mapper) {
        Json.mapper = mapper;
    }

    public static ObjectMapper mapper() {
        return mapper;
    }
}