import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

export interface NetSeries { name: string; color: string; values: number[] }

/** Çok çizgili net grafiği (Sözel / Sayısal). Her nokta bir denemedir. */
export function NetChart({ labels, series, height = 180 }: { labels: string[]; series: NetSeries[]; height?: number }) {
  const colors = useColors();
  if (labels.length === 0) return <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Bu dönemde deneme yok.</Text>;
  const W = 350; const padX = 24; const top = 22; const bottom = 28;
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(...all, 0); const hi = Math.max(...all, 1);
  const range = hi - lo || 1;
  const x = (i: number) => (labels.length === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (labels.length - 1));
  const y = (v: number) => top + (1 - (v - lo) / range) * (height - top - bottom);
  const grid = [0, 1, 2, 3].map((i) => top + (i * (height - top - bottom)) / 3);
  return <View style={{ width: '100%' }}>
    <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
      {grid.map((gy) => <Line key={gy} x1={10} x2={W - 10} y1={gy} y2={gy} stroke={colors.border} strokeWidth={1} />)}
      {series.map((s) => <React.Fragment key={s.name}>
        {s.values.length > 1 ? <Polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {s.values.map((v, i) => <Circle key={i} cx={x(i)} cy={y(v)} r={4.5} fill={s.color} />)}
      </React.Fragment>)}
      {labels.map((l, i) => <SvgText key={`${l}-${i}`} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={colors.mutedForeground}>{l}</SvgText>)}
    </Svg>
    <View style={{ flexDirection: 'row', gap: 18, marginTop: 8 }}>
      {series.map((s) => <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: s.color }} /><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{s.name}</Text></View>)}
    </View>
  </View>;
}
