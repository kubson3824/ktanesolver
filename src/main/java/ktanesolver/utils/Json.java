
package ktanesolver.utils;

import java.util.Objects;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

@Component
public class Json {

	private static ObjectMapper mapper = JsonMapper.builder()
		.findAndAddModules()
		.build();

	public Json(ObjectMapper mapper) {
		Json.mapper = Objects.requireNonNull(mapper);
	}

	public static ObjectMapper mapper() {
		return mapper;
	}
}
