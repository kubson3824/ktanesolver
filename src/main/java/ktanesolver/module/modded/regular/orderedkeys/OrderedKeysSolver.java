package ktanesolver.module.modded.regular.orderedkeys;
import java.util.*;import java.util.stream.IntStream;import org.springframework.stereotype.Service;import ktanesolver.annotation.ModuleInfo;import ktanesolver.dto.ModuleCatalogDto;import ktanesolver.entity.*;import ktanesolver.enums.ModuleType;import ktanesolver.logic.*;
@Service @ModuleInfo(type=ModuleType.ORDERED_KEYS,id="orderedKeys",name="Ordered Keys",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,description="Decode each key's rank and press the six keys in ascending order for three stages.",tags={"keys","colors","ordering","stages"})
public class OrderedKeysSolver extends AbstractModuleSolver<OrderedKeysInput,OrderedKeysOutput>{
 private static final String TABLE=
 "134625451263625314263451312546546132425136361542213654542361156423634215342156516234635412463521251643124365"+
 "245361431652154236623415316524562143645123136254521346364512452631213465524136312564143625256341635412461253"+
 "453261324156612435531642246513165324513642652134341256234561165423426315125643346152614235463521532416251364"+
 "314526625143132654451362263415546231654321321564162435536142245613413256236541342156425613651234513462164325"+
 "436251514632625314352146241563163425261534534126643215315642126453452361361254146325513462254613425136632541"+
 "523416241365356241614532465123132654152634236541413265364152541326625413653421362154246513415362124635531246"+
 "512463326154631542245316453621164235132456623514241365564231415623356142234561516342342615423156651423165234"+
 "432156643521316245561432254613125364634125543261126453361542452316215634341265623154254316416523165432532641"+
 "246531431265153642612453524316365124356124231645413256624513145362562431432651516342265134143265624513351426"+
 "645312326145451263134526562431213654541623136542412365325416263154654231156234241653563142324516635421412365"+
 "356214241365123456564123415632632541613542351264524613146325432156265431235146412653364215653421146532521364"+
 "143562521436264315315624652143436251532461426153145632613245254316361524423651514362635124162543346215251436";
 @Override protected SolveResult<OrderedKeysOutput> doSolve(RoundEntity r,BombEntity b,ModuleEntity m,OrderedKeysInput i){if(i==null||i.stage()<1||i.stage()>3||i.keys()==null||i.keys().size()!=6||i.keys().stream().anyMatch(k->k==null||k.keyColor()==null||k.labelColor()==null||k.label()<1||k.label()>6))return failure("Enter all six keys and a stage from 1 to 3");List<Integer> ranks=IntStream.range(0,6).mapToObj(p->rank(i.keys().get(p),p)).toList();if(new HashSet<>(ranks).size()!=6)return failure("The entered keys do not decode to six distinct ranks");List<Integer> order=IntStream.range(0,6).boxed().sorted(Comparator.comparingInt(ranks::get)).map(x->x+1).toList();storeState(m,"orderedKeysStage"+i.stage(),i.keys());return success(new OrderedKeysOutput(i.stage(),ranks,order,"press "+order.stream().map(String::valueOf).reduce("",String::concat)),i.stage()==3);}
 static int rank(OrderedKeysInput.Key k,int position){int index=((((k.keyColor().ordinal()*6+k.labelColor().ordinal())*6+position)*6)+(k.label()-1));return TABLE.charAt(index)-'0';}
}
