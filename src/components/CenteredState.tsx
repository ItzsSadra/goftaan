import { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type CenteredStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export const CenteredState = ({ title, description, action }: CenteredStateProps) => {
  const { width } = useWindowDimensions();
  const isSmall = width < 380;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.title, isSmall && styles.titleSmall]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, isSmall && styles.descriptionSmall]}>{description}</Text>
        ) : null}
        {action ? <View style={styles.actionWrap}>{action}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 17,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: typography.regular,
  },
  descriptionSmall: {
    fontSize: 13,
    lineHeight: 20,
  },
  actionWrap: {
    marginTop: 4,
    width: '100%',
  },
});
