import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UnderscoreHintProps {
  targetMeaning: string;
  userInput: string;
}

export const UnderscoreHint: React.FC<UnderscoreHintProps> = ({
  targetMeaning,
  userInput,
}) => {
  // If meaning has multiple senses separated by comma or slash (e.g. "hấp thụ, tiếp thu"),
  // get primary meaning for hint
  const primaryMeaning = targetMeaning.split(/[,;/]/)[0].trim();

  // Split into words
  const words = primaryMeaning.split(/\s+/).filter(Boolean);
  const inputLetters = userInput.trim().replace(/\s+/g, ' ');

  let currentInputCharIndex = 0;

  return (
    <View style={styles.container}>
      <Text style={styles.hintTitle}>GỢI Ý KÝ TỰ TIẾNG VIỆT:</Text>
      <View style={styles.wordsRow}>
        {words.map((w, wordIndex) => {
          const chars = Array.from(w);
          return (
            <View key={wordIndex} style={styles.wordGroup}>
              {chars.map((char, charIndex) => {
                const userChar = inputLetters[currentInputCharIndex];
                const isFilled = !!userChar && userChar !== ' ';
                currentInputCharIndex++;

                return (
                  <View key={charIndex} style={styles.slotContainer}>
                    <Text
                      style={[
                        styles.charSlot,
                        isFilled && styles.charSlotFilled,
                      ]}
                    >
                      {isFilled ? userChar : '_'}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
      <Text style={styles.wordCountNote}>
        ({words.length} từ • {primaryMeaning.replace(/\s+/g, '').length} ký tự)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
  },
  hintTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  wordGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotContainer: {
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charSlot: {
    fontSize: 22,
    fontWeight: '900',
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  charSlotFilled: {
    color: '#0284C7',
  },
  wordCountNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
});
