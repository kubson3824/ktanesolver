
package ktanesolver.logic;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.utils.Json;

public abstract class AbstractModuleSolver<I extends ModuleInput, O extends ModuleOutput> implements ModuleSolver<I, O> {

	private final ModuleInfo moduleInfo;

	protected AbstractModuleSolver() {
		ModuleInfo info = getClass().getAnnotation(ModuleInfo.class);
		if (info == null) {
			throw new IllegalStateException("ModuleSolver must be annotated with @ModuleInfo: " + getClass().getName());
		}
		this.moduleInfo = info;
	}

	@Override
	public ModuleType getType() {
		return moduleInfo.type();
	}

	@Override
	@SuppressWarnings ("unchecked")
	public Class<I> inputType() {
		return (Class<I>)extractGenericType(getClass(), 0);
	}

	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto(
			moduleInfo.id(),
			moduleInfo.name(),
			moduleInfo.category(),
			moduleInfo.type().name(),
			List.of(moduleInfo.tags()),
			moduleInfo.description(),
			moduleInfo.hasInput(),
			moduleInfo.hasOutput(),
			moduleInfo.checkFirst()
		);
	}

	@Override
	public final SolveResult<O> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, I input) {
		SolveResult<O> result = doSolve(round, bomb, module, input);

		if(result instanceof SolveSuccess<O> success) {
			handleSuccess(module, success);
		}

		return result;
	}

	protected abstract SolveResult<O> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, I input);

	protected final SolveResult<O> success(O output) {
		return new SolveSuccess<>(output, true);
	}

	protected final SolveResult<O> success(O output, boolean solved) {
		return new SolveSuccess<>(output, solved);
	}

	protected final SolveResult<O> failure(String message) {
		return new SolveFailure<>(message);
	}

	private void handleSuccess(ModuleEntity module, SolveSuccess<O> success) {
		Map<String, Object> convertedValue = Json.mapper().convertValue(success.output(), new TypeReference<>() {
		});
		convertedValue.forEach(module.getSolution()::put);
		module.setSolved(success.solved());
	}

	protected final void storeState(ModuleEntity module, String key, Object value) {
		if(value != null) {
			module.getState().put(key, value);
		}
	}

	protected final void storeState(ModuleEntity module, Map<String, Object> stateMap) {
		if(stateMap != null) {
			stateMap.forEach((key, value) -> storeState(module, key, value));
		}
	}

	/** Replaces the module state with the serialized form of the given object (e.g. {@code {"stages": [...]}}). */
	protected final <T> void storeTypedState(ModuleEntity module, T state) {
		if (state != null) {
			module.setState(state);
		}
	}

	@SuppressWarnings ("unchecked")
	private static Class<?> extractGenericType(Class<?> clazz, int index) {
		Type superclass = clazz.getGenericSuperclass();
		while(superclass instanceof Class<?>) {
			superclass = ((Class<?>)superclass).getGenericSuperclass();
		}
		if(superclass instanceof ParameterizedType parameterizedType) {
			Type[] typeArgs = parameterizedType.getActualTypeArguments();
			if(index < typeArgs.length && typeArgs[index] instanceof Class<?> typeClass) {
				return typeClass;
			}
		}
		throw new IllegalStateException("Cannot determine generic type for " + clazz.getName());
	}
}
