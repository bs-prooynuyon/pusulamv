import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { NAVY } from '@/constants/pusula';

/** Lacivert degrade + ince halkalar (açılış, giriş, tanıtım, ana sayfa). */
export function PusulaBg({ children, style, ringY = 0.3, rings = true }: { children?: React.ReactNode; style?: ViewStyle; ringY?: number; rings?: boolean }) {
  return <LinearGradient colors={[NAVY.top, NAVY.mid, NAVY.bottom]} locations={[0, 0.55, 1]} style={[{ flex: 1 }, style]}>
    {rings ? <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice">
        {[90, 150, 210, 270, 330, 390, 450].map((r) => <Circle key={r} cx={195} cy={844 * ringY} r={r} fill="none" stroke="#ffffff" strokeOpacity={0.07} strokeWidth={1} />)}
      </Svg>
    </View> : null}
    {children}
  </LinearGradient>;
}

/** Metal pusula görseli (şeffaf kenarlı). */
export function Compass({ size = 200 }: { size?: number }) {
  return <Image source={require('../assets/images/pusula.png')} style={{ width: size, height: size }} resizeMode="contain" />;
}
