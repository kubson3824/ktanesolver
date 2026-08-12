package ktanesolver.module.modded.regular.thehangover;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type=ModuleType.THE_HANGOVER,id="hangover",name="The Hangover",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description="Follow the note-to-self flowchart until the first repeated ingredient or action.",tags={"flowchart","ingredients","sequence"})
public class TheHangoverSolver extends AbstractModuleSolver<TheHangoverInput,TheHangoverOutput>{
    @Override protected SolveResult<TheHangoverOutput> doSolve(RoundEntity round,BombEntity bomb,ModuleEntity module,TheHangoverInput input){
        if(input==null||input.drink()==null||input.sick()==null||input.slept()==null||input.shots()==null||input.kebab()==null||input.travel()==null)return failure("Enter all six lines from the note to self");
        String drink=choice(input.drink(),"red wine","white wine","prosecco","cider","lager","vodka","gin","rum");
        String slept=choice(input.slept(),"stove","floor","sofa","bed");String kebab=choice(input.kebab(),"chicken","doner","shish","none");String travel=choice(input.travel(),"uber","walked");
        if(drink==null||slept==null||kebab==null||travel==null)return failure("Use a listed drink, sleeping place, kebab, and route home");
        String node=switch(drink){case"red wine"->"Family-pack of Oreos";case"white wine"->"Remorse & contrition";case"prosecco"->"Half a Big Mac";case"cider"->"Dirt";case"lager"->"Tea with 18 sugars";case"vodka"->"Lard";case"gin"->"Kale";default->"Black coffee";};
        List<String> recipe=new ArrayList<>();Set<String> seen=new HashSet<>();
        while(seen.add(node)){recipe.add(node);node=next(node,drink,input.sick(),slept,input.shots(),kebab,travel);if(recipe.size()>25)return failure("The flowchart did not reach a repeat");}
        return success(new TheHangoverOutput(List.copyOf(recipe)));
    }
    private static String next(String n,String drink,boolean sick,String slept,boolean shots,String kebab,String travel){boolean spirit=Set.of("vodka","gin","rum").contains(drink);return switch(n){
        case"Kale"->"Lard";case"Lard"->shots?"Avocado toast":"STIR";case"Avocado toast"->spirit?"Sliced apple":"STIR";case"Half a Big Mac"->spirit?"Kale":"Dirt";
        case"Shot of red wine"->shots?"Half a Big Mac":"Aspirin";case"Aspirin"->travel.equals("walked")?"Petrol":"WHISK";
        case"Dirt"->switch(slept){case"stove"->"Tea with 18 sugars";case"floor"->"Petrol";case"bed"->"Aspirin";default->"Half a Big Mac";};
        case"Black coffee"->shots?"Family-pack of Oreos":"Lard";case"BLEND"->switch(slept){case"stove"->"Avocado toast";case"floor"->"Lard";case"bed"->"Black coffee";default->"2 raw eggs";};
        case"SHAKE"->sick?"Half a Big Mac":"Shot of red wine";case"Cooking oil"->switch(slept){case"stove"->"Shot of red wine";case"floor"->"SHAKE";case"sofa"->"Half a Big Mac";default->"Kale";};
        case"Mayonnaise"->travel.equals("uber")?"Kale":"Cooking oil";case"Sliced apple"->switch(kebab){case"chicken"->"Mayonnaise";case"doner"->"Lard";case"shish"->"Kale";default->"Cooking oil";};
        case"STIR"->travel.equals("uber")?"Lard":"Sliced apple";case"Petrol"->sick?"Tea with 18 sugars":"WHISK";case"Tea with 18 sugars"->shots?"Remorse & contrition":"Dirt";
        case"Remorse & contrition"->travel.equals("walked")?"500g of sugar":"Family-pack of Oreos";case"Family-pack of Oreos"->shots?"2 raw eggs":"Entire can of Red Bull";
        case"2 raw eggs"->spirit?"Entire can of Red Bull":"Bacon crisps";case"Bacon crisps"->sick?"BLEND":"Entire can of Red Bull";
        case"Entire can of Red Bull"->switch(kebab){case"chicken"->"Remorse & contrition";case"doner"->"Whole pizza";case"shish"->"500g of sugar";default->"Bacon crisps";};
        case"500g of sugar"->sick?"Whole pizza":"Tea with 18 sugars";case"Whole pizza"->sick?"Tea with 18 sugars":"WHISK";case"WHISK"->shots?"Entire can of Red Bull":"Petrol";default->throw new IllegalStateException(n);};}
    private static String choice(String v,String...xs){if(v==null)return null;String n=v.trim().toLowerCase(Locale.ROOT);if(n.equals("no kebab")||n.equals("chips with mayo"))n="none";for(String x:xs)if(x.equals(n))return x;return null;}
}
