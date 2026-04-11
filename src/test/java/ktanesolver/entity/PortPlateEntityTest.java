package ktanesolver.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.junit.jupiter.api.Test;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;

class PortPlateEntityTest {

    @Test
    void ports_areEagerlyLoadedToAvoidDetachedSerializationFailures() throws NoSuchFieldException {
        Field portsField = PortPlateEntity.class.getDeclaredField("ports");
        ElementCollection elementCollection = portsField.getAnnotation(ElementCollection.class);

        assertThat(elementCollection).isNotNull();
        assertThat(elementCollection.fetch()).isEqualTo(FetchType.EAGER);
    }
}
