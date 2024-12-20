import { TouchableOpacity, Text } from "react-native";
import { useTheme } from "react-native-paper";

function Button({ title, onPress }) {
    const theme = useTheme();
    return (
        <TouchableOpacity
            style={{
                backgroundColor: theme.colors.button,
                height: 52,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 20,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 6,
            }}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text
                style={{
                    color: "black",
                    fontSize: 18,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                }}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

export default Button;