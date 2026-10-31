import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, styles } from '@/components/PlanimUI';
import { Compass, PusulaBg } from '@/components/PusulaBg';
import { NAVY } from '@/constants/pusula';
import { PRIVACY_SECTIONS, PRIVACY_VERSION } from '@/constants/privacy';
import { TERMS_SECTIONS, TERMS_VERSION } from '@/constants/terms';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

type Tone = { navy?: boolean };

function LegalList({ sections, navy }: { sections: { title: string; body: string }[] } & Tone) {
  const colors = useColors();
  return <View style={{ gap: 12 }}>
    {sections.map((section) => navy
      ? <View key={section.title} style={{ backgroundColor: NAVY.card, borderWidth: 1, borderColor: NAVY.border, borderRadius: 18, padding: 16, gap: 8 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{section.title}</Text>
        <Text style={{ color: NAVY.soft, fontSize: 13, lineHeight: 20 }}>{section.body}</Text>
      </View>
      : <Card key={section.title}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: 16 }]}>{section.title}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>{section.body}</Text>
      </Card>)}
  </View>;
}

export const PrivacyText = ({ navy }: Tone) => <LegalList sections={PRIVACY_SECTIONS} navy={navy} />;
export const TermsText = ({ navy }: Tone) => <LegalList sections={TERMS_SECTIONS} navy={navy} />;

const ITEMS = [
  { key: 'read', label: 'Aydınlatma metnini okudum', detail: null as string | null },
  { key: 'terms', label: 'Kullanım şartlarını ve sohbet kurallarını kabul ediyorum', detail: null as string | null },
  { key: 'usage', label: 'Uygulama kullanım süremin kaydedilmesine izin veriyorum', detail: 'Ders sırasında hangi uygulamanın kaç dakika açıldığı yalnızca bu telefonda kaydedilir. Mesaj veya içerik okunmaz.' },
  { key: 'lock', label: 'Ders sırasında uygulamaların kilitlenmesini kabul ediyorum', detail: 'Ders sırasında seçtiğin uygulamalar kilitlenir. Telefon, mesaj ve rehber her zaman açık kalır. Ayarlardan hangilerinin kilitleneceğini sen seçersin.' },
  { key: 'abroad', label: 'Bilgilerimin yurt dışındaki sunucularda işlenmesini kabul ediyorum', detail: 'Hesap açarsan bilgilerin Google’ın Firebase sunucularında, yapay zeka özelliklerini kullanırsan gönderdiğin PDF ve fotoğraflar Google’ın yapay zeka hizmetinde işlenir. Bu sunucular Türkiye dışındadır. Hesap açmazsan bilgilerin yalnızca telefonunda kalır.' },
  { key: 'guardian', label: '18 yaşından küçüksem ebeveynimin bilgisi ve onayı var', detail: 'Uygulamayı 18 yaşından küçükler de kullanabilir; bunun için ebeveyninin veya yasal vasisinin bilgisi ve onayı olmalıdır. 18 yaşını doldurduysan bu kutuyu da işaretleyerek devam edebilirsin.' },
] as const;
type Key = (typeof ITEMS)[number]['key'];

/** İlk açılışta bir kez gösterilir. Uygulamanın lacivert temasıyla; yazıya dokununca ayrıntı açılır. */
export function Consent() {
  const insets = useSafeAreaInsets();
  const { updateSettings } = usePlanim();
  const [checked, setChecked] = useState<Record<Key, boolean>>({ read: false, terms: false, usage: false, lock: false, abroad: false, guardian: false });
  const [open, setOpen] = useState<Key | null>(null);
  const [year, setYear] = useState('');
  const thisYear = new Date().getFullYear();
  const yearNum = /^\d{4}$/.test(year) ? Number(year) : 0;
  const yearValid = yearNum >= 1940 && yearNum <= thisYear;
  /** Yalnızca doğum yılı sorulur; 13 yaşından küçükler uygulamayı kullanamaz. */
  const tooYoung = yearValid && thisYear - yearNum < 13;
  const ready = Object.values(checked).every(Boolean) && yearValid && !tooYoung;
  const item = ITEMS.find((i) => i.key === open);
  const set = (k: Key, v: boolean) => setChecked((c) => ({ ...c, [k]: v }));

  return <PusulaBg ringY={0.1}>
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 22, gap: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <Compass size={96} />
        <Text style={{ color: NAVY.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: 8 }}>BAŞLAMADAN ÖNCE</Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 }}>Gizlilik ve izinler</Text>
        <Text style={{ color: NAVY.soft, fontSize: 14, textAlign: 'center', marginTop: 6 }}>Ayrıntı için yazıya dokun, onaylamak için kutuyu işaretle.</Text>
      </View>
      <View style={{ backgroundColor: NAVY.card, borderWidth: 1, borderColor: tooYoung ? '#ff8a8a' : NAVY.border, borderRadius: 22, padding: 16, gap: 8 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Doğum yılın</Text>
        <TextInput value={year} onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="Örn. 2012" placeholderTextColor="#7893bd" maxLength={4} style={{ color: '#fff', fontSize: 18, backgroundColor: '#0c2c5c', borderRadius: 14, paddingHorizontal: 14, height: 48 }} />
        {tooYoung ? <Text style={{ color: '#ffb4b4', fontSize: 13, lineHeight: 19 }}>Pusulam 13 yaş ve üzeri öğrenciler için hazırlandı. Şimdilik uygulamayı kullanamazsın; yaşın geldiğinde görüşmek üzere.</Text> : <Text style={{ color: NAVY.dim, fontSize: 12 }}>Sadece yaş sınırını kontrol etmek için sorulur.</Text>}
      </View>
      <View style={{ backgroundColor: NAVY.card, borderWidth: 1, borderColor: NAVY.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 6 }}>
        {ITEMS.map((it, i) => <View key={it.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: NAVY.border }}>
          <Pressable onPress={() => set(it.key, !checked[it.key])} hitSlop={10}><Feather name={checked[it.key] ? 'check-square' : 'square'} size={26} color={checked[it.key] ? NAVY.accent : NAVY.dim} /></Pressable>
          <Pressable onPress={() => setOpen(it.key)} style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 19 }}>{it.label}</Text>
            <Text style={{ color: NAVY.accent, fontSize: 12, fontWeight: '800', marginTop: 2 }}>Oku ›</Text>
          </Pressable>
        </View>)}
      </View>
      <Pressable disabled={!ready} onPress={() => updateSettings({ birthYear: yearNum, consentAccepted: true, consentAt: new Date().toISOString(), consentVersion: `${PRIVACY_VERSION}.${TERMS_VERSION}` })} style={{ height: 56, borderRadius: 28, backgroundColor: NAVY.button, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.45, flexDirection: 'row', gap: 8 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Onaylıyorum ve devam ediyorum</Text>
        <Feather name="arrow-right" size={18} color="#fff" />
      </Pressable>
      {!ready ? <Text style={{ color: NAVY.dim, fontSize: 12, textAlign: 'center' }}>Devam etmek için doğum yılını yaz ve tüm kutuları işaretle.</Text> : null}
    </ScrollView>
    <Modal visible={!!item} animationType="slide" onRequestClose={() => setOpen(null)}>
      <View style={{ flex: 1, backgroundColor: NAVY.mid, paddingTop: insets.top + 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 10, gap: 10 }}>
          <Text style={{ flex: 1, color: '#fff', fontSize: 19, fontWeight: '800' }}>{item?.key === 'read' ? 'Aydınlatma metni' : item?.key === 'terms' ? 'Kullanım şartları' : item?.label}</Text>
          <Pressable onPress={() => setOpen(null)} hitSlop={10}><Feather name="x" size={24} color="#fff" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
          {item?.key === 'read' ? <PrivacyText navy /> : item?.key === 'terms' ? <TermsText navy /> : <Text style={{ color: '#fff', fontSize: 15, lineHeight: 23 }}>{item?.detail}</Text>}
        </ScrollView>
        <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable onPress={() => { if (item) set(item.key, true); setOpen(null); }} style={{ height: 54, borderRadius: 27, backgroundColor: NAVY.button, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Okudum, onaylıyorum</Text></Pressable>
        </View>
      </View>
    </Modal>
  </PusulaBg>;
}
