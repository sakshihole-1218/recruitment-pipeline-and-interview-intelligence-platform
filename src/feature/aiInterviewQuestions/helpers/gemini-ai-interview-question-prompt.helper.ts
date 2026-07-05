import {
  GenerateFollowUpQuestionInput,
  GenerateInterviewPlanInput,
} from '../providers/ai-interview-question-provider';

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

  static buildFollowUpPrompt(input: GenerateFollowUpQuestionInput): string {
    return [
      'Generate one concise interview-quality follow-up question.',
      'Return JSON only. Do not include markdown fences or extra commentary.',
      'Use this object shape exactly:',
      JSON.stringify(
        {
          followUpQuestion: '',
          difficulty: 'MEDIUM',
          category: '',
          reasoning: '',
        },
        null,
        2,
      ),
      'Rules:',
      '- Ask a professional follow-up question only.',
      '- Use the full conversation context, not just the latest answer.',
      '- Probe depth progressively based on what has already been asked and answered.',
      '- Stay relevant to the current question, latest answer, resume context, and interview scope.',
      '- Avoid repeating the current question, previous main questions, previous follow-ups, discussed topics, or already answered concepts unless resolving a contradiction.',
      '- Prefer unexplored concepts, weak areas, or contradictions when deciding the next question.',
      '- Adapt difficulty based on answer quality, candidate level, and prior depth.',
      '- Keep the follow-up concise and interview-ready.',
      '- Ask only one question.',
      '- Do not exceed the maximum allowed follow-up count.',
      'Context:',
      JSON.stringify(
        {
          sessionId: input.sessionId,
          currentQuestion: input.currentQuestion,
          latestAnswer: input.latestAnswer,
          maxFollowUpCount: input.maxFollowUpCount,
          conversationContext: input.conversationContext,
        },
        null,
        2,
      ),
    ].join('\n');
  }
}
