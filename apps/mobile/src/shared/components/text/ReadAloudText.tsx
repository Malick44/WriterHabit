import { Text, type StyleProp, type TextStyle } from "react-native";

import { colors } from "@/design/tokens";
import {
  normalizeUtteranceText,
  segmentWordOffset,
  useReadAloudHighlightStore,
} from "@/services/speech/readAloudHighlightStore";

export interface ReadAloudTextProps {
  /** The text to render — the same text handed to read-aloud (or a segment of it). */
  text: string;
  style?: StyleProp<TextStyle>;
  /** Style applied to the currently spoken word. Defaults to a soft token highlight. */
  highlightStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  selectable?: boolean;
  testID?: string;
}

const defaultHighlightStyle: TextStyle = {
  backgroundColor: colors.feedback.info.background,
  color: colors.feedback.info.text,
};

const WHITESPACE_TOKEN = /^\s+$/;

/**
 * Drop-in replacement for `Text` that lights up the word currently being
 * spoken by read-aloud. Works automatically: when the read-aloud facade plays
 * this text (or a larger utterance containing it), the active word gets the
 * highlight; otherwise it renders as plain text. Matching is by word
 * sequence, so whitespace differences between display and spoken text are
 * irrelevant.
 */
export function ReadAloudText({
  text,
  style,
  highlightStyle,
  accessibilityLabel,
  selectable,
  testID,
}: ReadAloudTextProps) {
  const normalized = normalizeUtteranceText(text);
  const localActiveWordIndex = useReadAloudHighlightStore((state) => {
    if (!state.utteranceText || state.activeWordIndex < 0 || normalized.length === 0) {
      return -1;
    }
    const segment = segmentWordOffset(state.utteranceText, normalized);
    if (!segment) {
      return -1;
    }
    const local = state.activeWordIndex - segment.offset;
    return local >= 0 && local < segment.wordCount ? local : -1;
  });

  if (localActiveWordIndex === -1) {
    return (
      <Text accessibilityLabel={accessibilityLabel} selectable={selectable} style={style} testID={testID}>
        {text}
      </Text>
    );
  }

  const tokens = text.split(/(\s+)/);
  let wordIndex = -1;

  return (
    <Text accessibilityLabel={accessibilityLabel} selectable={selectable} style={style} testID={testID}>
      {tokens.map((token, index) => {
        if (token.length === 0 || WHITESPACE_TOKEN.test(token)) {
          return token;
        }
        wordIndex += 1;
        if (wordIndex !== localActiveWordIndex) {
          return token;
        }
        return (
          <Text key={`active-${index}`} style={highlightStyle ?? defaultHighlightStyle}>
            {token}
          </Text>
        );
      })}
    </Text>
  );
}
