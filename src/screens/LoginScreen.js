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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../themes/colors';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/loginStyles';
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
    outputRange: [colors.amarillo, colors.blanco],
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
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
                transform: [{ translateY: titleAnimY }],
                zIndex: 10,
                elevation: 10,
              }}
            >
              <Animated.Text style={[styles.title, { color: interpolatedColor }]}>
                GEVOPI
              </Animated.Text>

              <Animated.View style={{ opacity: loadingOpacity, marginTop: 15 }}>
                <ActivityIndicator size="large" color={colors.verdeOscuro} />
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
                style={styles.icon}
              />
              <TextInput
                placeholder="Ingrese su usuario"
                style={styles.input}
                placeholderTextColor={colors.gray}
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
                style={styles.icon}
              />
              <TextInput
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor={colors.gray}
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
                  color={colors.naranjaFuerte}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}