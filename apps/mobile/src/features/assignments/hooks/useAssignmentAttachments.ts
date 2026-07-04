import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { create } from "zustand";

import type {
  AssignmentAttachment,
  AssignmentAttachmentKind,
  AttachmentExtraction,
  ExtractionStatus,
} from "../services/attachmentTypes";
import {
  composeExtractedText,
  extractTextFromAttachment,
} from "../services/textExtractionService";

export type {
  AssignmentAttachment,
  AssignmentAttachmentKind,
  AttachmentExtraction,
  ExtractionStatus,
};

export type AttachmentError = "permission" | "failed";

const EMPTY_ATTACHMENTS: AssignmentAttachment[] = [];

interface AttachmentStoreState {
  byScope: Record<string, AssignmentAttachment[]>;
  clearScope: (scope: string) => void;
  setScoped: (
    scope: string,
    updater: (previous: AssignmentAttachment[]) => AssignmentAttachment[],
  ) => void;
}

/**
 * Attachments live in a module-level store keyed by scope (usually the
 * assignment id) so photos added on one screen — e.g. the assignment detail
 * typed-copy step — are still there when the submission screen mounts.
 */
const useAttachmentStore = create<AttachmentStoreState>()((set) => ({
  byScope: {},
  clearScope: (scope) =>
    set((state) => {
      const { [scope]: _removed, ...rest } = state.byScope;
      return { byScope: rest };
    }),
  setScoped: (scope, updater) =>
    set((state) => ({
      byScope: {
        ...state.byScope,
        [scope]: updater(state.byScope[scope] ?? EMPTY_ATTACHMENTS),
      },
    })),
}));

let attachmentCounter = 0;

function createAttachmentId(): string {
  attachmentCounter += 1;
  return `attachment-${Date.now()}-${attachmentCounter}`;
}

function imageToAttachment(
  asset: ImagePicker.ImagePickerAsset,
): AssignmentAttachment {
  return {
    id: createAttachmentId(),
    kind: "image",
    uri: asset.uri,
    name: asset.fileName ?? `photo-${attachmentCounter}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
    sizeBytes: asset.fileSize,
    extraction: { status: "pending", text: "" },
  };
}

function fileToAttachment(
  asset: DocumentPicker.DocumentPickerAsset,
): AssignmentAttachment {
  return {
    id: createAttachmentId(),
    kind: "file",
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType,
    sizeBytes: asset.size,
    extraction: { status: "pending", text: "" },
  };
}

export interface AssignmentAttachmentsState {
  attachments: AssignmentAttachment[];
  isPicking: boolean;
  isExtracting: boolean;
  /** Combined recognized text from every successfully-extracted attachment. */
  extractedText: string;
  error: AttachmentError | null;
  takePhoto: () => Promise<void>;
  pickPhoto: () => Promise<void>;
  pickFile: () => Promise<void>;
  remove: (id: string) => void;
  retryExtraction: (id: string) => void;
  clearError: () => void;
}

/**
 * Manages photo/file attachments a student adds to an assignment submission and
 * runs text extraction on each one. Wraps expo-image-picker (camera + library),
 * expo-document-picker, and the text-extraction service. URIs stay local;
 * uploading bytes to a backend is handled by the submit flow.
 *
 * Pass a `scopeKey` (usually the assignment id) to share the same attachment
 * list across screens; without one the list is private to this mount and
 * cleared on unmount, matching the previous local-state behavior.
 */
export function useAssignmentAttachments(
  scopeKey?: string,
): AssignmentAttachmentsState {
  const [ephemeralScope] = useState(() => `ephemeral-${createAttachmentId()}`);
  const scope = scopeKey ?? ephemeralScope;
  const attachments = useAttachmentStore(
    (state) => state.byScope[scope] ?? EMPTY_ATTACHMENTS,
  );
  const setScoped = useAttachmentStore((state) => state.setScoped);
  const clearScope = useAttachmentStore((state) => state.clearScope);
  const setAttachments = useCallback(
    (updater: (previous: AssignmentAttachment[]) => AssignmentAttachment[]) =>
      setScoped(scope, updater),
    [scope, setScoped],
  );
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<AttachmentError | null>(null);

  // Unscoped (per-mount) attachment lists don't outlive their screen.
  useEffect(() => {
    if (scopeKey) {
      return;
    }

    return () => clearScope(ephemeralScope);
  }, [clearScope, ephemeralScope, scopeKey]);

  const attachmentsRef = useRef(attachments);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const updateExtraction = useCallback(
    (id: string, extraction: AttachmentExtraction) => {
      setAttachments((previous) =>
        previous.map((attachment) =>
          attachment.id === id ? { ...attachment, extraction } : attachment,
        ),
      );
    },
    [setAttachments],
  );

  const runExtraction = useCallback(
    async (attachment: AssignmentAttachment) => {
      updateExtraction(attachment.id, { status: "extracting", text: "" });
      try {
        const result = await extractTextFromAttachment(attachment);
        updateExtraction(attachment.id, { status: "done", text: result.text });
      } catch {
        updateExtraction(attachment.id, { status: "error", text: "" });
      }
    },
    [updateExtraction],
  );

  const append = useCallback(
    (items: AssignmentAttachment[]) => {
      if (items.length === 0) {
        return;
      }

      setAttachments((previous) => [...previous, ...items]);
      items.forEach((item) => {
        void runExtraction(item);
      });
    },
    [runExtraction, setAttachments],
  );

  const takePhoto = useCallback(async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError("permission");
      return;
    }

    setIsPicking(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });

      if (!result.canceled) {
        append(result.assets.map(imageToAttachment));
      }
    } catch {
      setError("failed");
    } finally {
      setIsPicking(false);
    }
  }, [append]);

  const pickPhoto = useCallback(async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("permission");
      return;
    }

    setIsPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ["images"],
        quality: 0.7,
      });

      if (!result.canceled) {
        append(result.assets.map(imageToAttachment));
      }
    } catch {
      setError("failed");
    } finally {
      setIsPicking(false);
    }
  }, [append]);

  const pickFile = useCallback(async () => {
    setError(null);
    setIsPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: ["image/*", "application/pdf"],
      });

      if (!result.canceled) {
        append(result.assets.map(fileToAttachment));
      }
    } catch {
      setError("failed");
    } finally {
      setIsPicking(false);
    }
  }, [append]);

  const remove = useCallback(
    (id: string) => {
      setAttachments((previous) =>
        previous.filter((attachment) => attachment.id !== id),
      );
    },
    [setAttachments],
  );

  const retryExtraction = useCallback(
    (id: string) => {
      const target = attachmentsRef.current.find(
        (attachment) => attachment.id === id,
      );

      if (target) {
        void runExtraction(target);
      }
    },
    [runExtraction],
  );

  const clearError = useCallback(() => setError(null), []);

  const extractedText = useMemo(
    () => composeExtractedText(attachments),
    [attachments],
  );
  const isExtracting = attachments.some(
    (attachment) => attachment.extraction.status === "extracting",
  );

  return {
    attachments,
    isPicking,
    isExtracting,
    extractedText,
    error,
    takePhoto,
    pickPhoto,
    pickFile,
    remove,
    retryExtraction,
    clearError,
  };
}
