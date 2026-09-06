import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Dữ liệu chúng tôi thu thập',
    body:
      'Thông tin tài khoản (tên, số điện thoại, email), hồ sơ sức khoẻ cơ bản do gia đình nhập ' +
      '(bệnh nền, dị ứng, nhóm máu, liên hệ khẩn cấp), tâm trạng check-in hàng ngày, lịch uống ' +
      'thuốc và lịch sử uống thuốc, sự cố SOS, và — nếu bật — hình ảnh/sự kiện từ camera an sinh.',
  },
  {
    heading: '2. Mục đích sử dụng',
    body:
      'Dữ liệu chỉ dùng để kết nối các thành viên trong gia đình, nhắc nhở chăm sóc và cảnh báo ' +
      'khẩn cấp. Chúng tôi không bán dữ liệu và không dùng cho quảng cáo.',
  },
  {
    heading: '3. Ai xem được dữ liệu',
    body:
      'Chỉ các thành viên gia đình đã được người cao tuổi chấp thuận liên kết. Family Feed chỉ hiển ' +
      'thị trạng thái tổng quát ("đã xử lý"/"chưa xử lý"), không nêu đích danh ai đã phản hồi.',
  },
  {
    heading: '4. Dữ liệu nhạy cảm',
    body:
      'Tâm trạng và chỉ số sức khoẻ là dữ liệu cá nhân nhạy cảm theo Nghị định 13/2023/NĐ-CP. ' +
      'Bạn cần đồng ý rõ ràng khi tạo hồ sơ; camera chỉ bật khi người cao tuổi tự chấp thuận và ' +
      'có thể tắt bất cứ lúc nào.',
  },
  {
    heading: '5. Lưu trữ & xoá',
    body:
      'Family Feed lưu 7 ngày với gói miễn phí. Ảnh camera tự xoá sau 30 ngày. Bạn có thể yêu cầu ' +
      'xoá tài khoản và toàn bộ dữ liệu liên quan bất cứ lúc nào qua mục Hồ sơ.',
  },
  {
    heading: '6. Liên hệ',
    body: 'Mọi thắc mắc về quyền riêng tư, vui lòng liên hệ đội ngũ CareNest trong ứng dụng.',
  },
];

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách quyền riêng tư</Text>
        <View style={{ width: 34 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          CareNest là ứng dụng kết nối gia đình. Chúng tôi chỉ thu thập dữ liệu tối thiểu cần thiết
          để giúp cha mẹ và con cái ở xa giữ liên lạc và an tâm về nhau.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 20, gap: 18 },
  intro: { fontSize: 14.5, color: Colors.textPrimary, lineHeight: 22 },
  section: { gap: 6 },
  heading: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  body: { fontSize: 13.5, color: Colors.textSecondary, lineHeight: 21 },
});
