
package ktanesolver.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.enums.ModuleType;

@ Target (ElementType.TYPE)
@Retention (RetentionPolicy.RUNTIME)
public @interface ModuleInfo {
	ModuleType type();

	String id();

	String name();

	ModuleCatalogDto.ModuleCategory category();

	String description();

	String[] tags() default { };

	boolean hasInput() default true;

	boolean hasOutput() default true;
}
