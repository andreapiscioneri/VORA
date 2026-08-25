import { useCallback, useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import { I18nProvider } from '../i18n'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { registerForPushNotificationsAsync } from '../lib/pushNotifications'

SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ duration: 400, fade: true })

const PUBLIC_SEGMENTS = ['login', 'welcome']

function RootStack() {
  const { scheme, colors } = useTheme()
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const onPublicScreen = PUBLIC_SEGMENTS.includes(segments[0] ?? '')
    if (!user && !onPublicScreen) {
      router.replace('/welcome')
    } else if (user && onPublicScreen) {
      router.replace('/')
    }
  }, [user, loading, segments])

  useEffect(() => {
    if (user) registerForPushNotificationsAsync()
  }, [user])

  return (
    <>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  const onLayout = useCallback(() => {
    if (!ready) {
      setReady(true)
      SplashScreen.hideAsync()
    }
  }, [ready])

  return (
    <SafeAreaProvider onLayout={onLayout}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <RootStack />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
