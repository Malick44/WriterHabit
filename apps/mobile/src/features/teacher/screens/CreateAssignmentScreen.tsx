import { useMemo, useState } from "react";
import type { WritingSkill } from "@writewise/shared";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState, SuccessState } from "@/shared/components/feedback";
import { CheckboxRow, ChoiceCard, FormField, TextField } from "@/shared/components/forms";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { teacherSkillLabelKeys } from "../components/teacherLabels";
import { useCreateTeacherAssignment, useTeacherAssignmentsData } from "../hooks/useTeacher";
import {
  validateTeacherAssignmentForm,
  type TeacherAssignmentFieldErrors,
} from "../services/teacherAssignmentValidation";
import type { CreateTeacherAssignmentFormValues } from "../types";

const teacherSkillOptions: WritingSkill[] = [
  "sentence_structure",
  "vocabulary",
  "organization",
  "clarity",
  "evidence_usage",
  "argument_strength",
  "revision_quality",
  "grammar",
  "punctuation",
  "handwriting",
  "reading_response",
  "creativity",
];

function getDefaultDueDate(): string {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  return dueDate.toISOString().slice(0, 10);
}

function getInitialFormValues(classId = "", gradeLevel = "7"): CreateTeacherAssignmentFormValues {
  return {
    allowCanvas: true,
    classId,
    dueDate: getDefaultDueDate(),
    gradeLevel,
    prompt: "",
    rubricText: "Clear response\nUses the skill focus\nRevises one part after feedback",
    skillFocus: [],
    title: "",
  };
}

export function CreateAssignmentScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const assignmentsState = useTeacherAssignmentsData();
  const createAssignment = useCreateTeacherAssignment();
  const initialForm = useMemo(() => getInitialFormValues(), []);
  const [formValues, setFormValues] = useState<CreateTeacherAssignmentFormValues>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<TeacherAssignmentFieldErrors>({});

  const clearFieldError = (field: keyof CreateTeacherAssignmentFormValues) => {
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const toggleSkill = (skill: WritingSkill) => {
    setFormValues((current) => {
      const selected = current.skillFocus.includes(skill);
      const skillFocus = selected
        ? current.skillFocus.filter((item) => item !== skill)
        : [...current.skillFocus, skill];

      return {
        ...current,
        skillFocus,
      };
    });
    clearFieldError("skillFocus");
  };

  const handleSubmit = async () => {
    const validation = validateTeacherAssignmentForm(formValues);

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});

    try {
      await createAssignment.submitAssignment(validation.input);
    } catch {
      // The mutation status renders the recovery state below.
    }
  };

  const resetForm = () => {
    setFormValues(getInitialFormValues());
    setFieldErrors({});
    createAssignment.reset();
  };

  return (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand={assignmentsState.gradeBand}
      subtitle={t("teacher.create.subtitle")}
      testID="teacher-create-assignment-screen"
      title={t("teacher.create.title")}
    >
      {assignmentsState.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("teacher.loading.createAccessibility")}
          description={t("teacher.loading.createDescription")}
          gradeBand={assignmentsState.gradeBand}
          label={t("teacher.loading.createTitle")}
        />
      ) : null}

      {assignmentsState.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.error.createAccessibility")}
          description={t("teacher.error.createDescription")}
          gradeBand={assignmentsState.gradeBand}
          onActionPress={assignmentsState.refetch}
          title={t("teacher.error.createTitle")}
        />
      ) : null}

      {assignmentsState.status === "empty" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.empty.createAccessibility")}
          description={t("teacher.empty.createDescription")}
          gradeBand={assignmentsState.gradeBand}
          onActionPress={assignmentsState.refetch}
          title={t("teacher.empty.createTitle")}
        />
      ) : null}

      {assignmentsState.status === "success" ? (
        <Stack gap="lg">
          {assignmentsState.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("teacher.offline.accessibility")}
              description={t("teacher.offline.description")}
              gradeBand={assignmentsState.gradeBand}
              onActionPress={assignmentsState.refetch}
              title={t("teacher.offline.title")}
              tone="warning"
            />
          ) : null}

          {createAssignment.status === "success" && createAssignment.createdAssignment ? (
            <SuccessState
              accessibilityLabel={t("teacher.create.successAccessibility")}
              description={t("teacher.create.successDescription", {
                title: createAssignment.createdAssignment.title,
              })}
              gradeBand={assignmentsState.gradeBand}
              title={t("teacher.create.successTitle")}
            />
          ) : null}

          {createAssignment.status === "error" ? (
            <ErrorState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("teacher.create.saveErrorAccessibility")}
              description={t("teacher.create.saveErrorDescription")}
              gradeBand={assignmentsState.gradeBand}
              onActionPress={() => {
                void handleSubmit();
              }}
              title={t("teacher.create.saveErrorTitle")}
            />
          ) : null}

          <PageSection
            gradeBand={assignmentsState.gradeBand}
            subtitle={t("teacher.create.detailsSubtitle")}
            title={t("teacher.create.detailsTitle")}
          >
            <Stack gap="md">
              <TextField
                accessibilityLabel={t("teacher.create.fields.titleAccessibility")}
                editable={!createAssignment.isCreating}
                error={fieldErrors.title ? t(fieldErrors.title) : undefined}
                gradeBand={assignmentsState.gradeBand}
                label={t("teacher.create.fields.titleLabel")}
                onChangeText={(title) => {
                  setFormValues((current) => ({ ...current, title }));
                  clearFieldError("title");
                }}
                placeholder={t("teacher.create.fields.titlePlaceholder")}
                required
                value={formValues.title}
              />

              <TextField
                accessibilityLabel={t("teacher.create.fields.promptAccessibility")}
                editable={!createAssignment.isCreating}
                error={fieldErrors.prompt ? t(fieldErrors.prompt) : undefined}
                gradeBand={assignmentsState.gradeBand}
                inputStyle={{ minHeight: 140 }}
                label={t("teacher.create.fields.promptLabel")}
                multiline
                onChangeText={(prompt) => {
                  setFormValues((current) => ({ ...current, prompt }));
                  clearFieldError("prompt");
                }}
                placeholder={t("teacher.create.fields.promptPlaceholder")}
                required
                value={formValues.prompt}
              />

              <TextField
                accessibilityLabel={t("teacher.create.fields.gradeAccessibility")}
                editable={!createAssignment.isCreating}
                error={fieldErrors.gradeLevel ? t(fieldErrors.gradeLevel) : undefined}
                gradeBand={assignmentsState.gradeBand}
                keyboardType="number-pad"
                label={t("teacher.create.fields.gradeLabel")}
                onChangeText={(gradeLevel) => {
                  setFormValues((current) => ({ ...current, gradeLevel }));
                  clearFieldError("gradeLevel");
                }}
                placeholder={t("teacher.create.fields.gradePlaceholder")}
                required
                value={formValues.gradeLevel}
              />

              <TextField
                accessibilityLabel={t("teacher.create.fields.dueDateAccessibility")}
                editable={!createAssignment.isCreating}
                error={fieldErrors.dueDate ? t(fieldErrors.dueDate) : undefined}
                gradeBand={assignmentsState.gradeBand}
                label={t("teacher.create.fields.dueDateLabel")}
                onChangeText={(dueDate) => {
                  setFormValues((current) => ({ ...current, dueDate }));
                  clearFieldError("dueDate");
                }}
                placeholder={t("teacher.create.fields.dueDatePlaceholder")}
                required
                value={formValues.dueDate}
              />
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={assignmentsState.gradeBand}
            subtitle={t("teacher.create.classSubtitle")}
            title={t("teacher.create.classTitle")}
          >
            <FormField
              error={fieldErrors.classId ? t(fieldErrors.classId) : undefined}
              gradeBand={assignmentsState.gradeBand}
              label={t("teacher.create.fields.classLabel")}
              required
            >
              <Stack gap="sm">
                {assignmentsState.viewModel.classes.map((classSummary) => (
                  <ChoiceCard
                    accessibilityHint={t("teacher.create.fields.classHint")}
                    disabled={createAssignment.isCreating}
                    gradeBand={assignmentsState.gradeBand}
                    key={classSummary.id}
                    label={classSummary.name}
                    description={t("teacher.create.fields.classDescription", {
                      count: classSummary.studentCount,
                      grade: classSummary.gradeLevel,
                    })}
                    onPress={() => {
                      setFormValues((current) => ({
                        ...current,
                        classId: classSummary.id,
                        gradeLevel: `${classSummary.gradeLevel}`,
                      }));
                      clearFieldError("classId");
                      clearFieldError("gradeLevel");
                    }}
                    selected={formValues.classId === classSummary.id}
                  />
                ))}
              </Stack>
            </FormField>
          </PageSection>

          <PageSection
            gradeBand={assignmentsState.gradeBand}
            subtitle={t("teacher.create.skillsSubtitle")}
            title={t("teacher.create.skillsTitle")}
          >
            <FormField
              error={fieldErrors.skillFocus ? t(fieldErrors.skillFocus) : undefined}
              gradeBand={assignmentsState.gradeBand}
              hint={t("teacher.create.fields.skillHint")}
              label={t("teacher.create.fields.skillLabel")}
              required
            >
              <Stack gap="xs">
                {teacherSkillOptions.map((skill) => (
                  <CheckboxRow
                    accessibilityHint={t("teacher.create.fields.skillAccessibility")}
                    checked={formValues.skillFocus.includes(skill)}
                    disabled={createAssignment.isCreating}
                    gradeBand={assignmentsState.gradeBand}
                    key={skill}
                    label={t(teacherSkillLabelKeys[skill])}
                    onPress={() => toggleSkill(skill)}
                  />
                ))}
              </Stack>
            </FormField>
          </PageSection>

          <PageSection
            gradeBand={assignmentsState.gradeBand}
            subtitle={t("teacher.create.rubricSubtitle")}
            title={t("teacher.create.rubricTitle")}
          >
            <TextField
              accessibilityHint={t("teacher.create.fields.rubricHint")}
              accessibilityLabel={t("teacher.create.fields.rubricAccessibility")}
              editable={!createAssignment.isCreating}
              error={fieldErrors.rubricText ? t(fieldErrors.rubricText) : undefined}
              gradeBand={assignmentsState.gradeBand}
              inputStyle={{ minHeight: 132 }}
              label={t("teacher.create.fields.rubricLabel")}
              multiline
              onChangeText={(rubricText) => {
                setFormValues((current) => ({ ...current, rubricText }));
                clearFieldError("rubricText");
              }}
              required
              value={formValues.rubricText}
            />
          </PageSection>

          <PageSection
            gradeBand={assignmentsState.gradeBand}
            subtitle={t("teacher.create.optionsSubtitle")}
            title={t("teacher.create.optionsTitle")}
          >
            <CheckboxRow
              accessibilityHint={t("teacher.create.fields.canvasHint")}
              accessibilityLabel={t("teacher.create.fields.canvasAccessibility")}
              checked={formValues.allowCanvas}
              disabled={createAssignment.isCreating}
              gradeBand={assignmentsState.gradeBand}
              label={t("teacher.create.fields.canvasLabel")}
              description={t("teacher.create.fields.canvasDescription")}
              onPress={() => {
                setFormValues((current) => ({ ...current, allowCanvas: !current.allowCanvas }));
              }}
            />
          </PageSection>

          <Stack gap="sm">
            <Button
              accessibilityHint={t("teacher.create.submitHint")}
              accessibilityLabel={t("teacher.create.submitAccessibility")}
              gradeBand={assignmentsState.gradeBand}
              label={t("teacher.create.submitCta")}
              loading={createAssignment.isCreating}
              onPress={() => {
                void handleSubmit();
              }}
            />
            <Button
              accessibilityHint={t("teacher.create.resetHint")}
              accessibilityLabel={t("teacher.create.resetAccessibility")}
              disabled={createAssignment.isCreating}
              gradeBand={assignmentsState.gradeBand}
              label={
                createAssignment.status === "success"
                  ? t("teacher.create.createAnotherCta")
                  : t("common.reset")
              }
              onPress={resetForm}
              variant="secondary"
            />
            <Button
              accessibilityHint={t("teacher.assignments.backHint")}
              accessibilityLabel={t("teacher.assignments.backAccessibility")}
              disabled={createAssignment.isCreating}
              gradeBand={assignmentsState.gradeBand}
              label={t("teacher.assignments.backCta")}
              onPress={() => router.replace(routes.teacherAssignments)}
              variant="ghost"
            />
          </Stack>
        </Stack>
      ) : null}
    </Screen>
  );
}
