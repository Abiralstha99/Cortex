export class LoadError extends Error {
  readonly name = "LoadError";
  constructor(message: string) {
    super(message);
  }
}

export class ChunkError extends Error {
  readonly name = "ChunkError";
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  readonly name = "ValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class GenerationError extends Error {
  readonly name = "GenerationError";
  constructor(message: string) {
    super(message);
  }
}

export class PipelineError extends Error {
  readonly name = "PipelineError";
  constructor(message: string) {
    super(message);
  }
}
