import { Injectable } from '@nestjs/common';

import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { GeneratedFrom } from '../enums/generated-from.enum';
import { QuestionType } from '../enums/question-type.enum';

import {
  AiInterviewQuestionProvider,
  GenerateFollowUpQuestionInput,
  GenerateInterviewPlanInput,
  GeneratedFollowUpQuestion,
  GeneratedInterviewPlanQuestion,
} from './ai-interview-question-provider';

type ResumeProject = {
  name?: string;
  title?: string;
  technologies?: string[];
};

@Injectable()
export class MockAiInterviewQuestionProvider implements AiInterviewQuestionProvider {
  async generateInterviewPlan(
    input: GenerateInterviewPlanInput,
  ): Promise<GeneratedInterviewPlanQuestion[]> {
    const parsedResume = this.extractParsedResume(
      input.resume_analysis.parsed_resume_json,
    );
    const topProject = parsedResume.projects[0];
    const projectName =
      topProject?.name ||
      topProject?.title ||
      this.extractProjectNameFromSummary(
        input.resume_analysis.project_summary,
      ) ||
      `${input.job_opening.title} implementation`;

    const normalizedSkills = this.extractSkillNames(
      input.resume_analysis.skills_extracted,
      input.job_skills,
    );

    const primarySkill = normalizedSkills[0] || 'NestJS';
    const secondarySkill = normalizedSkills[1] || 'PostgreSQL';
    const experienceAnchor =
      input.resume_analysis.experience_summary ||
      `${input.candidate.full_name} has backend engineering experience across API design and delivery.`;

    const architectureTopic = topProject?.technologies?.length
      ? topProject.technologies.join(', ')
      : `${primarySkill}, ${secondarySkill}`;

    return [
      {
        sequence_number: 1,
        question_text: `Tell me about your ${projectName} project and the problem it was designed to solve.`,
        question_type: QuestionType.RESUME,
        topic: 'Resume Project Overview',
        difficulty_level: DifficultyLevel.EASY,
        generated_from: GeneratedFrom.RESUME_ANALYSIS,
        expected_answer_keywords: [projectName, 'business problem', 'impact'],
      },
      {
        sequence_number: 2,
        question_text: `Explain how you have used ${primarySkill} in production systems relevant to the ${input.job_opening.title} role.`,
        question_type: QuestionType.SKILL,
        topic: primarySkill,
        difficulty_level: DifficultyLevel.MEDIUM,
        generated_from: GeneratedFrom.JOB_SKILL,
        expected_answer_keywords: [primarySkill, 'production', 'architecture'],
      },
      {
        sequence_number: 3,
        question_text: this.buildTechnicalQuestion(
          primarySkill,
          secondarySkill,
        ),
        question_type: QuestionType.TECHNICAL,
        topic: `${primarySkill} / ${secondarySkill}`,
        difficulty_level: DifficultyLevel.HARD,
        generated_from: GeneratedFrom.JOB_SKILL,
        expected_answer_keywords: [primarySkill, secondarySkill, 'trade-offs'],
      },
      {
        sequence_number: 4,
        question_text: `Based on your background, walk me through a complex engineering challenge you handled: ${experienceAnchor}`,
        question_type: QuestionType.EXPERIENCE,
        topic: 'Relevant Experience',
        difficulty_level: DifficultyLevel.MEDIUM,
        generated_from: GeneratedFrom.EXPERIENCE,
        expected_answer_keywords: ['challenge', 'ownership', 'outcome'],
      },
      {
        sequence_number: 5,
        question_text: `Describe the architecture you implemented for ${projectName}, including the major modules, data flow, and scaling considerations.`,
        question_type: QuestionType.PROJECT,
        topic: 'System Architecture',
        difficulty_level: DifficultyLevel.HARD,
        generated_from: GeneratedFrom.PROJECT,
        expected_answer_keywords: [
          'architecture',
          'modules',
          'data flow',
          'scaling',
          architectureTopic,
        ],
      },
      {
        sequence_number: 6,
        question_text:
          'Describe a challenging bug you solved recently, how you debugged it, and what changes prevented it from recurring.',
        question_type: QuestionType.BEHAVIORAL,
        topic: 'Problem Solving',
        difficulty_level: DifficultyLevel.MEDIUM,
        generated_from: GeneratedFrom.EXPERIENCE,
        expected_answer_keywords: ['debugging', 'root cause', 'prevention'],
      },
    ];
  }

  async generateFollowUpQuestion(
    input: GenerateFollowUpQuestionInput,
  ): Promise<GeneratedFollowUpQuestion> {
    const normalizedAnswer = input.latestAnswer.toLowerCase();
    const leadingSkill =
      input.conversationContext.skills[0] ||
      input.currentQuestion.topic ||
      'the topic';
    const weakArea = input.conversationContext.weakAreas[0];

    if (
      normalizedAnswer.includes('used') &&
      !normalizedAnswer.includes('how') &&
      !normalizedAnswer.includes('internal')
    ) {
      return {
        followUpQuestion: `Can you walk me through the internal mechanics behind ${leadingSkill} and explain the trade-offs involved?`,
        difficulty: DifficultyLevel.MEDIUM,
        category: `${leadingSkill} Internals`,
        reasoning:
          'The answer mentioned practical usage but did not demonstrate depth on implementation details.',
      };
    }

    if (weakArea) {
      return {
        followUpQuestion: `Can you go deeper on ${weakArea.topic} and explain the reasoning, trade-offs, and implementation details behind your approach?`,
        difficulty: DifficultyLevel.MEDIUM,
        category: weakArea.topic,
        reasoning:
          'The conversation context suggests this area needs deeper validation before moving on.',
      };
    }

    return {
      followUpQuestion: `What design trade-offs or edge cases would you consider when applying ${leadingSkill} in a production backend system?`,
      difficulty: DifficultyLevel.HARD,
      category: `${leadingSkill} Trade-offs`,
      reasoning:
        'The answer appears substantive enough to probe deeper into production-level decision making.',
    };
  }

  private buildTechnicalQuestion(
    primarySkill: string,
    secondarySkill: string,
  ): string {
    const skillKey = `${primarySkill} ${secondarySkill}`.toLowerCase();

    if (skillKey.includes('postgresql') || skillKey.includes('sql')) {
      return 'What is the difference between LEFT JOIN and INNER JOIN, and when have you used each in a performance-sensitive query?';
    }

    if (skillKey.includes('nestjs')) {
      return 'Explain dependency injection in NestJS and how you structure modules to keep large applications maintainable.';
    }

    return `What trade-offs would you consider when designing a backend solution using ${primarySkill} and ${secondarySkill}?`;
  }

  private extractParsedResume(value: unknown): { projects: ResumeProject[] } {
    if (!value || typeof value !== 'object') {
      return { projects: [] };
    }

    const rawProjects = (value as { projects?: unknown }).projects;
    if (!Array.isArray(rawProjects)) {
      return { projects: [] };
    }

    return {
      projects: rawProjects.filter((project): project is ResumeProject => {
        return Boolean(project && typeof project === 'object');
      }),
    };
  }

  private extractProjectNameFromSummary(summary: string | null): string | null {
    const normalized = String(summary || '').trim();
    if (!normalized) {
      return null;
    }

    const firstSentence = normalized.split(/[.!?]/)[0]?.trim();
    return firstSentence || null;
  }

  private extractSkillNames(
    skillsExtracted: unknown,
    jobSkills: GenerateInterviewPlanInput['job_skills'],
  ): string[] {
    const result = new Set<string>();

    if (skillsExtracted && typeof skillsExtracted === 'object') {
      const rawSkills = (skillsExtracted as { skills?: unknown }).skills;
      if (Array.isArray(rawSkills)) {
        rawSkills
          .map((skill) => String(skill).trim())
          .filter(Boolean)
          .forEach((skill) => result.add(skill));
      }
    }

    jobSkills
      .map((jobSkill) => jobSkill.skill?.name || '')
      .map((skill) => skill.trim())
      .filter(Boolean)
      .forEach((skill) => result.add(skill));

    return Array.from(result).slice(0, 5);
  }
}
