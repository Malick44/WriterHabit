import { createContext } from "react";

import type { TopAlertApi } from "./topAlert.types";

export const TopAlertContext = createContext<TopAlertApi | null>(null);
