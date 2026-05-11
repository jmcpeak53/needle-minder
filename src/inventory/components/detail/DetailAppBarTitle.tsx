import { StyleSheet, Text, View } from "react-native";

import { colors, font } from "../../../ui/theme";

type Props = {
  code: string;
  name: string;
};

export function DetailAppBarTitle({ code, name }: Props) {
  return (
    <View>
      <Text style={styles.code} numberOfLines={1}>
        {code}
      </Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 0.2
  },
  name: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  }
});
