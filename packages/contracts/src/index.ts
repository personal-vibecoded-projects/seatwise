import { Type, type Static } from '@sinclair/typebox';
export const HealthSchema = Type.Object(
  { status: Type.Union([Type.Literal('ok'), Type.Literal('unavailable')]) },
  { additionalProperties: false },
);
export type Health = Static<typeof HealthSchema>;
export const ErrorSchema = Type.Object(
  {
    error: Type.Object(
      { code: Type.String(), message: Type.String(), requestId: Type.String() },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);
