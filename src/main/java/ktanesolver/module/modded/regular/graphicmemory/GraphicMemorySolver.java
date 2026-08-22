package ktanesolver.module.modded.regular.graphicmemory;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.graphicmemory.GraphicMemoryInput.Shape;

@Service
@ModuleInfo(type = ModuleType.GRAPHIC_MEMORY, id = "graphicMemory", name = "Graphic Memory",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Track prior colored shapes and identify a position tied for the most applicable conditions.",
    tags = {"memory", "colors", "shapes", "positions", "stages"})
public class GraphicMemorySolver extends AbstractModuleSolver<GraphicMemoryInput, GraphicMemoryOutput> {
    private static final List<String> POSITIONS = List.of("TL","TR","BL","BR");
    private static final List<String> COLORS = List.of("RED","BLUE","YELLOW","GREEN","ORANGE","PURPLE");

    @Override protected SolveResult<GraphicMemoryOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, GraphicMemoryInput input) {
        if (input == null || input.pressedPosition() == null || input.shapes() == null) return failure("Enter the pressed button and all shapes on it");
        int position = POSITIONS.indexOf(input.pressedPosition().trim().toUpperCase(Locale.ROOT));
        if (position < 0) return failure("Position must be TL, TR, BL, or BR");
        if (input.shapes().isEmpty()) return failure("Enter at least one shape from the pressed button");
        int presses = input.resetHistory() ? 0 : integer(module.getState().get("graphicMemoryPresses"));
        int[] positions = input.resetHistory() ? new int[4] : ints(module.getState().get("graphicMemoryPositions"),4);
        int[] colors = input.resetHistory() ? new int[6] : ints(module.getState().get("graphicMemoryColors"),6);
        int[] shapeTotals = input.resetHistory() ? new int[2] : ints(module.getState().get("graphicMemoryShapeTotals"),2);
        int[] combinations = input.resetHistory() ? new int[12] : ints(module.getState().get("graphicMemoryCombinations"),12);
        int dominance = input.resetHistory() ? 0 : integer(module.getState().get("graphicMemoryDominance"));

        List<String> valid = presses == 0 ? POSITIONS : valid(positions, colors, shapeTotals, combinations, dominance);
        if (!valid.contains(POSITIONS.get(position))) return failure("That position is not valid; choose one of " + String.join(", ", valid));
        int squareMinusTriangle = 0;
        for (Shape observed : input.shapes()) {
            if (observed == null || observed.color() == null || observed.shape() == null) return failure("Every shape needs a color and shape");
            int color = COLORS.indexOf(observed.color().trim().toUpperCase(Locale.ROOT));
            String shape = observed.shape().trim().toUpperCase(Locale.ROOT);
            if (color < 0 || !(shape.equals("SQUARE") || shape.equals("TRIANGLE"))) return failure("Use the six manual colors and square or triangle");
            int shapeIx = shape.equals("SQUARE") ? 0 : 1;
            colors[color]++; shapeTotals[shapeIx]++; combinations[shapeIx * 6 + color]++;
            squareMinusTriangle += shapeIx == 0 ? 1 : -1;
        }
        positions[position]++; presses++;
        if (squareMinusTriangle > 0) dominance--; else if (squareMinusTriangle < 0) dominance++;
        storeState(module,"graphicMemoryPresses",presses); storeState(module,"graphicMemoryPositions",list(positions));
        storeState(module,"graphicMemoryColors",list(colors)); storeState(module,"graphicMemoryShapeTotals",list(shapeTotals));
        storeState(module,"graphicMemoryCombinations",list(combinations)); storeState(module,"graphicMemoryDominance",dominance);
        List<String> next = presses >= 4 ? List.of() : valid(positions,colors,shapeTotals,combinations,dominance);
        return success(new GraphicMemoryOutput(POSITIONS.get(position),presses,next),presses >= 4);
    }

    private static List<String> valid(int[] p,int[] c,int[] s,int[] combo,int dominance) {
        int uniquePosition = uniqueMax(p), uniqueCombo = uniqueMax(combo);
        boolean allColorsEqual = Arrays.stream(c).allMatch(x -> x == c[0]);
        int warm = c[0]+c[1]+c[2], cool = c[3]+c[4]+c[5];
        int[] scores = {
            bool(uniquePosition==1)+bool(uniqueCombo==7)+bool(dominance>0)+bool(s[0]==s[1]),
            bool(uniquePosition==2)+bool(s[1]>s[0])+bool(warm>cool)+bool(uniqueCombo==9),
            bool(uniquePosition==3)+bool(uniqueCombo==2)+bool(dominance<0)+bool(allColorsEqual),
            bool(uniquePosition==0)+bool(s[0]>s[1])+bool(cool>warm)+bool(uniqueCombo==5)
        };
        int max=Arrays.stream(scores).max().orElse(0); List<String> result=new ArrayList<>();
        for(int i=0;i<4;i++)if(scores[i]==max)result.add(POSITIONS.get(i)); return List.copyOf(result);
    }
    private static int uniqueMax(int[] values){int max=Arrays.stream(values).max().orElse(0),ix=-1;for(int i=0;i<values.length;i++)if(values[i]==max){if(ix>=0)return -1;ix=i;}return ix;}
    private static int bool(boolean value){return value?1:0;}
    private static int integer(Object value){return value instanceof Number n?n.intValue():0;}
    private static int[] ints(Object value,int size){int[] result=new int[size];if(value instanceof List<?> list)for(int i=0;i<Math.min(size,list.size());i++)result[i]=integer(list.get(i));return result;}
    private static List<Integer> list(int[] values){return Arrays.stream(values).boxed().toList();}
}
