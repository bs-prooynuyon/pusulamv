import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, View } from 'react-native';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

/** Profil fotoğrafı; yoksa boş insan simgesi. */
export function Avatar({ size }: { size: number }) {
  const { settings } = usePlanim();
  const colors = useColors();
  if (settings.profilePhoto) return <Image source={{ uri: settings.profilePhoto }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
    <Feather name="user" size={size * 0.5} color={colors.mutedForeground} />
  </View>;
}
