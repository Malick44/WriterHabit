import { memo } from "react";

import { Modal } from "./Modal";
import type { ModalProps } from "./types";

export const BottomSheetModal = memo(function BottomSheetModal(props: Omit<ModalProps, "mode" | "bottomSheet">) {
  return <Modal {...props} mode="bottomSheet" />;
});
