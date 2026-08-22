package ktanesolver.module.modded.regular.hypercube;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(type = ModuleType.THE_HYPERCUBE, id = "TheHypercubeModule", name = "The Hypercube",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Translate five 4D rotations into four target face-and-color vertex presses.",
    tags = {"hypercube", "rotations", "colors", "vertices", "4d"})
public class HypercubeSolver extends AbstractModuleSolver<HypercubeInput, HypercubeOutput> {
    private static final Map<String,String> FACES=faces(), ORDERS=orders();
    @Override protected SolveResult<HypercubeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, HypercubeInput input){
        if(input==null||input.rotations()==null||input.vertexColors()==null)return failure("Enter five rotations and all sixteen current vertex colors");
        if(input.rotations().size()!=5)return failure("Enter exactly five rotations");if(input.stage()<1||input.stage()>4)return failure("Stage must be between 1 and 4");if(input.vertexColors().size()!=16)return failure("Enter sixteen vertex colors in binary vertex order");
        List<String> rotations=input.rotations().stream().map(x->x==null?"":x.trim().toUpperCase(Locale.ROOT)).toList();
        if(rotations.stream().anyMatch(x->!FACES.containsKey(x)))return failure("Rotations must be XY, YX, XZ, ZX, XW, WX, YZ, ZY, YW, WY, ZW, or WZ");
        List<String> colors=input.vertexColors().stream().map(x->x==null?"":x.trim().toUpperCase(Locale.ROOT)).toList();
        if(colors.stream().anyMatch(x->!x.matches("RED|YELLOW|GREEN|BLUE")))return failure("Vertex colors must be red, yellow, green, or blue");
        String face=FACES.get(rotations.get(input.stage()-1)), target=switch(ORDERS.get(rotations.get(4)).charAt(input.stage()-1)){case 'R'->"RED";case 'Y'->"YELLOW";case 'G'->"GREEN";default->"BLUE";};
        int found=-1;for(int vertex=0;vertex<16;vertex++)if(onFace(vertex,face)&&colors.get(vertex).equals(target)){if(found>=0)return failure("The target color must occur exactly once on the target face");found=vertex;}
        if(found<0)return failure("The target color is missing from the target face");storeState(module,"hypercubeRotations",rotations);
        return success(new HypercubeOutput(input.stage(),face,target,vertex(found)),input.stage()==4);
    }
    private static boolean onFace(int v,String face){for(String part:face.split("-")){boolean ok=switch(part){case"left"->(v&1)==0;case"right"->(v&1)!=0;case"bottom"->(v&2)==0;case"top"->(v&2)!=0;case"front"->(v&4)==0;case"back"->(v&4)!=0;case"zig"->(v&8)==0;case"zag"->(v&8)!=0;default->false;};if(!ok)return false;}return true;}
    private static String vertex(int v){return ((v&8)==0?"zig":"zag")+"-"+((v&2)==0?"bottom":"top")+"-"+((v&4)==0?"front":"back")+"-"+((v&1)==0?"left":"right");}
    private static Map<String,String> faces(){Map<String,String>m=new LinkedHashMap<>();m.put("XY","back-right");m.put("YX","zag-bottom");m.put("XZ","zig-right");m.put("ZX","zig-bottom");m.put("XW","zig-back");m.put("WX","zag-back");m.put("YZ","top-right");m.put("ZY","zag-right");m.put("YW","back-left");m.put("WY","top-front");m.put("ZW","bottom-right");m.put("WZ","top-back");return Map.copyOf(m);}
    private static Map<String,String> orders(){Map<String,String>m=new LinkedHashMap<>();m.put("XY","GYRB");m.put("YX","BGRY");m.put("XZ","RYBG");m.put("ZX","GYBR");m.put("XW","BRYG");m.put("WX","GBRY");m.put("YZ","BYRG");m.put("ZY","YBRG");m.put("YW","YBGR");m.put("WY","GRBY");m.put("ZW","YRBG");m.put("WZ","BGYR");return Map.copyOf(m);}
}
