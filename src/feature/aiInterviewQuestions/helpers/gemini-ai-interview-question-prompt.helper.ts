import { GenerateInterviewPlanInput } from '../providers/ai-interview-question-provider';

export class GeminiAiInterviewQuestionPromptHelper {
  static buildPrompt(input: GenerateInterviewPlanInput): string {
    return [
      'Generate an interview plan for a recruitment platform.',
      'Return JSON only as an array of 8 to 10 unique questions.',
      'Do not include markdown fences or explanations.',
      'Use this item shape:',
      JSON.stringify(
        {
          question_text: '',
          question_type: 'TECHNICAL',
          topic: '',
          difficulty_level: 'MEDIUM',
          sequence_number: 1,
          generated_from: 'RESUME_ANALYSIS',
          expected_answer_keywords: [],
        },
        null,
        2,
      ),
      'Rules:',
      '- Include resume/project-based questions.',
      '- Include skill-based technical questions.',
      '- Include at least one behavioral question.',
      '- Avoid duplicates.',
      '- Use valid enums only for question_type, difficulty_level, and generated_from.',
      '- Sequence numbers must be ascending starting from 1.',
      '- Keep generated_from as RESUME_ANALYSIS, JOB_SKILL, EXPERIENCE, PROJECT, or FOLLOW_UP_ENGINE.',
      'Context:',
      JSON.stringify(
        {
          ai_interview_session_id: input.ai_interview_session_id,
          candidate: input.candidate,
          application: input.application,
          job_opening: input.job_opening,
          resume_analysis: {
            id: input.resume_analysis.id,
            parsed_resume_json: input.resume_analysis.parsed_resume_json,
            skills_extracted: input.resume_analysis.skills_extracted,
            experience_summary: input.resume_analysis.experience_summary,
            project_summary: input.resume_analysis.project_summary,
            total_experience_years_detected:
              input.resume_analysis.total_experience_years_detected,
          },
          job_skills: input.job_skills.map((skill) => ({
            id: skill.id,
            skill_name: skill.skill?.name ?? null,
            is_mandatory: skill.is_mandatory,
            proficiency_level: skill.proficiency_level,
            years_of_experience_required: skill.years_of_experience_required,
          })),
        },
        null,
        2,
      ),
    ].join('\n');
  }
}
