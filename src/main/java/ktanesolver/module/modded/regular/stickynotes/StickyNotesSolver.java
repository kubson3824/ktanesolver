package ktanesolver.module.modded.regular.stickynotes;

import java.util.Comparator;
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
@ModuleInfo(
    type = ModuleType.STICKY_NOTES, id = "stickyNotes", name = "Sticky Notes",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Choose the first displayed task in the weekday's department list, or the first personal task on weekends.",
    tags = {"sticky notes", "weekday", "tasks", "sorting"}
)
public class StickyNotesSolver extends AbstractModuleSolver<StickyNotesInput, StickyNotesOutput> {
    private static final List<String> ADMIN = List.of("Photocopy manager's schedule","Make coffee for visitors","Call client to book meeting on Tuesday","Show new employee around office","Document new procedure to defuse a bomb","Call client to book meeting on Friday","Buy tea and coffee","Call client to book meeting on Wednesday","Check timesheets of employees");
    private static final List<String> HR = List.of("Pass pay details to payroll","Update new starter file","Change addresses of employees","Photocopy personnel file","Interview new starters","Disciplinary with Dazarino","Call new applicants","Meeting with visitors","Update vehicle database");
    private static final List<String> PAYROLL = List.of("Reconcile tax","Pay employees","Pay outstanding invoice","Pay in petty cash","Contact unpaid invoices","Generate payslips","Post next weeks invoices","Call client for meeting","Deposit earnings in bank");
    private static final List<String> OTHER = List.of("Aunt coming to visit","Ben's birthday bash","Coffee meet with Random","Drink with friends","Fun-day out with kids","Golf with Callum","Hang clothes out to dry","Have date night with Squishy","Indian takeaway","Jury service","Go to the gym with Kilda","Look at new houses on the market","Moonlit dinner with Tathra","Northern lights visit","Playing KTaNE with the TGB crew","Quiz night with Royal","Cruise with River","Training for 10km run");
    private static final Map<String,String> DAYS = Map.of("monday","Admin","friday","Admin","tuesday","Human Resources","thursday","Human Resources","wednesday","Payroll","saturday","Personal","sunday","Personal");

    @Override
    protected SolveResult<StickyNotesOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, StickyNotesInput input) {
        if (input == null || input.weekday() == null || input.notes() == null || input.notes().size() != 10) return failure("Choose the weekday and enter all ten notes");
        String category = DAYS.get(input.weekday().trim().toLowerCase(Locale.ROOT));
        if (category == null || input.notes().stream().anyMatch(note -> note == null || note.isBlank())) return failure("Choose a valid weekday and enter every note");
        List<String> priorities = switch (category) { case "Admin" -> ADMIN; case "Human Resources" -> HR; case "Payroll" -> PAYROLL; default -> OTHER.stream().sorted(Comparator.comparing(StickyNotesSolver::normalize)).toList(); };
        String answer = priorities.stream().filter(candidate -> indexOf(input.notes(), candidate) >= 0).findFirst().orElse(null);
        if (answer == null) return failure("None of the displayed notes belongs to the required task list; check the text and weekday");
        int position = indexOf(input.notes(), answer) + 1;
        return success(new StickyNotesOutput(position, input.notes().get(position - 1).trim(), category));
    }

    private static int indexOf(List<String> notes, String target) { for (int i=0;i<notes.size();i++) if (normalize(notes.get(i)).equals(normalize(target))) return i; return -1; }
    private static String normalize(String value) { return value.toLowerCase(Locale.ROOT).replace('’','\'').replaceAll("[^a-z0-9]+", " ").trim().replace("personel", "personnel"); }
}
