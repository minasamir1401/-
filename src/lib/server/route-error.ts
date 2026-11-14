export class RouteError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string,
  ) {
    super(message);
  }
}
