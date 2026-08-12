package ktanesolver.module.modded.regular.factorymaze;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type = ModuleType.FACTORY_MAZE, id = "factoryMaze", name = "Factory Maze",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Route through a factory map, collect numbered keys, and unlock three locks.",
    tags = {"maze", "routing", "multi-step"})
public class FactoryMazeSolver extends AbstractModuleSolver<FactoryMazeInput, FactoryMazeOutput> {
    private static final int[][][] MAZES={{{1,2},{2,3},{3,4},{4,0},{0,1}},{{1,3},{2,4},{0,3},{1,4},{0,2}},{{2,3},{0,4},{1,4},{1,2},{0,3}}};
    private static final int[][][] KEYS={{{2,3,0},{4,1,2},{0,1,3},{3,4,99},{1,2,99}},{{3,4,0},{0,1,1},{2,0,4},{3,1,99},{4,0,99}},{{4,3,0},{0,3,2},{2,1,3},{1,4,99},{4,0,99}}};
    private record State(int room,int held,int unlocked){}
    private record Step(State state,List<String> actions,List<String> route){}

    @Override protected SolveResult<FactoryMazeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, FactoryMazeInput input) {
        if(input==null||input.maze()==null||input.startRoom()==null||input.roomNames()==null||input.leftUsesFirstExit()==null)return failure("Enter the map, start room, five room names, and five door orientations");
        if(input.maze()<1||input.maze()>3||input.startRoom()<1||input.startRoom()>5)return failure("Map must be 1–3 and start room must be 1–5");
        if(input.roomNames().size()!=5||input.leftUsesFirstExit().size()!=5||input.roomNames().stream().anyMatch(s->s==null||s.isBlank())||input.leftUsesFirstExit().stream().anyMatch(Objects::isNull))return failure("Enter all five room names and door orientations");
        int map=input.maze()-1,start=input.startRoom()-1;
        ArrayDeque<Step> queue=new ArrayDeque<>(); Set<State> seen=new HashSet<>(); State initial=new State(start,-1,0);
        queue.add(new Step(initial,List.of(),List.of(input.roomNames().get(start)))); seen.add(initial);
        while(!queue.isEmpty()){
            Step step=queue.remove(); State s=step.state();
            if(s.unlocked()==3){String startName=input.roomNames().get(start).replace('\n',' ');storeState(module,"factoryMazeStartRoom",startName);return success(new FactoryMazeOutput(startName,step.actions(),step.route()));}
            if(s.held()==s.room()){
                State next=new State(s.room(),-1,s.unlocked()+1); if(seen.add(next)){List<String>a=append(step.actions(),"unlock");queue.add(new Step(next,a,step.route()));}
            }
            for(int side=0;side<2;side++){
                boolean leftFirst=input.leftUsesFirstExit().get(s.room()); int exit=side==0?(leftFirst?0:1):(leftFirst?1:0); int dest=MAZES[map][s.room()][exit]; int held=s.held();
                for(int[] key:KEYS[map])if((key[0]==s.room()&&key[1]==dest)||(key[1]==s.room()&&key[0]==dest))held=key[2];
                State next=new State(dest,held,s.unlocked()); if(seen.add(next)){queue.add(new Step(next,append(step.actions(),side==0?"left":"right"),append(step.route(),input.roomNames().get(dest).replace('\n',' '))));}
            }
        }
        return failure("No three-lock route exists for those observations; recheck the map and door orientations");
    }
    private static <T> List<T> append(List<T> list,T value){List<T> copy=new ArrayList<>(list);copy.add(value);return List.copyOf(copy);}
}
