export interface ApiSuccessResponseInterface<T = unknown> {
  success: true;
  message: string;
  data: T;
}
