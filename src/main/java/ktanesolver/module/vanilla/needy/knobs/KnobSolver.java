package ktanesolver.module.vanilla.needy.knobs;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.HashMap;

@Component
public class KnobSolver {
    
    public static class KnobRequest {
        private boolean[] indicators = new boolean[12];
        
        public boolean[] getIndicators() {
            return indicators;
        }
        
        public void setIndicators(boolean[] indicators) {
            this.indicators = indicators;
        }
    }
    
    public static class KnobResponse {
        private String position;
        
        public KnobResponse(String position) {
            this.position = position;
        }
        
        public String getPosition() {
            return position;
        }
        
        public void setPosition(String position) {
            this.position = position;
        }
    }
    
    public KnobResponse solveKnob(KnobRequest request) {
        boolean[] i = request.getIndicators();
        
        // Ensure we have at least 12 indicators
        if (i.length < 12) {
            boolean[] extended = new boolean[12];
            System.arraycopy(i, 0, extended, 0, i.length);
            i = extended;
        }
        
        // Logic from the original NeedyKnobs implementation
        if ((i[2] && i[4] && i[5] && i[6] && i[7] && i[8] && i[9] && i[11]) || 
            (i[0] && i[2] && i[4] && i[7] && i[8] && i[10] && i[11])) {
            return new KnobResponse("Up");
        }
        
        if ((i[1] && i[2] && i[5] && i[6] && i[7] && i[8] && i[9] && i[11]) || 
            (i[0] && i[2] && i[4] && i[7] && i[11])) {
            return new KnobResponse("Down");
        }
        
        if ((i[4] && i[6] && i[9] && i[10] && i[11]) || 
            (i[4] && i[9] && i[10])) {
            return new KnobResponse("Left");
        }
        
        if ((i[0] && i[2] && i[3] && i[4] && i[5] && i[6] && i[7] && i[8] && i[10]) || 
            (i[0] && i[2] && i[3] && i[6] && i[7] && i[8] && i[10])) {
            return new KnobResponse("Right");
        }
        
        return new KnobResponse("Unknown configuration");
    }
}
