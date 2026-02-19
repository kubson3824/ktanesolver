
package ktanesolver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KtaneSolverApplication {

	public static void main(String[] args) {
		SpringApplication.run(KtaneSolverApplication.class, args);
	}
}
