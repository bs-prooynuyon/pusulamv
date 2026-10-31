import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

export interface Point { label: string; value: number }

/** Basit çizgi grafik (net gelişimi için). */
export function LineChart({ data, height = 150, unit = '' }: { data: Point[]; height?: number; unit?: string }) {
  const colors = useColors();
  const W = 300; const padX = 22; const padTop = 16; const padBottom = 24;
  if (data.length === 0) return <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Bu dönemde deneme yok.</Text>;
  const values = data.map((d) => d.value);
  const lo = Math.min(...values, 0); const hi = Math.max(...values, 1);
  const range = hi - lo || 1;
  const x = (i: number) => data.length === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (data.length - 1);
  const y = (v: number) => padTop + (1 - (v - lo) / range) * (height - padTop - padBottom);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  return <View style={{ width: '100%' }}>
    <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
      <Line x1={padX} x2={W - padX} y1={height - padBottom} y2={height - padBottom} stroke={colors.border} strokeWidth={1} />
      {data.length > 1 ? <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2.5} /> : null}
      {data.map((d, i) => <React.Fragment key={`${d.label}-${i}`}>
        <Circle cx={x(i)} cy={y(d.value)} r={4} fill={colors.primary} />
        <SvgText x={x(i)} y={y(d.value) - 8} fontSize={10} fontWeight="bold" fill={colors.foreground} textAnchor="middle">{d.value.toFixed(1)}{unit}</SvgText>
        <SvgText x={x(i)} y={height - 8} fontSize={9} fill={colors.mutedForeground} textAnchor="middle">{d.label}</SvgText>
      </React.Fragment>)}
    </Svg>
  </View>;
}
