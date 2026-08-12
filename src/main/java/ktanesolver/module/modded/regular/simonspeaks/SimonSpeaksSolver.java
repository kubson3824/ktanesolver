package ktanesolver.module.modded.regular.simonspeaks;

import java.text.Normalizer;
import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type = ModuleType.SIMON_SPEAKS, id = "SimonSpeaksModule", name = "Simon Speaks",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Translate each flashed bubble attribute using successive serial characters.",
    tags = {"simon", "languages", "colors", "multi-stage"})
public class SimonSpeaksSolver extends AbstractModuleSolver<SimonSpeaksInput, SimonSpeaksOutput> {
    private static final String[] POSITIONS={"top-left","top-middle","top-right","middle-left","middle-center","middle-right","bottom-left","bottom-middle","bottom-right"};
    private static final String[] COMMANDS={"tl","tm","tr","ml","mm","mr","bl","bm","br"};
    private static final String[] LANGUAGES={"English","Danish","Dutch","Esperanto","Finnish","French","German","Hungarian","Italian"};
    private static final String[][] WORDS={
        {"black","sort","zwart","nigra","musta","noir","schwarz","fekete","nero"},{"blue","blå","blauw","blua","sininen","bleu","blau","kék","blu"},
        {"green","grøn","groen","verda","vihreä","vert","grün","zöld","verde"},{"cyan","turkis","turkoois","turkisa","turkoosi","turquoise","türkis","türkiz","turchese"},
        {"red","rød","rood","ruĝa","punainen","rouge","rot","piros","rosso"},{"purple","lilla","paars","purpura","purppura","pourpre","lila","bíbor","porpora"},
        {"yellow","gul","geel","flava","keltainen","jaune","gelb","sárga","giallo"},{"white","hvid","wit","blanka","valkoinen","blanc","weiß","fehér","bianco"},
        {"gray","grå","grijs","griza","harmaa","gris","grau","szürke","grigio"}};

    @Override protected SolveResult<SimonSpeaksOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SimonSpeaksInput input) {
        if (input == null || input.bubbles() == null || input.bubbles().size()!=9 || input.flashes()==null || input.flashes().size()!=5) return failure("Enter all nine bubbles and five flashes");
        int[] shapes=new int[9],colors=new int[9],meanings=new int[9],languages=new int[9],flashes=new int[5];
        boolean[] seenShapes=new boolean[9],seenColors=new boolean[9],seenMeanings=new boolean[9],seenLanguages=new boolean[9];
        for(int i=0;i<9;i++){
            SimonSpeaksBubble b=input.bubbles().get(i); if(b==null||b.shape()==null||b.shape()<1||b.shape()>9) return failure("Every shape must be numbered 1 through 9");
            shapes[i]=b.shape()-1; colors[i]=color(b.color()); int[] word=word(b.word());
            if(colors[i]<0||word==null) return failure("Use a manual color word and one of the nine supported languages for every bubble");
            meanings[i]=word[0]; languages[i]=word[1];
            if(seenShapes[shapes[i]]||seenColors[colors[i]]||seenMeanings[meanings[i]]||seenLanguages[languages[i]]) return failure("Shapes, colors, meanings, and languages must each occur exactly once");
            seenShapes[shapes[i]]=seenColors[colors[i]]=seenMeanings[meanings[i]]=seenLanguages[languages[i]]=true;
        }
        for(int i=0;i<5;i++){flashes[i]=position(input.flashes().get(i));if(flashes[i]<0)return failure("Use bubble positions such as TL, MM, or BR");}
        String serial=bomb.getSerialNumber(); if(serial==null||serial.length()<5)return failure("The serial number must contain at least five characters");
        int[] answer=new int[5];
        answer[0]=(flashes[0]+serialValue(serial.charAt(0)))%9;
        answer[1]=indexOf(shapes,(shapes[flashes[1]]+serialValue(serial.charAt(1)))%9);
        answer[2]=indexOf(languages,(languages[flashes[2]]+serialValue(serial.charAt(2)))%9);
        answer[3]=indexOf(colors,(meanings[flashes[3]]+serialValue(serial.charAt(3)))%9);
        answer[4]=indexOf(meanings,(colors[flashes[4]]+serialValue(serial.charAt(4)))%9);
        List<String> positions=Arrays.stream(answer).mapToObj(i->POSITIONS[i]).toList();
        List<String> commands=Arrays.stream(answer).mapToObj(i->COMMANDS[i]).toList();
        List<String> facts=List.of(POSITIONS[flashes[0]],"shape "+(shapes[flashes[1]]+1),LANGUAGES[languages[flashes[2]]],WORDS[meanings[flashes[3]]][languages[flashes[3]]],WORDS[colors[flashes[4]]][0]);
        storeState(module,"simonSpeaksSouvenir",facts);
        return success(new SimonSpeaksOutput(positions,commands,facts));
    }
    private static int serialValue(char c){return Character.isDigit(c)?c-'0':Character.toUpperCase(c)-'A'+1;}
    private static int indexOf(int[] values,int target){for(int i=0;i<values.length;i++)if(values[i]==target)return i;return -1;}
    private static int color(String value){if(value==null)return -1;String n=normalize(value);for(int i=0;i<WORDS.length;i++)if(normalize(WORDS[i][0]).equals(n))return i;return -1;}
    private static int[] word(String value){if(value==null)return null;String n=normalize(value);for(int r=0;r<9;r++)for(int c=0;c<9;c++)if(normalize(WORDS[r][c]).equals(n))return new int[]{r,c};return null;}
    private static String normalize(String value){return Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT),Normalizer.Form.NFC);}
    private static int position(String value){if(value==null)return -1;String n=value.toLowerCase(Locale.ROOT).replaceAll("[^a-z]","").replace("center","middle").replace("centre","middle");return switch(n){case"tl","lt","topleft","lefttop"->0;case"tm","mt","topmiddle","middletop"->1;case"tr","rt","topright","righttop"->2;case"ml","lm","middleleft","leftmiddle"->3;case"mm","middle","middlemiddle"->4;case"mr","rm","middleright","rightmiddle"->5;case"bl","lb","bottomleft","leftbottom"->6;case"bm","mb","bottommiddle","middlebottom"->7;case"br","rb","bottomright","rightbottom"->8;default->-1;};}
}
