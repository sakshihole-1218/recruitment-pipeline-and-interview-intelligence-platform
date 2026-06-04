import { FeedbackAiSummaryEntity } from '../entities/feedback-ai-summary.entity';
import { ResumeAiAnalysisEntity } from '../entities/resume-ai-analysis.entity';
import { FeedbackAiSummaryResponseDto } from '../dto/feedback-ai-summary.response.dto';
import { ResumeAiAnalysisResponseDto } from '../dto/resume-ai-analysis.response.dto';

export class AiInsightsMapper {
  static toResumeAnalysisResponse(entity: ResumeAiAnalysisEntity): ResumeAiAnalysisResponseDto {
    return {
      id: entity.id,
      candidate_id: entity.candidate_id,
      candidate_document_id: entity.candidate_document_id,
      application_id: entity.application_id ?? null,
      extracted_text: entity.extracted_text,
      parsed_resume_json: entity.parsed_resume_json ?? null,
      skills_extracted: entity.skills_extracted,
      experience_summary: entity.experience_summary,
      education_summary: entity.education_summary,
      project_summary: entity.project_summary ?? null,
      certification_summary: entity.certification_summary ?? null,
      total_experience_years_detected: entity.total_experience_years_detected ?? null,
      ai_fit_score: entity.ai_fit_score,
      analysis_status: entity.analysis_status,
      analyzed_at: entity.analyzed_at,
      failure_reason: entity.failure_reason ?? null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toFeedbackSummaryResponse(entity: FeedbackAiSummaryEntity): FeedbackAiSummaryResponseDto {
    return {
      id: entity.id,
      application_id: entity.application_id,
      summary_text: entity.summary_text,
      strengths_summary: entity.strengths_summary,
      concerns_summary: entity.concerns_summary,
      technical_summary: entity.technical_summary ?? null,
      communication_summary: entity.communication_summary ?? null,
      overall_score: entity.overall_score ?? null,
      technical_score: entity.technical_score ?? null,
      communication_score: entity.communication_score ?? null,
      problem_solving_score: entity.problem_solving_score ?? null,
      culture_fit_score: entity.culture_fit_score ?? null,
      final_ai_recommendation: entity.final_ai_recommendation,
      generation_status: entity.generation_status ?? null,
      failure_reason: entity.failure_reason ?? null,
      generated_at: entity.generated_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
