package ktanesolver.module.modded.regular.unorderedkeys;import java.util.*;import org.springframework.stereotype.Service;import ktanesolver.annotation.ModuleInfo;import ktanesolver.dto.ModuleCatalogDto;import ktanesolver.entity.*;import ktanesolver.enums.ModuleType;import ktanesolver.logic.*;import ktanesolver.module.modded.regular.unorderedkeys.UnorderedKeysOutput.Action;
@Service @ModuleInfo(type=ModuleType.UNORDERED_KEYS,id="unorderedKeys",name="Unordered Keys",category=ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,description="Decode the remaining keys and press a key matching the descending target, or reset when none does.",tags={"keys","colors","ordering","stages"})
public class UnorderedKeysSolver extends AbstractModuleSolver<UnorderedKeysInput,UnorderedKeysOutput>{
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
 @Override protected SolveResult<UnorderedKeysOutput>doSolve(RoundEntity r,BombEntity b,ModuleEntity m,UnorderedKeysInput i){if(i==null||i.resetCount()<0||i.resetCount()>1||i.keys()==null||i.keys().size()!=6)return failure("Enter the six key positions and whether the black key has already been used");for(var k:i.keys())if(k==null||(k.active()&&(k.keyColor()==null||k.labelColor()==null||k.label()==null||k.label()<1||k.label()>6)))return failure("Enter color, label color, and digit for every active key");int target=(int)i.keys().stream().filter(UnorderedKeysInput.Key::active).count();if(target<1)return failure("At least one active key is required");List<Integer>decoded=new ArrayList<>(),valid=new ArrayList<>();for(int p=0;p<6;p++){var k=i.keys().get(p);if(!k.active()){decoded.add(0);continue;}int v=rank(k,p);decoded.add(v);if(v==target)valid.add(p+1);}int stage=i.resetCount()+1;String stateKey="unorderedKeysStage"+stage;if(!m.getState().containsKey(stateKey))storeState(m,stateKey,i.keys());Action action=valid.isEmpty()?Action.RESET:Action.PRESS;String command="press "+(action==Action.RESET?0:valid.get(0));boolean solved=action==Action.PRESS&&target==1||action==Action.RESET&&i.resetCount()==1;return success(new UnorderedKeysOutput(target,decoded,valid,action,command),solved);}
 static int rank(UnorderedKeysInput.Key k,int position){int index=(((k.keyColor().ordinal()*6+k.labelColor().ordinal())*6+position)*6)+(k.label()-1);return TABLE.charAt(index)-'0';}
}
