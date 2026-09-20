import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function MobileSectionNav({ items, activeId, onSelect, icons, styles }) {
  const scroll = useRef(null);
  const positions = useRef({});
  const [viewWidth, setViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const overflow = contentWidth > viewWidth + 2;
  const reveal = () => {
    const item = positions.current[activeId];
    if (!item || !viewWidth) return;
    if (item.x < offset || item.x + item.width > offset + viewWidth) scroll.current?.scrollTo({ x: Math.max(0, item.x - 8), animated: true });
  };
  useEffect(reveal, [activeId, viewWidth, contentWidth]);
  const arrow = (direction) => {
    const disabled = direction < 0 ? offset <= 2 : offset + viewWidth >= contentWidth - 2;
    return <Pressable accessibilityRole="button" accessibilityLabel={direction < 0 ? "Poprzednie sekcje" : "Kolejne sekcje"} disabled={disabled} onPress={() => scroll.current?.scrollTo({ x: Math.max(0, Math.min(contentWidth - viewWidth, offset + direction * viewWidth * 0.75)), animated: true })} style={{ width: 44, minHeight: 44, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.25 : 1 }}><MaterialCommunityIcons name={direction < 0 ? "chevron-left" : "chevron-right"} size={24} color="#e5bd73" /></Pressable>;
  };
  return <View style={styles.mobileTopSectionRail}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {overflow ? arrow(-1) : null}
      <ScrollView ref={scroll} horizontal accessibilityRole="tablist" showsHorizontalScrollIndicator={false} style={{ flex: 1 }} onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)} onContentSizeChange={(width) => setContentWidth(width)} onScroll={(e) => setOffset(e.nativeEvent.contentOffset.x)} scrollEventThrottle={32} contentContainerStyle={styles.mobileTopSectionRailContent}>
        {items.map((item) => <Pressable key={item.id} onLayout={(e) => { positions.current[item.id] = e.nativeEvent.layout; }} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: item.id === activeId }} onPress={() => onSelect(item.id)} style={[styles.mobileTopSectionChip, item.id === activeId && styles.mobileTopSectionChipActive]}>
          <View style={styles.mobileTopSectionInner}><MaterialCommunityIcons name={icons[item.id] || "circle-outline"} size={16} color={item.id === activeId ? "#f0c24d" : "#9098a7"} /><Text style={[styles.mobileTopSectionText, item.id === activeId && styles.mobileTopSectionTextActive]}>{item.label}</Text></View>
        </Pressable>)}
      </ScrollView>
      {overflow ? arrow(1) : null}
    </View>
    {overflow ? <Text style={{ color: "#ae9e82", fontSize: 10, paddingHorizontal: 12, paddingBottom: 4 }}>Sekcje · przesuń pasek lub użyj strzałek</Text> : null}
  </View>;
}
