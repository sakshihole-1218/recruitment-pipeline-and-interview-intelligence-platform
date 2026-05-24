import { FeedbackAiSummaryEntity } from '../entities/feedback-ai-summary.entity';
import { ResumeAiAnalysisEntity } from '../entities/resume-ai-analysis.entity';
import { FeedbackAiSummaryResponseDto } from '../dto/feedback-ai-summary.response.dto';
import { ResumeAiAnalysisResponseDto } from '../dto/resume-ai-analysis.response.dto';

export class AiInsightsMapper {
  static toResumeAnalysisResponse(entity: ResumeAiAnalysisEntity): ResumeAiAnalysisResponseDto {
    return {
      id: entity.id,
      candidate_document_id: entity.candidate_document_id,
      extracted_text: entity.extracted_text,
      skills_extracted: entity.skills_extracted,
      experience_summary: entity.experience_summary,
      education_summary: entity.education_summary,
      ai_fit_score: entity.ai_fit_score,
      analysis_status: entity.analysis_status,
      analyzed_at: entity.analyzed_at,
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
      final_ai_recommendation: entity.final_ai_recommendation,
      generated_at: entity.generated_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
