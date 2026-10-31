import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PusulaBg } from '@/components/PusulaBg';
import { NAVY } from '@/constants/pusula';

const BLUE = '#1d5fb0'; const BLUE2 = '#2a74d0'; const CYAN = '#7fd0ff';

function Art({ page }: { page: number }) {
  return <Svg viewBox="0 0 340 190" width={320} height={180}>
    {page === 0 ? <>
      <Rect x={40} y={30} width={200} height={34} rx={10} fill={BLUE} /><Rect x={40} y={76} width={160} height={34} rx={10} fill={BLUE2} /><Rect x={40} y={122} width={220} height={34} rx={10} fill={BLUE} />
      <Circle cx={270} cy={47} r={9} fill={CYAN} /><Circle cx={230} cy={93} r={9} fill={CYAN} /><Circle cx={290} cy={139} r={9} fill={CYAN} />
    </> : page === 1 ? <>
      <Polyline points="30,150 90,120 150,132 210,80 270,60 310,36" fill="none" stroke={CYAN} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={310} cy={36} r={9} fill="#fff" /><Line x1={30} y1={165} x2={320} y2={165} stroke={BLUE2} strokeWidth={2} />
    </> : <>
      <Circle cx={110} cy={95} r={46} fill={BLUE} stroke={CYAN} strokeWidth={3} /><Circle cx={250} cy={95} r={46} fill={BLUE2} stroke={CYAN} strokeWidth={3} />
      <Line x1={156} y1={95} x2={204} y2={95} stroke="#fff" strokeWidth={4} strokeDasharray="2 9" strokeLinecap="round" />
      <Circle cx={110} cy={84} r={12} fill="#fff" /><Circle cx={250} cy={84} r={12} fill="#fff" />
      <Path d="M88 120a22 18 0 0 1 44 0z" fill="#fff" /><Path d="M228 120a22 18 0 0 1 44 0z" fill="#fff" />
    </>}
  </Svg>;
}

const PAGES = [
  { title: 'Programını Kur,\nRotanı Belirle!', text: 'Ders programını kendin hazırla veya yapay zekâdan yardım alarak sana en uygun programı oluştur!' },
  { title: 'Gelişimini\nNet Gör!', text: 'Deneme netlerini grafiklerle takip et, yanlış sorularını tek yerde topla ve gelişimini adım adım gör!' },
  { title: 'Öğretmeninle\nBağlantıda Kal! 💬', text: 'Sınıf koduyla katıl; öğretmeninle ve sınıf arkadaşlarınla sohbette yaz, çalışma planını takip et. Verilerin ve gelişim raporun hep senin kontrolünde!' },
];

/** İlk karşılama: 3 sayfa, Atla / Devam / Başla. */
export function Intro({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const p = PAGES[page];
  return <PusulaBg rings={false}>
    <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 28 }}>
      <View style={{ height: 44, alignItems: 'flex-end', justifyContent: 'center' }}>
        <Pressable onPress={onDone} hitSlop={12} style={{ minHeight: 44, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' }}><Text style={{ color: NAVY.link, fontSize: 16 }}>Atla</Text></Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 36 }}>
        <Art page={page} />
        <View style={{ alignItems: 'center', gap: 14 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38, textAlign: 'center' }}>{p.title}</Text>
          <Text style={{ color: '#c4daf5', fontSize: 17, lineHeight: 25, textAlign: 'center' }}>{p.text}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
        {PAGES.map((_, i) => <View key={i} style={{ width: i === page ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? '#fff' : NAVY.dim }} />)}
      </View>
      <Pressable onPress={() => (last ? onDone() : setPage(page + 1))} style={({ pressed }) => ({ height: 56, borderRadius: 28, backgroundColor: NAVY.button, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{last ? 'Başla' : 'Devam'}</Text>
      </Pressable>
    </View>
  </PusulaBg>;
}
