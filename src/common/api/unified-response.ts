export type UnifiedResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T | null;
  listData: T[] | null;
  token: string | null;
};

export const ok = <T>(params: {
  message: string;
  data?: T | null;
  listData?: T[] | null;
  token?: string | null;
}): UnifiedResponse<T> => ({
  success: true,
  message: params.message,
  data: params.data ?? null,
  listData: params.listData ?? null,
  token: params.token ?? null,
});
