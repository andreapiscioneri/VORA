import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useI18n } from '../../i18n'
import { radius, spacing } from '../../constants/theme'

const CONTACT_EMAIL = 'andrypiscioneri@gmail.com'

export function ContactSection() {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  function submit() {
    const subject = t('welcome.contact.mailSubject')
    const body = [
      `${t('welcome.contact.form.name')}: ${name}`,
      `${t('welcome.contact.form.email')}: ${email}`,
      '',
      message,
    ].join('\n')
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{t('welcome.contact.eyebrow')}</Text>
      <Text style={styles.title}>{t('welcome.contact.title')}</Text>
      <Text style={styles.subtitle}>{t('welcome.contact.subtitle')}</Text>

      <View style={styles.form}>
        <Text style={styles.label}>{t('welcome.contact.form.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('welcome.contact.form.namePlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.3)"
        />

        <Text style={styles.label}>{t('welcome.contact.form.email')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t('welcome.contact.form.emailPlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.3)"
        />

        <Text style={styles.label}>{t('welcome.contact.form.message')}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          placeholder={t('welcome.contact.form.messagePlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.3)"
        />

        <Pressable onPress={submit} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
          <Text style={styles.ctaText}>{t('welcome.contact.form.submit')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing(5), paddingVertical: spacing(10), paddingBottom: spacing(16), backgroundColor: '#0A0F08' },
  eyebrow: { color: '#39FF14', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -1, marginTop: spacing(2) },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginTop: spacing(3) },
  form: { marginTop: spacing(6), gap: spacing(1) },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginTop: spacing(4), marginBottom: spacing(1.5) },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    color: '#FFFFFF',
    fontSize: 14,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  cta: {
    marginTop: spacing(6),
    alignSelf: 'flex-start',
    backgroundColor: '#39FF14',
    paddingHorizontal: spacing(7),
    paddingVertical: spacing(4),
    borderRadius: radius.full,
  },
  ctaText: { color: '#0A0A0A', fontSize: 15, fontWeight: '700' },
  pressed: { transform: [{ scale: 0.96 }] },
})
