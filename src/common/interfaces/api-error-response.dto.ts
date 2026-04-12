export interface ApiErrorResponseInterface {
  success: false;
  message: string;
  error: {
    code: string;
    details: unknown;
  };
}