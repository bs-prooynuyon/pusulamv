import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, PusulaBg } from '@/components/PusulaBg';

/** Açılış ekranı (A): parlayan pusula, ad ve slogan. */
export function Splash() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, [opacity]);
  return <PusulaBg ringY={0.42}>
    <Animated.View style={{ flex: 1, opacity, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
      <Compass size={230} />
      <Text style={{ color: '#fff', fontSize: 44, fontWeight: '800', marginTop: 18 }}>Pusulam</Text>
      <Text style={{ color: '#a9c8f0', fontSize: 15, letterSpacing: 1.2, marginTop: 6 }}>KİŞİSEL ROTA</Text>
    </Animated.View>
    <View style={{ position: 'absolute', bottom: insets.bottom + 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
      {[0, 1, 2].map((i) => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />)}
    </View>
  </PusulaBg>;
}
