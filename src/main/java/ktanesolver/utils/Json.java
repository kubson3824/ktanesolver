
package ktanesolver.utils;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

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
