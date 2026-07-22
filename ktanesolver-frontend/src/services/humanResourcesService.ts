import { solveModule } from "../lib/api";

export const HUMAN_RESOURCES_PEOPLE = [
  ["REBECCA", "INTJ", "INTELLECTUAL"], ["DAMIAN", "INTP", "DEVISER"],
  ["JEAN", "INFJ", "CONFIDANT"], ["MIKE", "INFP", "HELPER"],
  ["RIVER", "ISTJ", "AUDITOR"], ["SAMUEL", "ISTP", "INNOVATOR"],
  ["YOSHI", "ISFJ", "DEFENDER"], ["CALEB", "ISFP", "CHAMELEON"],
  ["ASHLEY", "ENTJ", "DIRECTOR"], ["TIM", "ENTP", "DESIGNER"],
  ["ELIOTT", "ENFJ", "EDUCATOR"], ["URSULA", "ENFP", "ADVOCATE"],
  ["SILAS", "ESTJ", "MANAGER"], ["NOAH", "ESTP", "SHOWMAN"],
  ["QUINN", "ESFJ", "CONTRIBUTOR"], ["DYLAN", "ESFP", "ENTERTAINER"],
] as const;

export type HumanResourcesPerson = typeof HUMAN_RESOURCES_PEOPLE[number][0];
export type HumanResourcesDescriptor = typeof HUMAN_RESOURCES_PEOPLE[number][2];

export interface HumanResourcesInput {
  employees: HumanResourcesPerson[];
  applicants: HumanResourcesPerson[];
  redDescriptors: HumanResourcesDescriptor[];
  greenDescriptors: HumanResourcesDescriptor[];
}

export interface HumanResourcesOutput {
  fire: HumanResourcesPerson;
  hire: HumanResourcesPerson;
}

export const solveHumanResources = (roundId: string, bombId: string, moduleId: string, input: HumanResourcesInput) =>
  solveModule<HumanResourcesInput, { output: HumanResourcesOutput }>(roundId, bombId, moduleId, input);
