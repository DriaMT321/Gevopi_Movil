import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import { login, getLoggedCi } from '../services/authService';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const titleAnimY = useRef(new Animated.Value(0)).current;
  const blueAnim = useRef(new Animated.Value(-height)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const screenFadeOut = useRef(new Animated.Value(1)).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const titleColor = useRef(new Animated.Value(0)).current;
  const interpolatedColor = titleColor.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.warning, theme.colors.textLight],
  });

  const navigation = useNavigation();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(2000),
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.timing(blueAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(titleAnimY, {
          toValue: -height * 0.2,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(titleColor, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!username.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tanto el usuario como la contraseña');
      return;
    }

    try {
      const token = await login(username, password);
      console.log("TOKEN:", token);

      const emailGuardado = getLoggedCi();
      console.log("EMAIL GUARDADO:", emailGuardado);

      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(formOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(titleAnimY, {
          toValue: -height,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(titleColor, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(blueAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(screenFadeOut, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start(() => {
        navigation.navigate('Perfil');
      });

    } catch (error) {
      Alert.alert('Error de autenticación', 'Usuario o contraseña incorrectos');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.container, { opacity: screenFadeOut }]}>
          {!isKeyboardVisible && (
            <Animated.View
              style={{
                alignItems: 'center',
                position: 'absolute',
                top: height / 2 - 120,
                left: 0,
                right: 0,
                transform: [{ translateY: titleAnimY }],
                zIndex: 10,
                elevation: 10,
              }}
            >
              <Animated.Text style={[styles.title, { color: interpolatedColor }]}>
                GEVOPI
              </Animated.Text>

              <Animated.View style={{ opacity: loadingOpacity, marginTop: 15 }}>
                <ActivityIndicator size="large" color={theme.colors.success} />
              </Animated.View>
            </Animated.View>
          )}

          <Animated.View style={[styles.blueContainer, { transform: [{ translateY: blueAnim }] }]} />

          {!isKeyboardVisible && (
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
              Tu bienestar también importa
            </Animated.Text>
          )}

          <Animated.View style={[styles.card, { opacity: formOpacity, marginTop: isKeyboardVisible ? 100 : 0 }]}>
            <Text style={styles.cardTitle}>Inicia Sesión</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={theme.colors.textSecondary}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Ingrese su usuario"
                  style={styles.input}
                  placeholderTextColor={theme.colors.placeholder}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Ingrese su contraseña"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  placeholderTextColor={theme.colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  blueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: theme.typography.fontSize.title,
    fontWeight: theme.typography.fontWeight.extrabold,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: height * 0.35,
    fontWeight: theme.typography.fontWeight.medium,
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xxl,
    padding: theme.spacing.xl,
    borderRadius: theme.spacing.borderRadius.lg,
    ...theme.shadows.lg,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  showPasswordButton: {
    padding: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  buttonText: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
  },
});