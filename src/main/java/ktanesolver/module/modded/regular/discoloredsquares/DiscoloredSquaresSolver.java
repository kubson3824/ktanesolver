package ktanesolver.module.modded.regular.discoloredsquares;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.DISCOLORED_SQUARES,id="DiscoloredSquaresModule",name="Discolored Squares",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Remember the four singular squares, then transform each stage's active squares.",tags={"colored squares","grid","multi-stage","souvenir"})
public class DiscoloredSquaresSolver extends AbstractModuleSolver<DiscoloredSquaresInput,DiscoloredSquaresOutput>{
    private enum Instruction{NW,NE,N,R180,DIAG_BACK,SW,MIRROR_VERTICAL,STAY,DIAG_SLASH,E,CW,W,MIRROR_HORIZONTAL,S,CCW,SE}
    private static final Instruction[] INSTRUCTIONS=Instruction.values();
    private static final int[][] ORDER={
        {5,12,1,15,14,13,7,3,9,4,6,10,16,2,8,11},
        {1,14,6,7,12,15,3,10,16,4,2,11,9,8,13,5},
        {6,15,3,5,11,8,13,14,2,10,1,4,4,11,3,14},
        {16,12,7,8,5,2,6,9,1,13,15,10,1,2,3,4}
    };
    @Override protected SolveResult<DiscoloredSquaresOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,DiscoloredSquaresInput input){
        if(input==null||input.stage()==null||input.colors()==null||input.colors().size()!=16)return failure("Enter the stage and all sixteen square colors");
        if(input.stage()<0||input.stage()>4)return failure("Stage must be 0 for the initial grid or 1 through 4");
        List<String> colors=input.colors().stream().map(DiscoloredSquaresSolver::color).toList();if(colors.stream().anyMatch(Objects::isNull))return failure("Use Blue, Green, Magenta, Red, Yellow, or White");
        if(input.stage()==0){
            List<Integer> positions=new ArrayList<>();List<String> rememberedColors=new ArrayList<>();
            for(String c:List.of("Blue","Green","Magenta","Red","Yellow")){List<Integer> hits=new ArrayList<>();for(int i=0;i<16;i++)if(colors.get(i).equals(c))hits.add(i);if(hits.size()==1){positions.add(hits.get(0));rememberedColors.add(c);}}
            if(positions.size()!=4)return failure("The initial grid must contain exactly four colors that occur once");
            List<Integer> sorted=new ArrayList<>(positions);sorted.sort(Integer::compareTo);List<String> orderedColors=sorted.stream().map(i->colors.get(i)).toList();
            storeState(module,"discoloredPositions",sorted);storeState(module,"discoloredColors",orderedColors);
            List<String> remembered=new ArrayList<>();for(int i=0;i<4;i++)remembered.add(orderedColors.get(i)+":"+coord(sorted.get(i)));storeState(module,"discoloredRemembered",remembered);
            return success(new DiscoloredSquaresOutput(0,"","",sorted.stream().map(DiscoloredSquaresSolver::coord).toList(),List.copyOf(remembered)),false);
        }
        List<Integer> positions=integers(module.getState().get("discoloredPositions"));List<String> rememberedColors=strings(module.getState().get("discoloredColors"));
        if(positions.size()!=4||rememberedColors.size()!=4)return failure("Enter the initial grid first; a strike or reset requires restarting at stage 0");
        int stage=input.stage(),rememberedPosition=positions.get(stage-1);String active=rememberedColors.get(stage-1);Instruction instruction=INSTRUCTIONS[rememberedPosition];
        List<Integer> relevant=new ArrayList<>();for(int i=0;i<16;i++)if(colors.get(i).equals(active))relevant.add(i);if(relevant.isEmpty())return failure("No square has the remembered color for this stage");
        relevant.sort(Comparator.comparingInt(i->ORDER[stage-1][i]));List<Integer> expected=new ArrayList<>();
        for(int square:relevant){if(expected.contains(square))continue;int target=square,guard=0;do{target=process(target,instruction);if(++guard>16)return failure("The instruction cannot reach a non-white square from "+coord(square));}while(colors.get(target).equals("White")||expected.contains(target));expected.add(target);}
        List<String> remembered=strings(module.getState().get("discoloredRemembered"));storeState(module,"discoloredNextStage",Math.min(4,stage+1));
        return success(new DiscoloredSquaresOutput(stage,active,label(instruction),expected.stream().map(DiscoloredSquaresSolver::coord).toList(),remembered),stage==4);
    }
    private static int process(int sq,Instruction i){int x=sq%4,y=sq/4,ox=x,oy=y;switch(i){case NW-> {x+=3;y+=3;}case N->y+=3;case NE->{x++;y+=3;}case E->x++;case SE->{x++;y++;}case S->y++;case SW->{x+=3;y++;}case W->x+=3;case MIRROR_VERTICAL->x=3-x;case MIRROR_HORIZONTAL->y=3-y;case DIAG_BACK->{x=oy;y=ox;}case DIAG_SLASH->{x=3-oy;y=3-ox;}case CW->{y=ox;x=3-oy;}case CCW->{y=3-ox;x=oy;}case R180->{x=3-x;y=3-y;}default->{}}return Math.floorMod(x,4)+4*Math.floorMod(y,4);}
    private static String label(Instruction i){return switch(i){case NW->"Move NW (wrap)";case NE->"Move NE (wrap)";case N->"Move N (wrap)";case R180->"Rotate 180°";case DIAG_BACK->"Mirror about \\";case SW->"Move SW (wrap)";case MIRROR_VERTICAL->"Mirror about |";case STAY->"Stay in place";case DIAG_SLASH->"Mirror about /";case E->"Move E (wrap)";case CW->"Rotate 90° CW";case W->"Move W (wrap)";case MIRROR_HORIZONTAL->"Mirror about —";case S->"Move S (wrap)";case CCW->"Rotate 90° CCW";case SE->"Move SE (wrap)";};}
    private static String coord(int i){return ""+(char)('A'+i%4)+(i/4+1);}private static String color(String s){if(s==null)return null;return List.of("Blue","Green","Magenta","Red","Yellow","White").stream().filter(c->c.equalsIgnoreCase(s.trim())).findFirst().orElse(null);}
    private static List<Integer> integers(Object v){if(!(v instanceof List<?>l))return List.of();try{return l.stream().map(x->Integer.parseInt(String.valueOf(x))).toList();}catch(Exception e){return List.of();}}
    private static List<String> strings(Object v){return v instanceof List<?>l?l.stream().map(String::valueOf).toList():List.of();}
}
