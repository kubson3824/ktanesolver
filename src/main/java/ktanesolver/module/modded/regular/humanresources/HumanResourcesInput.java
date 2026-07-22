package ktanesolver.module.modded.regular.humanresources;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record HumanResourcesInput(
	List<Person> employees,
	List<Person> applicants,
	List<Descriptor> redDescriptors,
	List<Descriptor> greenDescriptors
) implements ModuleInput {
	public enum Descriptor {
		INTELLECTUAL("INTJ"), DEVISER("INTP"), CONFIDANT("INFJ"), HELPER("INFP"),
		AUDITOR("ISTJ"), INNOVATOR("ISTP"), DEFENDER("ISFJ"), CHAMELEON("ISFP"),
		DIRECTOR("ENTJ"), DESIGNER("ENTP"), EDUCATOR("ENFJ"), ADVOCATE("ENFP"),
		MANAGER("ESTJ"), SHOWMAN("ESTP"), CONTRIBUTOR("ESFJ"), ENTERTAINER("ESFP");

		final String mbti;

		Descriptor(String mbti) {
			this.mbti = mbti;
		}
	}

	public enum Person {
		REBECCA(Descriptor.INTELLECTUAL), DAMIAN(Descriptor.DEVISER), JEAN(Descriptor.CONFIDANT),
		MIKE(Descriptor.HELPER), RIVER(Descriptor.AUDITOR), SAMUEL(Descriptor.INNOVATOR),
		YOSHI(Descriptor.DEFENDER), CALEB(Descriptor.CHAMELEON), ASHLEY(Descriptor.DIRECTOR),
		TIM(Descriptor.DESIGNER), ELIOTT(Descriptor.EDUCATOR), URSULA(Descriptor.ADVOCATE),
		SILAS(Descriptor.MANAGER), NOAH(Descriptor.SHOWMAN), QUINN(Descriptor.CONTRIBUTOR),
		DYLAN(Descriptor.ENTERTAINER);

		final Descriptor descriptor;

		Person(Descriptor descriptor) {
			this.descriptor = descriptor;
		}
	}
}
