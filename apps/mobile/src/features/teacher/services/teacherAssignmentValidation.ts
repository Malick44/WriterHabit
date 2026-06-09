import type { TranslationKey } from "@/i18n";

import {
  createTeacherAssignmentFormSchema,
  normalizeCreateTeacherAssignmentForm,
  type CreateTeacherAssignmentFormValues,
  type CreateTeacherAssignmentInput,
} from "../types";

export type TeacherAssignmentFieldErrors = Partial<
  Record<keyof CreateTeacherAssignmentFormValues, TranslationKey>
>;

export type TeacherAssignmentValidationResult =
  | {
      input: CreateTeacherAssignmentInput;
      success: true;
    }
  | {
      fieldErrors: TeacherAssignmentFieldErrors;
      success: false;
    };

function getMessageKey(message: string): TranslationKey {
  return message.startsWith("teacher.create.errors.")
    ? (message as TranslationKey)
    : "teacher.create.errors.validation";
}

export function validateTeacherAssignmentForm(
  values: CreateTeacherAssignmentFormValues,
): TeacherAssignmentValidationResult {
  const result = createTeacherAssignmentFormSchema.safeParse(values);

  if (!result.success) {
    const fieldErrors = result.error.issues.reduce<TeacherAssignmentFieldErrors>((errors, issue) => {
      const field = issue.path[0];

      if (typeof field !== "string") {
        return errors;
      }

      const fieldKey = field as keyof CreateTeacherAssignmentFormValues;

      if (errors[fieldKey]) {
        return errors;
      }

      return {
        ...errors,
        [fieldKey]: getMessageKey(issue.message),
      };
    }, {});

    return {
      fieldErrors,
      success: false,
    };
  }

  return {
    input: normalizeCreateTeacherAssignmentForm(result.data),
    success: true,
  };
}
